import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { couponService } from "./coupon.service";
import { success, created } from "@/utils/response";

export const growthController = new Elysia({ prefix: "/api/v1/growth" })
    .get("/subscription-plans", async () => {
        const { subscriptionService } = await import("./subscription.service");
        const plans = await subscriptionService.listPlans();
        return success(plans);
    })

    .use(requireAuth())

    .group("/subscription", (app) =>
        app
            .get("/me", async ({ auth }) => {
                const { subscriptionService } = await import("./subscription.service");
                const sub = await subscriptionService.getActiveSubscription(auth.userId);
                return success(sub);
            })
            .post(
                "/subscribe",
                async ({ auth, body, set }) => {
                    const { subscriptionService } = await import("./subscription.service");
                    const res = await subscriptionService.subscribe(
                        auth.userId,
                        body.planId,
                        body.paymentMethod,
                        body.paymentToken
                    );
                    set.status = 201;
                    return created(res);
                },
                {
                    body: t.Object({
                        planId: t.String({ minLength: 1 }),
                        paymentMethod: t.Union([
                            t.Literal("ESEWA"),
                            t.Literal("KHALTI"),
                            t.Literal("CARD"),
                        ]),
                        paymentToken: t.String({ minLength: 1 }),
                    }),
                }
            )
            .post("/cancel", async ({ auth }) => {
                const { subscriptionService } = await import("./subscription.service");
                return success(await subscriptionService.cancel(auth.userId));
            })
    )

    .post(
        "/coupon/validate",
        async ({ body, auth }) => {
            const result = await couponService.validateCoupon(
                body.code.trim().toUpperCase(),
                body.storeId,
                auth.userId,
                body.orderValue
            );
            return success({
                valid: true,
                discountAmount: result.discountAmount,
                couponId: result.couponId,
            });
        },
        {
            body: t.Object({
                code: t.String({ minLength: 2 }),
                storeId: t.String({ minLength: 1 }),
                orderValue: t.Number({ minimum: 0 }),
            }),
        }
    )

    .get("/loyalty", async ({ auth }) => {
        return success({ points: 0, userId: auth.userId });
    });
