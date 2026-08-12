import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireTenant } from "@/middlewares/tenant";
import { requireSellerPermission } from "@/middlewares/seller-store-permission";
import { success, created } from "@/utils/response";
import { billingService } from "./billing.service";
import type { PaymentChannel } from "./providers/types";

const channelSchema = t.Union([
    t.Literal("ESEWA"),
    t.Literal("KHALTI"),
    t.Literal("FONEPAY_QR"),
]);

const verifyBody = t.Object({
    billingIntentId: t.String({ minLength: 8 }),
    callback: t.Optional(t.Record(t.String(), t.Unknown())),
});

export const billingController = new Elysia({ prefix: "/api/v1/billing" })
    .use(requireAuth())
    .group("/subscription", (app) =>
        app
            .post(
                "/intent",
                async ({ auth, body, set }) => {
                    const intent = await billingService.createIntent({
                        payerUserId: auth.userId!,
                        payerType: "CUSTOMER",
                        purpose: "SUBSCRIPTION",
                        referenceId: body.planId,
                    });
                    set.status = 201;
                    return created({
                        billingIntentId: intent.id,
                        amountNpr: Number(intent.amount),
                        purpose: intent.purpose,
                    });
                },
                { body: t.Object({ planId: t.String({ minLength: 1 }) }) }
            )
            .post(
                "/checkout/init",
                async ({ auth, body }) => {
                    let intentId = body.billingIntentId;
                    if (!intentId) {
                        const intent = await billingService.createIntent({
                            payerUserId: auth.userId!,
                            payerType: "CUSTOMER",
                            purpose: "SUBSCRIPTION",
                            referenceId: body.planId,
                        });
                        intentId = intent.id;
                    }
                    return success(
                        await billingService.initializePayment(
                            auth.userId!,
                            intentId,
                            body.channel as PaymentChannel
                        )
                    );
                },
                {
                    body: t.Object({
                        planId: t.String({ minLength: 1 }),
                        channel: channelSchema,
                        billingIntentId: t.Optional(t.String()),
                    }),
                }
            )
            .post(
                "/checkout/verify",
                async ({ auth, body }) =>
                    success(
                        await billingService.verifyAndFulfill(
                            auth.userId!,
                            body.billingIntentId,
                            body.callback ?? {}
                        )
                    ),
                { body: verifyBody }
            )
    )
    .group("/store-tier", (app) =>
        app
            .use(requireTenant())
            .use(requireSellerPermission("promotions.manage"))
            .post(
                "/intent",
                async ({ auth, tenantId, body, set }) => {
                    const intent = await billingService.createIntent({
                        payerUserId: auth.userId!,
                        payerType: "STORE",
                        storeId: tenantId!,
                        purpose: "STORE_MARKETING",
                        referenceId: body.planId,
                    });
                    set.status = 201;
                    return created({
                        billingIntentId: intent.id,
                        amountNpr: Number(intent.amount),
                        purpose: intent.purpose,
                    });
                },
                { body: t.Object({ planId: t.String({ minLength: 1 }) }) }
            )
            .post(
                "/checkout/init",
                async ({ auth, tenantId, body }) => {
                    let intentId = body.billingIntentId;
                    if (!intentId) {
                        const intent = await billingService.createIntent({
                            payerUserId: auth.userId!,
                            payerType: "STORE",
                            storeId: tenantId!,
                            purpose: "STORE_MARKETING",
                            referenceId: body.planId,
                        });
                        intentId = intent.id;
                    }
                    return success(
                        await billingService.initializePayment(
                            auth.userId!,
                            intentId,
                            body.channel as PaymentChannel
                        )
                    );
                },
                {
                    body: t.Object({
                        planId: t.String({ minLength: 1 }),
                        channel: channelSchema,
                        billingIntentId: t.Optional(t.String()),
                    }),
                }
            )
            .post(
                "/checkout/verify",
                async ({ auth, body }) =>
                    success(
                        await billingService.verifyAndFulfill(
                            auth.userId!,
                            body.billingIntentId,
                            body.callback ?? {}
                        )
                    ),
                { body: verifyBody }
            )
    );
