import { env } from "@/config/env";
import { logger } from "@/shared/logger";

type SendEmailInput = {
    to: string;
    subject: string;
    html: string;
    text?: string;
};

async function sendViaResend(input: SendEmailInput): Promise<void> {
    const apiKey = env.RESEND_API_KEY?.trim();
    if (!apiKey) return;

    const from = env.EMAIL_FROM?.trim() || "GoPasal <noreply@gopasal.com>";
    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to: [input.to],
            subject: input.subject,
            html: input.html,
            text: input.text ?? input.subject,
        }),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        logger.error({ status: res.status, body }, "Resend email failed");
        throw new Error("Email delivery failed");
    }
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
    if (env.RESEND_API_KEY?.trim()) {
        await sendViaResend(input);
        return;
    }

    if (env.NODE_ENV === "development") {
        logger.info(
            { to: input.to, subject: input.subject, channel: "EMAIL_DEV" },
            "Email (no provider configured)"
        );
    }
}

export function orderStatusEmailHtml(orderId: string, statusLabel: string): string {
    const shortId = orderId.slice(-8).toUpperCase();
    return `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#0f172a;margin:0 0 12px">Order update</h2>
        <p style="color:#475569;line-height:1.5">
          Your order <strong>#${shortId}</strong> is now: <strong>${statusLabel}</strong>.
        </p>
        <p style="color:#94a3b8;font-size:13px">Open the GoPasal app for details.</p>
      </div>
    `;
}
