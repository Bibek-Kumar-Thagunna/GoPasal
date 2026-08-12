import { generateId } from "@/utils";
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

/** COD is fulfilled at delivery — no PSP redirect. */
export class CodPaymentAdapter implements PaymentProvider {
    readonly id: PaymentProviderId = "COD_INTERNAL";

    async initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult> {
        return {
            attemptId: generateId(),
            provider: this.id,
            channel: "COD",
            status: "PENDING",
            providerRef: `cod-${input.orderId}`,
        };
    }

    async verifyPayment(_input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
        return { success: true, provider: this.id };
    }

    async refundPayment(_input: RefundPaymentInput): Promise<RefundPaymentResult> {
        return { success: true };
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
        throw new Error("COD provider does not accept webhooks");
    }
}

export const codPaymentAdapter = new CodPaymentAdapter();
