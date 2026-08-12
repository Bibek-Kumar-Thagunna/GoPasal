import { generateId, ValidationError } from "@/utils";
import {
    getEsewaReturnUrl,
    getPublicApiUrl,
    isEsewaLiveEnabled,
} from "@/config/payments";
import { createPaymentLaunchToken } from "@/utils/payment-launch-token";
import {
    buildEsewaPaymentForm,
    decodeEsewaCallbackData,
    isEsewaPaymentComplete,
    verifyEsewaTransactionStatus,
} from "../../gateways/esewa.gateway";
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

export class EsewaPaymentAdapter implements PaymentProvider {
    readonly id: PaymentProviderId = "ESEWA_DIRECT";

    async initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult> {
        const transactionUuid = `${input.orderId}-${Date.now()}`;
        const successUrl = input.returnUrl || getEsewaReturnUrl(input.orderId);
        const failureUrl = `${successUrl}${successUrl.includes("?") ? "&" : "?"}status=cancelled`;

        const form = buildEsewaPaymentForm({
            amountNpr: input.amountNpr,
            transactionUuid,
            successUrl,
            failureUrl,
        });

        const launchToken = createPaymentLaunchToken(input.orderId, input.customer.userId);
        const paymentUrl = `${getPublicApiUrl()}/api/v1/payment/esewa/redirect?orderId=${encodeURIComponent(input.orderId)}&t=${encodeURIComponent(launchToken)}`;

        return {
            attemptId: generateId(),
            provider: this.id,
            channel: "ESEWA",
            status: "PENDING",
            paymentUrl,
            providerRef: transactionUuid,
            formPost: form,
            mock: !isEsewaLiveEnabled(),
        };
    }

    async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
        const dataParam = input.callbackData?.data as string | undefined;
        if (!dataParam) {
            throw new ValidationError("Missing eSewa callback data");
        }
        const payload = decodeEsewaCallbackData(dataParam);
        if (!payload?.transaction_uuid) {
            throw new ValidationError("Invalid eSewa payment response");
        }

        const totalAmount = String(payload.total_amount);
        const statusCheck = await verifyEsewaTransactionStatus(
            payload.transaction_uuid,
            totalAmount
        );

        return {
            success: isEsewaPaymentComplete(statusCheck.status),
            provider: this.id,
            providerRef: statusCheck.refId ?? payload.ref_id ?? payload.transaction_uuid,
            amountNpr: Number(totalAmount),
            raw: { payload, statusCheck },
        };
    }

    async refundPayment(_input: RefundPaymentInput): Promise<RefundPaymentResult> {
        return { success: false, raw: { message: "eSewa gateway refund not wired" } };
    }

    async getTransaction(providerRef: string): Promise<ProviderTransaction | null> {
        return {
            provider: this.id,
            providerRef,
            status: "PENDING",
            amountNpr: 0,
        };
    }

    async handleWebhook(_ctx: WebhookContext): Promise<WebhookHandleResult> {
        throw new Error("eSewa direct webhooks use return-url verification");
    }
}

export const esewaPaymentAdapter = new EsewaPaymentAdapter();
