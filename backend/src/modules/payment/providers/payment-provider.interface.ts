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
} from "./types";

/**
 * Provider-agnostic payment contract.
 * New PSPs / aggregators implement this interface only.
 */
export interface PaymentProvider {
    readonly id: PaymentProviderId;

    initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult>;

    verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;

    refundPayment(input: RefundPaymentInput): Promise<RefundPaymentResult>;

    getTransaction(providerRef: string): Promise<ProviderTransaction | null>;

    handleWebhook(ctx: WebhookContext): Promise<WebhookHandleResult>;
}
