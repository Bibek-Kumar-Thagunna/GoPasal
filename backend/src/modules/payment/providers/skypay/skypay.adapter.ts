import { generateId, ValidationError } from "@/utils";
import { getKhaltiReturnUrl } from "@/config/payments";
import type { PaymentProvider } from "../payment-provider.interface";
import type {
    InitializePaymentInput,
    InitializePaymentResult,
    PaymentProviderId,
    ProviderTransaction,
    RefundPaymentInput,
    RefundPaymentResult,
    VerifyPaymentInput,
    VerifyPaymentResult,
    WebhookContext,
    WebhookHandleResult,
} from "../types";
import {
    skypayGetStatus,
    skypayInitializeAssisted,
    verifySkyPayWebhookSignature,
} from "./skypay.client";

function mapSkyPayStatus(
    status: string
): "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "CANCELLED" {
    switch (status) {
        case "success":
            return "PAID";
        case "processing":
            return "PROCESSING";
        case "failed":
            return "FAILED";
        case "cancelled":
            return "CANCELLED";
        default:
            return "PENDING";
    }
}

export class SkyPayAdapter implements PaymentProvider {
    readonly id: PaymentProviderId = "SKYPAY";

    async initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult> {
        if (input.channel === "COD") {
            throw new ValidationError("SkyPay does not process COD");
        }

        const returnUrl = input.returnUrl || getKhaltiReturnUrl(input.orderId);
        const cancelUrl = `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}status=cancelled`;

        const initiated = await skypayInitializeAssisted({
            orderId: input.orderId,
            amountNpr: input.amountNpr,
            channel: input.channel,
            returnUrl,
            cancelUrl,
            customerName: input.customer.name,
            customerPhone: input.customer.phone,
            customerEmail: input.customer.email,
        });

        return {
            attemptId: generateId(),
            provider: this.id,
            channel: input.channel,
            status: "PENDING",
            paymentUrl: initiated.paymentUrl,
            providerRef: initiated.transactionId,
            qrPayload: initiated.qrData,
            deepLink: initiated.deepLink,
            expiresAt: initiated.expiresAt ? new Date(initiated.expiresAt) : undefined,
            mock: initiated.paymentUrl.includes("mock=1"),
        };
    }

    async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
        if (input.callbackData?.data) {
            try {
                const jsonStr = Buffer.from(input.callbackData.data as string, "base64").toString("utf-8");
                const parsed = JSON.parse(jsonStr) as { code: string; amount: number; status: string; };
                
                return {
                    success: parsed.status === "complete",
                    provider: this.id,
                    providerRef: parsed.code,
                    amountNpr: parsed.amount,
                    raw: parsed,
                };
            } catch (err) {
                throw new ValidationError("Invalid SkyPay callback data");
            }
        }

        const txId = input.providerRef ?? (input.callbackData?.tx as string | undefined);
        if (!txId) {
            throw new ValidationError("Missing SkyPay transaction id or data");
        }
        const status = await skypayGetStatus(txId);
        return {
            success: status.status === "success" || (status.status as string) === "complete",
            provider: this.id,
            providerRef: status.transactionId,
            amountNpr: status.amount || input.callbackData?.amountNpr as number | undefined,
            raw: status,
        };
    }

    async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentResult> {
        return {
            success: false,
            raw: { message: "SkyPay refund API — wire when merchant refund endpoint is available", input },
        };
    }

    async getTransaction(providerRef: string): Promise<ProviderTransaction | null> {
        const status = await skypayGetStatus(providerRef);
        return {
            provider: this.id,
            providerRef: status.transactionId,
            status: mapSkyPayStatus(status.status),
            amountNpr: status.amount,
            raw: status,
        };
    }

    async handleWebhook(ctx: WebhookContext): Promise<WebhookHandleResult> {
        const signature =
            ctx.headers["x-skypay-signature"] ??
            ctx.headers["x-signature"] ??
            undefined;

        if (!verifySkyPayWebhookSignature(ctx.rawBody, signature)) {
            throw new ValidationError("Invalid SkyPay webhook signature");
        }

        const payload = JSON.parse(ctx.rawBody) as {
            event_id: string;
            transaction_id: string;
            merchant_order_id: string;
            status: string;
        };

        return {
            eventId: payload.event_id,
            orderId: payload.merchant_order_id,
            status: mapSkyPayStatus(payload.status),
            verified: true,
        };
    }
}

export const skyPayAdapter = new SkyPayAdapter();
