import { db } from "@/db";
import { orders, payments, paymentAttempts, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { generateId, NotFoundError, ValidationError } from "@/utils";
import { paymentService } from "./payment.service";
import { paymentAuditService } from "./payment-audit.service";
import { resolvePaymentProvider } from "./providers/payment-provider.registry";
import type { PaymentChannel } from "./providers/types";
import {
    getEsewaReturnUrl,
    getKhaltiReturnUrl,
    getPaymentCapabilities,
    amountToPaisa,
} from "@/config/payments";

export function orderMethodToChannel(method: string): PaymentChannel {
    switch (method) {
        case "COD":
            return "COD";
        case "KHALTI":
            return "KHALTI";
        case "ESEWA":
            return "ESEWA";
        default:
            throw new ValidationError(`Unsupported order payment method: ${method}`);
    }
}

export function channelToOrderMethod(channel: PaymentChannel): "COD" | "KHALTI" | "ESEWA" {
    if (channel === "FONEPAY_QR") {
        throw new ValidationError("Map FONEPAY_QR to ESEWA or KHALTI at order creation for now");
    }
    if (channel === "COD" || channel === "KHALTI" || channel === "ESEWA") {
        return channel;
    }
    throw new ValidationError(`Cannot map channel ${channel} to order payment method`);
}

export class PaymentOrchestratorService {
    private async loadPayableOrder(userId: string, orderId: string) {
        const order = await db.query.orders.findFirst({
            where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
        });
        if (!order) throw new NotFoundError("Order");
        if (order.paymentStatus === "PAID") {
            throw new ValidationError("Order is already paid");
        }
        return order;
    }

    private returnUrlFor(channel: PaymentChannel, orderId: string): string {
        if (channel === "ESEWA") return getEsewaReturnUrl(orderId);
        return getKhaltiReturnUrl(orderId);
    }

    async initializeCheckout(
        userId: string,
        orderId: string,
        channel: PaymentChannel
    ) {
        const order = await this.loadPayableOrder(userId, orderId);
        const orderMethod = channelToOrderMethod(channel);
        if (order.paymentMethod !== orderMethod) {
            await db.update(orders)
                .set({ paymentMethod: orderMethod })
                .where(eq(orders.id, orderId));
            order.paymentMethod = orderMethod;
        }

        if (
            channel === "FONEPAY_QR" &&
            order.paymentMethod !== "KHALTI" &&
            order.paymentMethod !== "ESEWA"
        ) {
            throw new ValidationError("Fonepay QR requires Khalti or eSewa order method");
        }

        const amountNpr = Number(order.totalAmount);
        const caps = getPaymentCapabilities();
        if (channel !== "COD") {
            const paisa = amountToPaisa(amountNpr);
            if (paisa < caps.minOnlineAmountPaisa) {
                throw new ValidationError("Minimum online payment is Rs. 10");
            }
        }

        const idempotencyKey = `checkout-${orderId}-${channel}`;
        const [existingAttempt] = await db
            .select()
            .from(paymentAttempts)
            .where(
                and(
                    eq(paymentAttempts.orderId, orderId),
                    eq(paymentAttempts.idempotencyKey, idempotencyKey)
                )
            )
            .limit(1);

        if (existingAttempt?.status === "PAID") {
            throw new ValidationError("Payment already completed");
        }

        let payment = await db.query.payments.findFirst({
            where: and(eq(payments.orderId, orderId), eq(payments.status, "PENDING")),
        });

        if (!payment) {
            payment = await paymentService.createPaymentIntent(
                orderId,
                orderMethod,
                amountNpr,
                idempotencyKey,
                userId
            );
        }

        const provider = resolvePaymentProvider(channel);
        const [customer] = await db
            .select({ name: users.name, phone: users.phone, email: users.email })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        const init = await provider.initializePayment({
            paymentId: payment.id,
            orderId,
            amountNpr,
            channel,
            idempotencyKey,
            customer: {
                userId,
                name: customer?.name ?? undefined,
                email: customer?.email ?? undefined,
                phone: customer?.phone ?? undefined,
            },
            returnUrl: this.returnUrlFor(channel, orderId),
            metadata: { storeId: order.storeId },
        });

        const attemptId = existingAttempt?.id ?? generateId();
        if (existingAttempt) {
            await db
                .update(paymentAttempts)
                .set({
                    status: init.status,
                    providerRef: init.providerRef ?? null,
                    metadata: init as unknown as Record<string, unknown>,
                    updatedAt: new Date(),
                })
                .where(eq(paymentAttempts.id, existingAttempt.id));
        } else {
            await db.insert(paymentAttempts).values({
                id: attemptId,
                paymentId: payment.id,
                orderId,
                provider: init.provider,
                channel: init.channel,
                amount: String(amountNpr),
                status: init.status,
                providerRef: init.providerRef ?? null,
                idempotencyKey,
                returnUrl: this.returnUrlFor(channel, orderId),
                metadata: init as unknown as Record<string, unknown>,
                expiresAt: init.expiresAt ?? null,
            });
        }

        await db
            .update(payments)
            .set({
                metadata: {
                    provider: init.provider,
                    channel: init.channel,
                    providerRef: init.providerRef,
                    attemptId,
                },
                updatedAt: new Date(),
            })
            .where(eq(payments.id, payment.id));

        await paymentAuditService.log({
            action: "PAYMENT_INITIATED",
            actorType: "CUSTOMER",
            actorId: userId,
            orderId,
            paymentId: payment.id,
            metadata: { channel, provider: init.provider },
        });

        return {
            paymentId: payment.id,
            attemptId,
            channel: init.channel,
            provider: init.provider,
            status: init.status,
            paymentUrl: init.paymentUrl,
            qrPayload: init.qrPayload,
            deepLink: init.deepLink,
            providerRef: init.providerRef,
            formPost: init.formPost,
            mock: init.mock,
        };
    }

    async verifyAndCapture(
        userId: string,
        orderId: string,
        callback: Record<string, unknown>
    ) {
        const order = await db.query.orders.findFirst({
            where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
        });
        if (!order) throw new NotFoundError("Order");

        const channel = orderMethodToChannel(order.paymentMethod);
        const provider = resolvePaymentProvider(channel);

        const [payment] = await db
            .select()
            .from(payments)
            .where(eq(payments.orderId, orderId))
            .limit(1);
        if (!payment) throw new NotFoundError("Payment");

        if (order.paymentStatus === "PAID") {
            const { presentOrderForCustomer } = await import(
                "@/modules/order/order.presenter"
            );
            const fullOrder = await db.query.orders.findFirst({
                where: eq(orders.id, orderId),
                with: {
                    store: true,
                    items: true,
                    deliveryAddress: true,
                    history: {
                        orderBy: (history, { desc }) => [desc(history.createdAt)],
                    },
                },
            });
            if (!fullOrder) throw new NotFoundError("Order");
            return {
                verified: true,
                paymentId: payment.id,
                order: presentOrderForCustomer(fullOrder),
            };
        }

        const meta = (payment.metadata ?? {}) as { providerRef?: string };
        const verified = await provider.verifyPayment({
            paymentId: payment.id,
            orderId,
            channel,
            providerRef: meta.providerRef,
            callbackData: callback,
        });

        if (!verified.success) {
            await db
                .update(paymentAttempts)
                .set({ status: "FAILED", updatedAt: new Date() })
                .where(eq(paymentAttempts.paymentId, payment.id));
            await paymentAuditService.log({
                action: "PAYMENT_VERIFY_FAILED",
                actorType: "CUSTOMER",
                actorId: userId,
                orderId,
                paymentId: payment.id,
                metadata: callback,
            });
            throw new ValidationError("Payment verification failed");
        }

        await paymentService.confirmPayment(
            payment.id,
            verified.providerRef ?? meta.providerRef ?? payment.gatewayRef ?? `verified-${payment.id}`
        );

        await db
            .update(paymentAttempts)
            .set({ status: "PAID", updatedAt: new Date() })
            .where(eq(paymentAttempts.paymentId, payment.id));

        await paymentAuditService.log({
            action: "PAYMENT_CAPTURED",
            actorType: "CUSTOMER",
            actorId: userId,
            orderId,
            paymentId: payment.id,
            metadata: { provider: verified.provider },
        });

        const fullOrder = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
            with: {
                store: true,
                items: true,
                deliveryAddress: true,
                history: {
                    orderBy: (history, { desc }) => [desc(history.createdAt)],
                },
            },
        });
        if (!fullOrder) throw new NotFoundError("Order");

        const { presentOrderForCustomer } = await import(
            "@/modules/order/order.presenter"
        );

        return {
            verified: true,
            paymentId: payment.id,
            order: presentOrderForCustomer(fullOrder),
        };
    }
}

export const paymentOrchestratorService = new PaymentOrchestratorService();
