import crypto from "node:crypto";
import { env } from "@/config/env";
import { ValidationError } from "@/utils/errors";
import type { PaymentChannel } from "../types";

export type SkyPayInitRequest = {
    merchantOrderId: string;
    amount: number;
    currency: "NPR";
    paymentMethod: "esewa" | "khalti" | "fonepay" | "card";
    returnUrl: string;
    cancelUrl: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
};

export type SkyPayInitResponse = {
    transactionId: string;
    paymentUrl: string;
    qrData?: string;
    deepLink?: string;
    expiresAt?: string;
};

export type SkyPayStatusResponse = {
    transactionId: string;
    status: "pending" | "processing" | "success" | "failed" | "cancelled";
    amount: number;
    paymentMethod?: string;
};


function apiUrl(path: string): string {
    const base = env.SKYPAY_BASE_URL.replace(/\/$/, "");
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function headers(): Record<string, string> {
    const key = env.SKYPAY_API_KEY?.trim();
    const secret = env.SKYPAY_API_SECRET?.trim();
    if (!key) {
        throw new ValidationError("SkyPay is not configured");
    }
    
    // Support single API Key via Bearer, or legacy Basic Auth if secret exists
    const authHeader = secret 
        ? `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`
        : `Bearer ${key}`;

    return {
        Authorization: authHeader,
        "Content-Type": "application/json",
        "X-Merchant-Id": env.SKYPAY_MERCHANT_ID?.trim() ?? key,
    };
}

export async function skypayInitializeAssisted(input: {
    orderId: string;
    amountNpr: number;
    channel: PaymentChannel;
    returnUrl: string;
    cancelUrl: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
}): Promise<SkyPayInitResponse> {
    if (env.SKYPAY_MOCK_ENABLED) {
        const txId = `skypay-mock-${input.orderId}-${Date.now()}`;
        const base = env.PUBLIC_WEB_URL.replace(/\/$/, "");
        return {
            transactionId: txId,
            paymentUrl: `${base}/payment/return?orderId=${encodeURIComponent(input.orderId)}&provider=SKYPAY&mock=1&tx=${encodeURIComponent(txId)}`,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        };
    }

    const apiKey = env.SKYPAY_API_KEY?.trim();
    if (!apiKey) {
        throw new ValidationError("SkyPay API key is not configured");
    }

    const base = env.SKYPAY_BASE_URL.replace(/\/$/, "");
    
    const params = new URLSearchParams({
        api_key: apiKey,
        amount: input.amountNpr.toString(),
        code: input.orderId,
        success_url: input.returnUrl,
        failure_url: input.cancelUrl,
    });

    const paymentUrl = `${base}?${params.toString()}`;

    return {
        transactionId: input.orderId,
        paymentUrl,
    };
}

export async function skypayGetStatus(transactionId: string): Promise<SkyPayStatusResponse> {
    if (env.SKYPAY_MOCK_ENABLED) {
        return {
            transactionId,
            status: "success",
            amount: 0,
        };
    }

    const res = await fetch(
        apiUrl(`/api/v1/assisted/payments/${encodeURIComponent(transactionId)}`),
        { headers: headers() }
    );

    if (!res.ok) {
        throw new ValidationError("SkyPay status lookup failed");
    }

    const json = (await res.json()) as { data?: SkyPayStatusResponse };
    return json.data ?? (json as SkyPayStatusResponse);
}

export function verifySkyPayWebhookSignature(
    rawBody: string,
    signature: string | undefined
): boolean {
    if (env.SKYPAY_MOCK_ENABLED) return true;
    if (!signature?.trim() || !env.SKYPAY_WEBHOOK_SECRET?.trim()) return false;
    const expected = crypto
        .createHmac("sha256", env.SKYPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");
    const sig = signature.replace(/^sha256=/, "");
    if (sig.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}
