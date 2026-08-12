import { env } from "@/config/env";
import { logger } from "@/shared/logger";

function normalizeNepalPhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("977")) return digits;
    if (digits.length === 10) return `977${digits}`;
    return digits;
}

async function sendViaSparrow(to: string, text: string): Promise<void> {
    const token = env.SPARROW_SMS_TOKEN?.trim();
    const from = env.SPARROW_SMS_FROM?.trim() || "GoPasal";
    if (!token) return;

    const res = await fetch("https://api.sparrowsms.com/v2/sms/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
            from,
            to: normalizeNepalPhone(to),
            text,
        }),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        logger.error({ status: res.status, body }, "Sparrow SMS failed");
        throw new Error("SMS delivery failed");
    }
}

import { UniClient } from "uni-sdk";

export async function sendSms(
    phone: string, 
    text: string,
    templateOpts?: { templateId: string; data: Record<string, string> }
): Promise<void> {
    // UniMatrix requires both the access key id and secret; an incomplete
    // configuration must not take the live path (it would throw on every send).
    if (env.UNIMTX_ACCESS_KEY_ID?.trim() && env.UNIMTX_ACCESS_KEY_SECRET?.trim()) {
        try {
            const client = new UniClient({
                accessKeyId: env.UNIMTX_ACCESS_KEY_ID,
                ...(env.UNIMTX_ACCESS_KEY_SECRET && { accessKeySecret: env.UNIMTX_ACCESS_KEY_SECRET }),
            });

            const reqPayload: any = { to: phone };
            if (templateOpts) {
                reqPayload.templateId = templateOpts.templateId;
                reqPayload.templateData = templateOpts.data;
            } else {
                reqPayload.text = text;
            }

            const res = await client.messages.send(reqPayload);

            if (res.code !== "0") {
                logger.error({ response: res }, "UniMatrix SMS failed");
                throw new Error("SMS delivery failed via UniMatrix");
            }
            return;
        } catch (error: any) {
            logger.error({ error: error.message }, "UniMatrix SMS Exception");
            throw new Error("SMS delivery failed via UniMatrix");
        }
    }

    if (env.SPARROW_SMS_TOKEN?.trim()) {
        await sendViaSparrow(phone, text);
        return;
    }

    if (env.NODE_ENV === "development") {
        logger.info({ phone, text, channel: "SMS_DEV" }, "SMS (no provider configured)");
    }
}

export async function deliverOtpSms(
    phone: string,
    otp: string,
    expiresInSeconds: number
): Promise<void> {
    const minutes = Math.max(1, Math.ceil(expiresInSeconds / 60));

    // Sending via custom template
    await sendSms(phone, "Fallback text if needed", {
        templateId: "pub_otp_en_basic3", // The custom code you enter in UniMatrix
        data: {
            code: otp
        }
    });

    // In development, when no fully-configured SMS provider exists, the OTP
    // must still be visible locally — otherwise login cannot be exercised
    // end-to-end (an incomplete UniMatrix config does not count as configured).
    const unimetrixConfigured = Boolean(env.UNIMTX_ACCESS_KEY_ID?.trim() && env.UNIMTX_ACCESS_KEY_SECRET?.trim());
    if (env.NODE_ENV === "development" && !unimetrixConfigured && !env.SPARROW_SMS_TOKEN?.trim()) {
        logger.info({ phone, otp, minutes, channel: "OTP_DEV" }, "DEV OTP (no SMS provider configured)");
    }
}
