import { db } from "@/db";
import {
    billingIntents,
    subscriptionPlans,
    storeMarketingPlans,
    users,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { generateId, NotFoundError, ValidationError } from "@/utils";
import {
    amountToPaisa,
    getBillingReturnUrl,
    getPaymentCapabilities,
} from "@/config/payments";
import { resolvePaymentProvider } from "./providers/payment-provider.registry";
import type { PaymentChannel } from "./providers/types";
import { paymentAuditService } from "./payment-audit.service";
import { subscriptionService } from "@/modules/growth/subscription.service";
import { storeMarketingService } from "@/modules/growth/store-marketing.service";

export type BillingPurpose = "SUBSCRIPTION" | "STORE_MARKETING";

export class BillingService {
    private async resolveAmount(
        purpose: BillingPurpose,
        referenceId: string
    ): Promise<{ amountNpr: number; label: string }> {
        if (purpose === "SUBSCRIPTION") {
            const [plan] = await db
                .select()
                .from(subscriptionPlans)
                .where(
                    and(
                        eq(subscriptionPlans.id, referenceId),
                        eq(subscriptionPlans.isActive, true)
                    )
                );
            if (!plan) throw new NotFoundError("Subscription plan");
            return { amountNpr: Number(plan.price), label: plan.name };
        }

        const [plan] = await db
            .select()
            .from(storeMarketingPlans)
            .where(
                and(
                    eq(storeMarketingPlans.id, referenceId),
                    eq(storeMarketingPlans.isActive, true)
                )
            );
        if (!plan) throw new NotFoundError("Shop tier plan");
        return { amountNpr: Number(plan.monthlyPrice), label: plan.name };
    }

    async createIntent(input: {
        payerUserId: string;
        payerType: "CUSTOMER" | "STORE";
        storeId?: string;
        purpose: BillingPurpose;
        referenceId: string;
    }) {
        const { amountNpr } = await this.resolveAmount(input.purpose, input.referenceId);
        const idempotencyKey = `billing-${input.purpose}-${input.referenceId}-${input.payerUserId}`;

        const [existing] = await db
            .select()
            .from(billingIntents)
            .where(eq(billingIntents.idempotencyKey, idempotencyKey))
            .limit(1);

        if (existing?.status === "PAID") {
            throw new ValidationError("This plan is already paid for");
        }

        if (existing?.status === "PENDING") {
            return existing;
        }

        const id = generateId();
        const [intent] = await db
            .insert(billingIntents)
            .values({
                id,
                payerUserId: input.payerUserId,
                payerType: input.payerType,
                storeId: input.storeId ?? null,
                purpose: input.purpose,
                referenceId: input.referenceId,
                amount: String(amountNpr),
                status: "PENDING",
                idempotencyKey,
            })
            .returning();

        return intent;
    }

    async initializePayment(
        payerUserId: string,
        billingIntentId: string,
        channel: PaymentChannel
    ) {
        if (channel === "COD") {
            throw new ValidationError("Cash on delivery is not available for subscriptions");
        }

        const [intent] = await db
            .select()
            .from(billingIntents)
            .where(
                and(
                    eq(billingIntents.id, billingIntentId),
                    eq(billingIntents.payerUserId, payerUserId)
                )
            );
        if (!intent) throw new NotFoundError("Billing intent");
        if (intent.status === "PAID") {
            throw new ValidationError("Already paid");
        }

        const amountNpr = Number(intent.amount);
        const caps = getPaymentCapabilities();
        if (amountToPaisa(amountNpr) < caps.minOnlineAmountPaisa) {
            throw new ValidationError("Minimum online payment is Rs. 10");
        }

        const provider = resolvePaymentProvider(channel);
        const [customer] = await db
            .select({ name: users.name, phone: users.phone, email: users.email })
            .from(users)
            .where(eq(users.id, payerUserId))
            .limit(1);

        const init = await provider.initializePayment({
            paymentId: billingIntentId,
            orderId: billingIntentId,
            amountNpr,
            channel,
            idempotencyKey: intent.idempotencyKey ?? billingIntentId,
            customer: {
                userId: payerUserId,
                name: customer?.name ?? undefined,
                email: customer?.email ?? undefined,
                phone: customer?.phone ?? undefined,
            },
            returnUrl: getBillingReturnUrl(billingIntentId, intent.purpose, channel),
            metadata: { purpose: intent.purpose, referenceId: intent.referenceId },
        });

        await db
            .update(billingIntents)
            .set({
                channel,
                provider: init.provider,
                providerRef: init.providerRef ?? null,
                metadata: init as unknown as Record<string, unknown>,
                updatedAt: new Date(),
            })
            .where(eq(billingIntents.id, billingIntentId));

        await paymentAuditService.log({
            action: "BILLING_INITIATED",
            actorType: "CUSTOMER",
            actorId: payerUserId,
            metadata: {
                billingIntentId,
                purpose: intent.purpose,
                channel,
                provider: init.provider,
            },
        });

        return {
            billingIntentId,
            purpose: intent.purpose,
            amountNpr,
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

    async verifyAndFulfill(
        payerUserId: string,
        billingIntentId: string,
        callback: Record<string, unknown>
    ) {
        const [intent] = await db
            .select()
            .from(billingIntents)
            .where(
                and(
                    eq(billingIntents.id, billingIntentId),
                    eq(billingIntents.payerUserId, payerUserId)
                )
            );
        if (!intent) throw new NotFoundError("Billing intent");
        if (intent.status === "PAID") {
            return { verified: true, alreadyPaid: true, purpose: intent.purpose };
        }

        const channel = (intent.channel ?? callback.channel ?? "KHALTI") as PaymentChannel;
        const provider = resolvePaymentProvider(channel);
        const meta = (intent.metadata ?? {}) as { providerRef?: string };

        const verified = await provider.verifyPayment({
            paymentId: billingIntentId,
            orderId: billingIntentId,
            channel,
            providerRef: intent.providerRef ?? meta.providerRef,
            callbackData: callback,
        });

        if (!verified.success) {
            await db
                .update(billingIntents)
                .set({ status: "FAILED", updatedAt: new Date() })
                .where(eq(billingIntents.id, billingIntentId));
            throw new ValidationError("Payment verification failed");
        }

        await db
            .update(billingIntents)
            .set({
                status: "PAID",
                providerRef: verified.providerRef ?? intent.providerRef,
                paidAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(billingIntents.id, billingIntentId));

        let fulfillment: Record<string, unknown> = {};
        if (intent.purpose === "SUBSCRIPTION") {
            const sub = await subscriptionService.activateAfterPayment(
                payerUserId,
                intent.referenceId,
                verified.providerRef ?? billingIntentId
            );
            fulfillment = { subscription: sub };
        } else if (intent.purpose === "STORE_MARKETING" && intent.storeId) {
            const sub = await storeMarketingService.activateAfterPayment(
                intent.storeId,
                intent.referenceId,
                verified.providerRef ?? billingIntentId
            );
            fulfillment = { storeSubscription: sub };
        }

        await paymentAuditService.log({
            action: "BILLING_CAPTURED",
            actorType: "CUSTOMER",
            actorId: payerUserId,
            metadata: {
                billingIntentId,
                purpose: intent.purpose,
                provider: verified.provider,
            },
        });

        return { verified: true, purpose: intent.purpose, ...fulfillment };
    }

    async findIntentByMerchantRef(merchantOrderId: string) {
        const [intent] = await db
            .select()
            .from(billingIntents)
            .where(eq(billingIntents.id, merchantOrderId))
            .limit(1);
        return intent ?? null;
    }

    async markPaidFromWebhook(billingIntentId: string, providerRef: string) {
        const [intent] = await db
            .select()
            .from(billingIntents)
            .where(eq(billingIntents.id, billingIntentId))
            .limit(1);
        if (!intent || intent.status === "PAID") return { skipped: true };

        await db
            .update(billingIntents)
            .set({
                status: "PAID",
                providerRef,
                paidAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(billingIntents.id, billingIntentId));

        if (intent.purpose === "SUBSCRIPTION") {
            await subscriptionService.activateAfterPayment(
                intent.payerUserId,
                intent.referenceId,
                providerRef
            );
        } else if (intent.purpose === "STORE_MARKETING" && intent.storeId) {
            await storeMarketingService.activateAfterPayment(
                intent.storeId,
                intent.referenceId,
                providerRef
            );
        }

        return { skipped: false };
    }
}

export const billingService = new BillingService();
