import { db } from "@/db";
import { webhookEvents, payments, paymentAttempts, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "crypto";
import { generateId } from "@/utils";
import { paymentService } from "./payment.service";
import { paymentAuditService } from "./payment-audit.service";
import { billingService } from "./billing.service";
import { skyPayAdapter } from "./providers/skypay/skypay.adapter";
import type { PaymentProviderId } from "./providers/types";
import { env } from "@/config/env";
import { ValidationError, NotFoundError } from "@/utils/errors";
import {
    khaltiLookupPayment,
    isKhaltiPaymentCompleted,
} from "./gateways/khalti.gateway";
import {
    decodeEsewaCallbackData,
    verifyEsewaTransactionStatus,
    isEsewaPaymentComplete,
} from "./gateways/esewa.gateway";

/** Verify the gateway-reported amount against the order total before confirming. */
async function verifyWebhookAmount(
    orderRef: string,
    gatewayAmountNpr: number | null,
    provider: PaymentProviderId
): Promise<void> {
    if (gatewayAmountNpr == null) return;
    const [orderRow] = await db
        .select({ totalAmount: orders.totalAmount })
        .from(orders)
        .where(eq(orders.id, orderRef))
        .limit(1);
    if (!orderRow) throw new NotFoundError("Order not found for webhook");
    const expected = Number(orderRow.totalAmount);
    if (Math.abs(expected - gatewayAmountNpr) > 0.01) {
        throw new ValidationError(
            `Webhook amount mismatch for ${provider}: gateway reported ${gatewayAmountNpr}, expected ${expected}`
        );
    }
}

/** Idempotent confirmation of a payment by order reference (webhook path). */
async function confirmOrderPayment(
    orderRef: string,
    eventId: string,
    provider: PaymentProviderId
): Promise<boolean> {    const [orderRow] = await db
        .select({ id: orders.id })
        .from(orders)
        .where(eq(orders.id, orderRef))
        .limit(1);

    if (orderRow) {
        const [payment] = await db
            .select()
            .from(payments)
            .where(eq(payments.orderId, orderRef))
            .limit(1);

        if (payment && payment.status === "PENDING") {
            await paymentService.confirmPayment(payment.id, `webhook-${provider}-${eventId}`);
            await db
                .update(paymentAttempts)
                .set({ status: "PAID", updatedAt: new Date() })
                .where(eq(paymentAttempts.paymentId, payment.id));
            return true;
        }
        return false;
    }

    // Not an order payment — fall back to billing intents.
    await billingService.markPaidFromWebhook(orderRef, `webhook-${provider}-${eventId}`);
    return true;
}

async function persistWebhookEvent(
    provider: PaymentProviderId,
    externalEventId: string,
    orderId: string | null,
    rawBody: string,
    signature: string | null
) {
    const [existing] = await db
        .select()
        .from(webhookEvents)
        .where(eq(webhookEvents.externalEventId, externalEventId))
        .limit(1);

    if (existing?.status === "PROCESSED") return { id: existing.id, duplicate: true };

    const whId = existing?.id ?? generateId();
    if (!existing) {
        await db.insert(webhookEvents).values({
            id: whId,
            provider,
            externalEventId,
            orderId,
            payload: JSON.parse(rawBody) as Record<string, unknown>,
            signature,
            status: "RECEIVED",
        });
    }
    return { id: whId, duplicate: false };
}

async function markProcessed(whId: string, orderId: string | null, error?: string) {
    await db
        .update(webhookEvents)
        .set({
            status: error ? "FAILED" : "PROCESSED",
            processedAt: error ? undefined : new Date(),
            errorMessage: error ?? null,
            orderId,
        })
        .where(eq(webhookEvents.id, whId));
}

export class WebhookProcessorService {
    /**
     * Khalti webhook (epayment API).
     * Khalti authenticates requests with an `Authorization: Khalti <secret>` header.
     * We never trust the body alone — the payment is looked up server-side by pidx.
     */
    async ingestKhalti(ctx: { headers: Record<string, string | undefined>; rawBody: string }) {
        const secret = env.KHALTI_SECRET_KEY?.trim();
        if (!secret) {
            throw new ValidationError("Khalti webhook rejected: merchant secret not configured");
        }

        const auth = ctx.headers["authorization"] ?? ctx.headers["Authorization"];
        const expected = `Khalti ${secret}`;
        if (auth !== expected) {
            throw new ValidationError("Khalti webhook rejected: invalid signature");
        }

        const body = JSON.parse(ctx.rawBody) as {
            pidx?: string;
            purchase_order_id?: string;
            status?: string;
        };
        const pidx = body.pidx;
        if (!pidx) {
            throw new ValidationError("Khalti webhook missing pidx");
        }

        // Server-side source of truth.
        const lookup = await khaltiLookupPayment(pidx);
        if (!isKhaltiPaymentCompleted(lookup.status)) {
            // Not completed yet — acknowledge but do not confirm.
            const orderId = body.purchase_order_id ?? null;
            const { id, duplicate } = await persistWebhookEvent(
                "KHALTI",
                `khalti-${pidx}`,
                orderId,
                ctx.rawBody,
                auth
            );
            await markProcessed(id, orderId);
            void duplicate;
            return { duplicate, eventId: `khalti-${pidx}`, status: lookup.status };
        }

        const orderRef = body.purchase_order_id ?? lookup.pidx;
        const eventId = `khalti-${pidx}`;
        const { id, duplicate } = await persistWebhookEvent("KHALTI", eventId, orderRef, ctx.rawBody, auth);
        if (duplicate) return { duplicate: true, eventId, status: lookup.status };

        try {
            await verifyWebhookAmount(orderRef, lookup.totalAmount / 100, "KHALTI");
            await confirmOrderPayment(orderRef, eventId, "KHALTI");
            await markProcessed(id, orderRef);
            await paymentAuditService.log({
                action: "WEBHOOK_PROCESSED",
                actorType: "WEBHOOK",
                orderId: orderRef,
                metadata: { provider: "KHALTI", eventId, status: lookup.status },
            });
            return { duplicate: false, eventId, status: lookup.status };
        } catch (err) {
            await markProcessed(id, orderRef, err instanceof Error ? err.message : "Unknown");
            throw err;
        }
    }

    /**
     * eSewa payment callback (form-post return URL pattern).
     * eSewa signs the base64 `data` payload with an HMAC-SHA256 of the merchant secret;
     * we verify it before performing the server-side status check.
     */
    async ingestEsewa(ctx: { headers: Record<string, string | undefined>; rawBody: string }) {
        const secret = env.ESEWA_SECRET_KEY?.trim();
        if (!secret) {
            throw new ValidationError("eSewa callback rejected: merchant secret not configured");
        }

        const body = JSON.parse(ctx.rawBody) as {
            data?: string;
            signature?: string;
            orderId?: string;
        };
        const dataParam = body.data;
        const providedSig = body.signature;
        if (!dataParam || !providedSig) {
            throw new ValidationError("eSewa callback missing data or signature");
        }

        // Verify HMAC-SHA256 of the raw base64 data string.
        const expected = createHmac("sha256", secret).update(dataParam).digest("base64");
        const providedBuf = Buffer.from(providedSig, "base64");
        const expectedBuf = Buffer.from(expected, "base64");
        if (
            providedBuf.length !== expectedBuf.length ||
            !timingSafeEqual(providedBuf, expectedBuf)
        ) {
            throw new ValidationError("eSewa callback rejected: invalid signature");
        }

        const payload = decodeEsewaCallbackData(dataParam);
        if (!payload?.transaction_uuid) {
            throw new ValidationError("eSewa callback contains an invalid payload");
        }

        const totalAmount = String(payload.total_amount);
        const statusCheck = await verifyEsewaTransactionStatus(
            payload.transaction_uuid,
            totalAmount
        );

        const orderRef = body.orderId ?? null;
        const eventId = `esewa-${payload.transaction_uuid}`;
        const { id, duplicate } = await persistWebhookEvent("ESEWA", eventId, orderRef, ctx.rawBody, providedSig);
        if (duplicate) return { duplicate: true, eventId, status: statusCheck.status };

        try {
            if (isEsewaPaymentComplete(statusCheck.status) && orderRef) {
                // The gateway verified the amount in its status response;
                // additionally cross-check against the order total.
                const paidAmount = Number(payload.total_amount);
                await verifyWebhookAmount(orderRef, paidAmount, "ESEWA");
                await confirmOrderPayment(orderRef, eventId, "ESEWA");
            } else if (!orderRef) {
                throw new NotFoundError("eSewa callback did not include an order reference");
            }
            await markProcessed(id, orderRef);
            await paymentAuditService.log({
                action: "WEBHOOK_PROCESSED",
                actorType: "WEBHOOK",
                orderId: orderRef,
                metadata: { provider: "ESEWA", eventId, status: statusCheck.status },
            });
            return { duplicate: false, eventId, status: statusCheck.status };
        } catch (err) {
            await markProcessed(id, orderRef, err instanceof Error ? err.message : "Unknown");
            throw err;
        }
    }

    async ingest(
        provider: PaymentProviderId,
        ctx: { headers: Record<string, string | undefined>; rawBody: string }
    ) {
        const adapter =
            provider === "SKYPAY"
                ? skyPayAdapter
                : null;

        if (!adapter) {
            throw new Error(`Webhook adapter not registered for ${provider}`);
        }

        const parsed = await adapter.handleWebhook(ctx);
        const eventId = parsed.eventId || generateId();

        const [existing] = await db
            .select()
            .from(webhookEvents)
            .where(eq(webhookEvents.externalEventId, eventId))
            .limit(1);

        if (existing?.status === "PROCESSED") {
            return { duplicate: true, eventId };
        }

        const whId = existing?.id ?? generateId();
        if (!existing) {
            await db.insert(webhookEvents).values({
                id: whId,
                provider,
                externalEventId: eventId,
                orderId: parsed.orderId ?? null,
                payload: JSON.parse(ctx.rawBody) as Record<string, unknown>,
                signature:
                    ctx.headers["x-skypay-signature"] ??
                    ctx.headers["x-signature"] ??
                    null,
                status: "RECEIVED",
            });
        }

        try {
            if (parsed.orderId && parsed.status === "PAID") {
                const merchantRef = parsed.orderId;
                const [orderRow] = await db
                    .select({ id: orders.id })
                    .from(orders)
                    .where(eq(orders.id, merchantRef))
                    .limit(1);

                if (orderRow) {
                    const [payment] = await db
                        .select()
                        .from(payments)
                        .where(eq(payments.orderId, merchantRef))
                        .limit(1);

                    if (payment && payment.status === "PENDING") {
                        await paymentService.confirmPayment(
                            payment.id,
                            `webhook-${eventId}`
                        );
                        await db
                            .update(paymentAttempts)
                            .set({ status: "PAID", updatedAt: new Date() })
                            .where(eq(paymentAttempts.paymentId, payment.id));
                    }
                } else {
                    await billingService.markPaidFromWebhook(
                        merchantRef,
                        `webhook-${eventId}`
                    );
                }
            }

            await db
                .update(webhookEvents)
                .set({
                    status: "PROCESSED",
                    processedAt: new Date(),
                    orderId: parsed.orderId ?? null,
                })
                .where(eq(webhookEvents.id, whId));

            await paymentAuditService.log({
                action: "WEBHOOK_PROCESSED",
                actorType: "WEBHOOK",
                orderId: parsed.orderId,
                metadata: { provider, eventId, status: parsed.status },
            });

            return { duplicate: false, eventId, status: parsed.status };
        } catch (err) {
            await db
                .update(webhookEvents)
                .set({
                    status: "FAILED",
                    errorMessage: err instanceof Error ? err.message : "Unknown",
                })
                .where(eq(webhookEvents.id, whId));
            throw err;
        }
    }
}

export const webhookProcessorService = new WebhookProcessorService();
