import { env } from "@/config/env";
import { ValidationError } from "@/utils/errors";

export type KhaltiInitiateResult = {
    pidx: string;
    paymentUrl: string;
    expiresAt?: string;
    expiresIn?: number;
};

export type KhaltiLookupResult = {
    pidx: string;
    status: string;
    totalAmount: number;
    transactionId: string | null;
    fee: number;
    refunded: boolean;
};

function authHeader(): string {
    const key = env.KHALTI_SECRET_KEY?.trim();
    if (!key) {
        throw new ValidationError("Khalti is not configured on this server");
    }
    return `Key ${key}`;
}

function apiUrl(path: string): string {
    const base = env.KHALTI_BASE_URL.replace(/\/$/, "");
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function khaltiInitiatePayment(input: {
    amountPaisa: number;
    purchaseOrderId: string;
    purchaseOrderName: string;
    returnUrl: string;
    websiteUrl: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
}): Promise<KhaltiInitiateResult> {
    const res = await fetch(apiUrl("/epayment/initiate/"), {
        method: "POST",
        headers: {
            Authorization: authHeader(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            return_url: input.returnUrl,
            website_url: input.websiteUrl,
            amount: input.amountPaisa,
            purchase_order_id: input.purchaseOrderId,
            purchase_order_name: input.purchaseOrderName,
            customer_info: {
                name: input.customerName ?? "GoPasal Customer",
                email: input.customerEmail ?? "customer@gopasal.local",
                phone: input.customerPhone ?? "9800000000",
            },
            merchant_extra: input.purchaseOrderId,
        }),
    });

    const body = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
        const detail =
            typeof body.detail === "string"
                ? body.detail
                : JSON.stringify(body);
        throw new ValidationError(`Khalti initiate failed: ${detail}`);
    }

    const pidx = String(body.pidx ?? "");
    const paymentUrl = String(body.payment_url ?? "");
    if (!pidx || !paymentUrl) {
        throw new ValidationError("Khalti returned an invalid initiate response");
    }

    return {
        pidx,
        paymentUrl,
        expiresAt: body.expires_at ? String(body.expires_at) : undefined,
        expiresIn: typeof body.expires_in === "number" ? body.expires_in : undefined,
    };
}

export async function khaltiLookupPayment(pidx: string): Promise<KhaltiLookupResult> {
    const res = await fetch(apiUrl("/epayment/lookup/"), {
        method: "POST",
        headers: {
            Authorization: authHeader(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ pidx }),
    });

    const body = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
        const detail =
            typeof body.detail === "string"
                ? body.detail
                : JSON.stringify(body);
        throw new ValidationError(`Khalti lookup failed: ${detail}`);
    }

    return {
        pidx: String(body.pidx ?? pidx),
        status: String(body.status ?? "Unknown"),
        totalAmount: Number(body.total_amount ?? 0),
        transactionId: body.transaction_id ? String(body.transaction_id) : null,
        fee: Number(body.fee ?? 0),
        refunded: Boolean(body.refunded),
    };
}

export function isKhaltiPaymentCompleted(status: string): boolean {
    return status.trim().toLowerCase() === "completed";
}
