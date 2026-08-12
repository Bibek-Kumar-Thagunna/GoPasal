/** Channel the customer selects at checkout (Nepal + future). */
export type PaymentChannel =
    | "COD"
    | "ESEWA"
    | "KHALTI"
    | "FONEPAY_QR"
    | "CARD"
    | "WALLET";

/** Aggregator or direct PSP implementation. */
export type PaymentProviderId =
    | "SKYPAY"
    | "KHALTI_DIRECT"
    | "ESEWA_DIRECT"
    | "COD_INTERNAL"
    | "FONEPAY_DIRECT"
    | "KHALTI"
    | "ESEWA";

export type PaymentAttemptStatus =
    | "INITIATED"
    | "PENDING"
    | "PROCESSING"
    | "PAID"
    | "FAILED"
    | "CANCELLED"
    | "EXPIRED"
    | "REFUNDED";

export type InitializePaymentInput = {
    paymentId: string;
    orderId: string;
    amountNpr: number;
    channel: PaymentChannel;
    idempotencyKey: string;
    customer: {
        userId: string;
        name?: string;
        email?: string;
        phone?: string;
    };
    returnUrl: string;
    metadata?: Record<string, unknown>;
};

export type InitializePaymentResult = {
    attemptId: string;
    provider: PaymentProviderId;
    channel: PaymentChannel;
    status: PaymentAttemptStatus;
    paymentUrl?: string;
    qrPayload?: string;
    deepLink?: string;
    providerRef?: string;
    expiresAt?: Date;
    mock?: boolean;
    formPost?: { action: string; fields: Record<string, string> };
};

export type VerifyPaymentInput = {
    paymentId: string;
    orderId: string;
    channel: PaymentChannel;
    providerRef?: string;
    callbackData?: Record<string, unknown>;
};

export type VerifyPaymentResult = {
    success: boolean;
    provider: PaymentProviderId;
    providerRef?: string;
    amountNpr?: number;
    raw?: unknown;
};

export type RefundPaymentInput = {
    paymentId: string;
    orderId: string;
    amountNpr: number;
    reason: string;
    providerRef?: string;
    idempotencyKey: string;
};

export type RefundPaymentResult = {
    success: boolean;
    providerRefundRef?: string;
    raw?: unknown;
};

export type ProviderTransaction = {
    provider: PaymentProviderId;
    providerRef: string;
    status: PaymentAttemptStatus;
    amountNpr: number;
    raw?: unknown;
};

export type WebhookContext = {
    headers: Record<string, string | undefined>;
    rawBody: string;
    query?: Record<string, string>;
};

export type WebhookHandleResult = {
    eventId: string;
    paymentId?: string;
    orderId?: string;
    status: PaymentAttemptStatus;
    verified: boolean;
};
