import { createHmac } from "crypto";
import { env } from "@/config/env";

export type EsewaFormFields = Record<string, string>;

export type EsewaInitiateInput = {
    amountNpr: number;
    transactionUuid: string;
    successUrl: string;
    failureUrl: string;
};

export type EsewaCallbackPayload = {
    transaction_uuid: string;
    product_code: string;
    total_amount: string | number;
    status: string;
    ref_id?: string;
};

function esewaBaseUrl(): string {
    return (env.ESEWA_BASE_URL ?? "https://rc-epay.esewa.com.np").replace(/\/$/, "");
}

function getEsewaProductCode(): string {
    const code = env.ESEWA_MERCHANT_ID?.trim();
    if (!code) throw new Error("ESEWA_MERCHANT_ID is not configured");
    return code;
}

function secretKey(): string {
    const key = env.ESEWA_SECRET_KEY?.trim();
    if (!key) throw new Error("ESEWA_SECRET_KEY is not configured");
    return key;
}

function formatAmount(amount: number): string {
    return amount.toFixed(2);
}

function buildSignature(message: string): string {
    return createHmac("sha256", secretKey()).update(message).digest("base64");
}

export function buildEsewaPaymentForm(input: EsewaInitiateInput): {
    action: string;
    fields: EsewaFormFields;
} {
    const amount = formatAmount(input.amountNpr);
    const tax = "0";
    const service = "0";
    const delivery = "0";
    const total = amount;
    const merchantCode = getEsewaProductCode();
    const signedFieldNames = "total_amount,transaction_uuid,product_code";
    const signatureMessage = `total_amount=${total},transaction_uuid=${input.transactionUuid},product_code=${merchantCode}`;

    const fields: EsewaFormFields = {
        amount,
        tax_amount: tax,
        product_service_charge: service,
        product_delivery_charge: delivery,
        total_amount: total,
        transaction_uuid: input.transactionUuid,
        product_code: merchantCode,
        success_url: input.successUrl,
        failure_url: input.failureUrl,
        signed_field_names: signedFieldNames,
        signature: buildSignature(signatureMessage),
    };

    return {
        action: `${esewaBaseUrl()}/api/epay/main/v2/form`,
        fields,
    };
}

export function decodeEsewaCallbackData(dataParam: string): EsewaCallbackPayload | null {
    try {
        const json = Buffer.from(dataParam, "base64").toString("utf8");
        return JSON.parse(json) as EsewaCallbackPayload;
    } catch {
        return null;
    }
}

export async function verifyEsewaTransactionStatus(
    transactionUuid: string,
    totalAmount: string
): Promise<{ status: string; refId?: string }> {
    const code = getEsewaProductCode();
    const url = new URL(`${esewaBaseUrl()}/api/epay/transaction/status/`);
    url.searchParams.set("product_code", code);
    url.searchParams.set("total_amount", totalAmount);
    url.searchParams.set("transaction_uuid", transactionUuid);

    const res = await fetch(url.toString());
    if (!res.ok) {
        throw new Error(`eSewa status check failed (${res.status})`);
    }

    const body = (await res.json()) as {
        status?: string;
        ref_id?: string;
        transaction_details?: { status?: string; ref_id?: string };
    };

    const status =
        body.status ??
        body.transaction_details?.status ??
        "UNKNOWN";
    const refId = body.ref_id ?? body.transaction_details?.ref_id;

    return { status, refId };
}

export function isEsewaPaymentComplete(status: string): boolean {
    return status.toUpperCase() === "COMPLETE";
}
