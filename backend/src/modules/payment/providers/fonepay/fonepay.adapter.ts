import {  ValidationError } from "@/utils";
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

/**
 * Direct Fonepay integration placeholder — route via SkyPay when enabled.
 */
export class FonepayPaymentAdapter implements PaymentProvider {
    readonly id: PaymentProviderId = "FONEPAY_DIRECT";

    async initializePayment(_input: InitializePaymentInput): Promise<InitializePaymentResult> {
        throw new ValidationError(
            "Direct Fonepay is not configured. Enable SkyPay assisted mode or use another method."
        );
    }

    async verifyPayment(_input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
        return { success: false, provider: this.id };
    }

    async refundPayment(_input: RefundPaymentInput): Promise<RefundPaymentResult> {
        return { success: false };
    }

    async getTransaction(_providerRef: string): Promise<ProviderTransaction | null> {
        return null;
    }

    async handleWebhook(_ctx: WebhookContext): Promise<WebhookHandleResult> {
        throw new Error("Fonepay direct webhooks not implemented");
    }
}

export const fonepayPaymentAdapter = new FonepayPaymentAdapter();
