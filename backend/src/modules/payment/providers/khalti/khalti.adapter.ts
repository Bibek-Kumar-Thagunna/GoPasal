import { generateId, ValidationError } from "@/utils";
import {
    getKhaltiReturnUrl,
    getWebsiteUrl,
    amountToPaisa,
} from "@/config/payments";
import {
    khaltiInitiatePayment,
    khaltiLookupPayment,
    isKhaltiPaymentCompleted,
} from "../../gateways/khalti.gateway";
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

export class KhaltiPaymentAdapter implements PaymentProvider {
    readonly id: PaymentProviderId = "KHALTI_DIRECT";

    async initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult> {
        const amountPaisa = amountToPaisa(input.amountNpr);
        const initiated = await khaltiInitiatePayment({
            amountPaisa,
            purchaseOrderId: input.orderId,
            purchaseOrderName: `GoPasal order ${input.orderId.slice(-8)}`,
            returnUrl: input.returnUrl || getKhaltiReturnUrl(input.orderId),
            websiteUrl: getWebsiteUrl(),
            customerName: input.customer.name,
            customerEmail: input.customer.email,
            customerPhone: input.customer.phone,
        });

        return {
            attemptId: generateId(),
            provider: this.id,
            channel: "KHALTI",
            status: "PENDING",
            paymentUrl: initiated.paymentUrl,
            providerRef: initiated.pidx,
            deepLink: initiated.paymentUrl,
            expiresAt: initiated.expiresAt ? new Date(initiated.expiresAt) : undefined,
        };
    }

    async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
        const pidx =
            (input.callbackData?.pidx as string | undefined) ?? input.providerRef;
        if (!pidx) {
            throw new ValidationError("Missing Khalti pidx");
        }
        const lookup = await khaltiLookupPayment(pidx);
        return {
            success: isKhaltiPaymentCompleted(lookup.status),
            provider: this.id,
            providerRef: lookup.pidx,
            amountNpr: lookup.totalAmount / 100,
            raw: lookup,
        };
    }

    async refundPayment(_input: RefundPaymentInput): Promise<RefundPaymentResult> {
        return {
            success: false,
            raw: { message: "Gateway refund API not wired — use ledger refund flow" },
        };
    }

    async getTransaction(providerRef: string): Promise<ProviderTransaction | null> {
        const lookup = await khaltiLookupPayment(providerRef);
        return {
            provider: this.id,
            providerRef: lookup.pidx,
            status: isKhaltiPaymentCompleted(lookup.status) ? "PAID" : "PENDING",
            amountNpr: lookup.totalAmount / 100,
            raw: lookup,
        };
    }

    async handleWebhook(_ctx: WebhookContext): Promise<WebhookHandleResult> {
        throw new Error("Use client-return verify for Khalti direct until IPN is configured");
    }
}

export const khaltiPaymentAdapter = new KhaltiPaymentAdapter();
