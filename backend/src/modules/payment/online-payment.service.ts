import { db } from "@/db";
import { orders, payments, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { generateId, NotFoundError, ValidationError, ForbiddenError } from "@/utils";
import { paymentService } from "./payment.service";
import {
    amountToPaisa,
    getEsewaReturnUrl,
    getKhaltiReturnUrl,
    getPaymentCapabilities,
    getPublicApiUrl,
    getWebsiteUrl,
    isEsewaEnabled,
    isEsewaLiveEnabled,
    isKhaltiEnabled,
} from "@/config/payments";
import { createPaymentLaunchToken } from "@/utils/payment-launch-token";
import {
    buildEsewaPaymentForm,
    decodeEsewaCallbackData,
    isEsewaPaymentComplete,
    verifyEsewaTransactionStatus,
} from "./gateways/esewa.gateway";
import {
    khaltiInitiatePayment,
    khaltiLookupPayment,
    isKhaltiPaymentCompleted,
} from "./gateways/khalti.gateway";
import { presentOrderForCustomer } from "@/modules/order/order.presenter";
import { env } from "@/config/env";

export type OnlinePaymentStartResult = {
    provider: "KHALTI" | "ESEWA";
    paymentId: string;
    paymentUrl: string;
    pidx?: string;
    mock?: boolean;
    formPost?: { action: string; fields: Record<string, string> };
};

export class OnlinePaymentService {
    private async loadPayableOrder(userId: string, orderId: string) {
        const order = await db.query.orders.findFirst({
            where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
            with: { items: true, store: true, history: true, deliveryAddress: true },
        });
        if (!order) throw new NotFoundError("Order");
        if (order.paymentMethod !== "KHALTI" && order.paymentMethod !== "ESEWA") {
            throw new ValidationError("This order does not use online payment");
        }
        if (order.paymentStatus === "PAID") {
            throw new ValidationError("This order is already paid");
        }
        return order;
    }

    private async ensurePaymentRecord(
        orderId: string,
        method: "KHALTI" | "ESEWA",
        amount: string,
        userId: string
    ) {
        const [existing] = await db
            .select()
            .from(payments)
            .where(and(eq(payments.orderId, orderId), eq(payments.status, "PENDING")))
            .limit(1);
        if (existing) return existing;

        return paymentService.createPaymentIntent(
            orderId,
            method,
            Number(amount),
            `pay-${orderId}`,
            userId
        );
    }

    async startKhaltiCheckout(userId: string, orderId: string): Promise<OnlinePaymentStartResult> {
        if (!isKhaltiEnabled()) {
            throw new ValidationError("Khalti payments are not available right now");
        }

        const order = await this.loadPayableOrder(userId, orderId);
        if (order.paymentMethod !== "KHALTI") {
            throw new ValidationError("Order is not a Khalti checkout");
        }

        const caps = getPaymentCapabilities();
        const amountPaisa = amountToPaisa(Number(order.totalAmount));
        if (amountPaisa < caps.minOnlineAmountPaisa) {
            throw new ValidationError("Online payments require a minimum order of Rs. 10");
        }

        const [customer] = await db
            .select({ name: users.name, phone: users.phone, email: users.email })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        const payment = await this.ensurePaymentRecord(
            orderId,
            "KHALTI",
            String(order.totalAmount),
            userId
        );

        const initiated = await khaltiInitiatePayment({
            amountPaisa,
            purchaseOrderId: orderId,
            purchaseOrderName: `GoPasal order ${orderId.slice(-8)}`,
            returnUrl: getKhaltiReturnUrl(orderId),
            websiteUrl: getWebsiteUrl(),
            customerName: customer?.name ?? undefined,
            customerEmail: customer?.email ?? undefined,
            customerPhone: customer?.phone ?? undefined,
        });

        await db
            .update(payments)
            .set({
                metadata: { pidx: initiated.pidx, provider: "KHALTI" },
                updatedAt: new Date(),
            })
            .where(eq(payments.id, payment.id));

        return {
            provider: "KHALTI",
            paymentId: payment.id,
            paymentUrl: initiated.paymentUrl,
            pidx: initiated.pidx,
        };
    }

    async startEsewaCheckout(userId: string, orderId: string): Promise<OnlinePaymentStartResult> {
        if (!isEsewaLiveEnabled()) {
            return this.startEsewaMockCheckout(userId, orderId);
        }

        const order = await this.loadPayableOrder(userId, orderId);
        if (order.paymentMethod !== "ESEWA") {
            throw new ValidationError("Order is not an eSewa checkout");
        }

        const payment = await this.ensurePaymentRecord(
            orderId,
            "ESEWA",
            String(order.totalAmount),
            userId
        );

        const transactionUuid = `${orderId}-${Date.now()}`;
        const successUrl = getEsewaReturnUrl(orderId);
        const failureUrl = `${successUrl}&status=cancelled`;

        const form = buildEsewaPaymentForm({
            amountNpr: Number(order.totalAmount),
            transactionUuid,
            successUrl,
            failureUrl,
        });

        await db
            .update(payments)
            .set({
                metadata: {
                    provider: "ESEWA",
                    transactionUuid,
                    totalAmount: String(order.totalAmount),
                },
                updatedAt: new Date(),
            })
            .where(eq(payments.id, payment.id));

        const launchToken = createPaymentLaunchToken(orderId, userId);
        const paymentUrl = `${getPublicApiUrl()}/api/v1/payment/esewa/redirect?orderId=${encodeURIComponent(orderId)}&t=${encodeURIComponent(launchToken)}`;

        return {
            provider: "ESEWA",
            paymentId: payment.id,
            paymentUrl,
            formPost: form,
        };
    }

    async renderEsewaRedirectPage(orderId: string, userId: string): Promise<string> {
        const order = await this.loadPayableOrder(userId, orderId);
        const [payment] = await db
            .select()
            .from(payments)
            .where(and(eq(payments.orderId, orderId), eq(payments.status, "PENDING")))
            .limit(1);

        const meta = (payment?.metadata ?? {}) as {
            transactionUuid?: string;
            totalAmount?: string;
        };
        const transactionUuid =
            meta.transactionUuid ?? `${orderId}-${Date.now()}`;
        const successUrl = getEsewaReturnUrl(orderId);
        const failureUrl = `${successUrl}&status=cancelled`;

        const form = buildEsewaPaymentForm({
            amountNpr: Number(order.totalAmount),
            transactionUuid,
            successUrl,
            failureUrl,
        });

        const inputs = Object.entries(form.fields)
            .map(
                ([name, value]) =>
                    `<input type="hidden" name="${name}" value="${String(value).replace(/"/g, "&quot;")}" />`
            )
            .join("\n");

        return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Redirecting to eSewa…</title></head>
<body onload="document.forms[0].submit()">
<p style="font-family:system-ui;text-align:center;margin-top:48px">Redirecting to eSewa…</p>
<form method="POST" action="${form.action}">${inputs}</form>
</body></html>`;
    }

    async verifyEsewa(
        userId: string,
        orderId: string,
        dataParam: string
    ) {
        const order = await this.loadPayableOrder(userId, orderId);
        const payload = decodeEsewaCallbackData(dataParam);
        if (!payload?.transaction_uuid) {
            throw new ValidationError("Invalid eSewa payment response");
        }

        const totalAmount = String(payload.total_amount);
        const expected = Number(order.totalAmount).toFixed(2);
        if (totalAmount !== expected) {
            throw new ValidationError("Paid amount does not match order total");
        }

        const statusCheck = await verifyEsewaTransactionStatus(
            payload.transaction_uuid,
            totalAmount
        );
        if (!isEsewaPaymentComplete(statusCheck.status)) {
            throw new ValidationError(
                `Payment not completed yet (status: ${statusCheck.status})`
            );
        }

        const [payment] = await db
            .select()
            .from(payments)
            .where(eq(payments.orderId, orderId))
            .limit(1);
        if (!payment) throw new NotFoundError("Payment");

        await paymentService.confirmPayment(
            payment.id,
            statusCheck.refId ?? payload.ref_id ?? payload.transaction_uuid
        );

        const refreshed = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
            with: { items: true, store: true, history: true, deliveryAddress: true },
        });
        if (!refreshed) throw new NotFoundError("Order");
        return presentOrderForCustomer(refreshed);
    }

    async startEsewaMockCheckout(userId: string, orderId: string): Promise<OnlinePaymentStartResult> {
        if (!isEsewaEnabled() || !env.ESEWA_MOCK_ENABLED) {
            throw new ValidationError("eSewa payments are not available right now");
        }

        const order = await this.loadPayableOrder(userId, orderId);
        if (order.paymentMethod !== "ESEWA") {
            throw new ValidationError("Order is not an eSewa checkout");
        }

        const payment = await this.ensurePaymentRecord(
            orderId,
            "ESEWA",
            String(order.totalAmount),
            userId
        );

        const base = getWebsiteUrl().replace(/\/$/, "");
        const paymentUrl = `${base}/payment/return?orderId=${encodeURIComponent(orderId)}&provider=ESEWA&mock=1&paymentId=${encodeURIComponent(payment.id)}`;

        return {
            provider: "ESEWA",
            paymentId: payment.id,
            paymentUrl,
            mock: true,
        };
    }

    async verifyKhalti(userId: string, orderId: string, pidx: string) {
        const order = await this.loadPayableOrder(userId, orderId);

        const [payment] = await db
            .select()
            .from(payments)
            .where(eq(payments.orderId, orderId))
            .limit(1);
        if (!payment) throw new NotFoundError("Payment");

        const storedPidx =
            (payment.metadata as { pidx?: string } | null)?.pidx ?? undefined;
        if (storedPidx && storedPidx !== pidx) {
            throw new ForbiddenError("Payment reference does not match this order");
        }

        const lookup = await khaltiLookupPayment(pidx);
        if (!isKhaltiPaymentCompleted(lookup.status)) {
            throw new ValidationError(
                `Payment not completed yet (status: ${lookup.status}). Please finish paying in Khalti or try again.`
            );
        }

        const expectedPaisa = amountToPaisa(Number(order.totalAmount));
        if (lookup.totalAmount !== expectedPaisa) {
            throw new ValidationError("Paid amount does not match order total");
        }

        await paymentService.confirmPayment(
            payment.id,
            lookup.transactionId ?? pidx
        );

        const refreshed = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
            with: { items: true, store: true, history: true, deliveryAddress: true },
        });
        if (!refreshed) throw new NotFoundError("Order");
        return presentOrderForCustomer(refreshed);
    }

    async verifyEsewaMock(userId: string, orderId: string, paymentId: string) {
        if (!env.ESEWA_MOCK_ENABLED) {
            throw new ValidationError("eSewa mock verification is disabled");
        }

        const order = await this.loadPayableOrder(userId, orderId);
        void order;
        const [payment] = await db
            .select()
            .from(payments)
            .where(and(eq(payments.id, paymentId), eq(payments.orderId, orderId)))
            .limit(1);
        if (!payment) throw new NotFoundError("Payment");

        await paymentService.confirmPayment(payment.id, `mock-esewa-${generateId()}`);

        const refreshed = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
            with: { items: true, store: true, history: true, deliveryAddress: true },
        });
        if (!refreshed) throw new NotFoundError("Order");
        return presentOrderForCustomer(refreshed);
    }
}

export const onlinePaymentService = new OnlinePaymentService();
