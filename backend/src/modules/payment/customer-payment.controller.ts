import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { success } from "@/utils/response";
import { getPaymentCapabilities } from "@/config/payments";
import { onlinePaymentService } from "./online-payment.service";
import { paymentOrchestratorService } from "./payment-orchestrator.service";
import type { PaymentChannel } from "./providers/types";
import { verifyPaymentLaunchToken } from "@/utils/payment-launch-token";

export const customerPaymentController = new Elysia({ prefix: "/api/v1/payment" })
    .get(
        "/config",
        () => {
            return success(getPaymentCapabilities());
        },
        {
            detail: {
                tags: ["Payment"],
                summary: "Which payment methods are enabled on this deployment",
            },
        }
    )
    .get(
        "/esewa/redirect",
        async ({ query, set }) => {
            const verified = verifyPaymentLaunchToken(query.t, query.orderId);
            if (!verified) {
                set.status = 403;
                return "Invalid or expired payment link.";
            }
            set.headers["content-type"] = "text/html; charset=utf-8";
            return onlinePaymentService.renderEsewaRedirectPage(
                query.orderId,
                verified.userId
            );
        },
        {
            query: t.Object({
                orderId: t.String({ minLength: 8 }),
                t: t.String({ minLength: 16 }),
            }),
            detail: {
                tags: ["Payment"],
                summary: "Browser redirect — auto-submit eSewa payment form",
            },
        }
    )
    .use(requireAuth())
    .post(
        "/checkout/init",
        async ({ auth, body }) => {
            if (!auth.userId) throw new Error("Unauthorized");
            const channel = body.channel as PaymentChannel;
            const result = await paymentOrchestratorService.initializeCheckout(
                auth.userId,
                body.orderId,
                channel
            );
            return success(result);
        },
        {
            body: t.Object({
                orderId: t.String({ minLength: 8 }),
                channel: t.Union([
                    t.Literal("COD"),
                    t.Literal("ESEWA"),
                    t.Literal("KHALTI"),
                    t.Literal("FONEPAY_QR"),
                ]),
            }),
            detail: {
                tags: ["Payment"],
                summary: "Provider-agnostic checkout init (SkyPay or direct adapters)",
            },
        }
    )
    .post(
        "/checkout/verify",
        async ({ auth, body }) => {
            if (!auth.userId) throw new Error("Unauthorized");
            const result = await paymentOrchestratorService.verifyAndCapture(
                auth.userId,
                body.orderId,
                body.callback ?? {}
            );
            return success({
                verified: result.verified,
                paymentId: result.paymentId,
                order: result.order,
            });
        },
        {
            body: t.Object({
                orderId: t.String({ minLength: 8 }),
                callback: t.Optional(t.Record(t.String(), t.Unknown())),
            }),
            detail: {
                tags: ["Payment"],
                summary: "Verify payment after return URL / deep link",
            },
        }
    )
    .post(
        "/khalti/verify",
        async ({ auth, body }) => {
            if (!auth.userId) throw new Error("Unauthorized");
            const order = await onlinePaymentService.verifyKhalti(
                auth.userId,
                body.orderId,
                body.pidx
            );
            return success({ order, verified: true });
        },
        {
            body: t.Object({
                orderId: t.String({ minLength: 8 }),
                pidx: t.String({ minLength: 8 }),
            }),
            detail: {
                tags: ["Payment"],
                summary: "Verify Khalti payment after customer returns from checkout",
            },
        }
    )
    .post(
        "/esewa/verify",
        async ({ auth, body }) => {
            if (!auth.userId) throw new Error("Unauthorized");
            const order = await onlinePaymentService.verifyEsewa(
                auth.userId,
                body.orderId,
                body.data
            );
            return success({ order, verified: true });
        },
        {
            body: t.Object({
                orderId: t.String({ minLength: 8 }),
                data: t.String({ minLength: 8 }),
            }),
            detail: {
                tags: ["Payment"],
                summary: "Verify live eSewa payment after customer returns from checkout",
            },
        }
    )
    .post(
        "/esewa/mock-verify",
        async ({ auth, body }) => {
            if (!auth.userId) throw new Error("Unauthorized");
            const order = await onlinePaymentService.verifyEsewaMock(
                auth.userId,
                body.orderId,
                body.paymentId
            );
            return success({ order, verified: true });
        },
        {
            body: t.Object({
                orderId: t.String({ minLength: 8 }),
                paymentId: t.String({ minLength: 8 }),
            }),
            detail: {
                tags: ["Payment"],
                summary: "Dev-only eSewa mock confirmation",
            },
        }
    )
    .post(
        "/khalti/retry",
        async ({ auth, body }) => {
            if (!auth.userId) throw new Error("Unauthorized");
            const onlinePayment = await onlinePaymentService.startKhaltiCheckout(
                auth.userId,
                body.orderId
            );
            return success(onlinePayment);
        },
        {
            body: t.Object({
                orderId: t.String({ minLength: 8 }),
            }),
            detail: {
                tags: ["Payment"],
                summary: "Re-open Khalti checkout for an unpaid order",
            },
        }
    )
    .post(
        "/esewa/retry",
        async ({ auth, body }) => {
            if (!auth.userId) throw new Error("Unauthorized");
            const onlinePayment = await onlinePaymentService.startEsewaCheckout(
                auth.userId,
                body.orderId
            );
            return success(onlinePayment);
        },
        {
            body: t.Object({
                orderId: t.String({ minLength: 8 }),
            }),
            detail: {
                tags: ["Payment"],
                summary: "Re-open eSewa checkout for an unpaid order",
            },
        }
    );
