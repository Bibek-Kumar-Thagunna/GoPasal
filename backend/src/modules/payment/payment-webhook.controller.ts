import { Elysia } from "elysia";
import { success } from "@/utils/response";
import { webhookProcessorService } from "./webhook-processor.service";

export const paymentWebhookController = new Elysia({
    prefix: "/api/v1/payment/webhooks",
})
    .post(
        "/skypay",
        async ({ request }) => {
            const rawBody = await request.text();
            const headers: Record<string, string | undefined> = {};
            request.headers.forEach((value, key) => {
                headers[key.toLowerCase()] = value;
            });

            const result = await webhookProcessorService.ingest("SKYPAY", {
                headers,
                rawBody,
            });

            return success(result);
        },
        {
            detail: {
                tags: ["Payment"],
                summary: "SkyPay assisted mode webhook (signature verified server-side)",
            },
        }
    )
    .post(
        "/khalti",
        async ({ request }) => {
            const rawBody = await request.text();
            const headers: Record<string, string | undefined> = {};
            request.headers.forEach((value, key) => {
                headers[key.toLowerCase()] = value;
            });

            const result = await webhookProcessorService.ingestKhalti({
                headers,
                rawBody,
            });

            return success(result);
        },
        {
            detail: {
                tags: ["Payment"],
                summary: "Khalti epayment webhook (Authorization: Khalti <secret> + server-side lookup)",
            },
        }
    )
    .post(
        "/esewa",
        async ({ request }) => {
            const rawBody = await request.text();
            const headers: Record<string, string | undefined> = {};
            request.headers.forEach((value, key) => {
                headers[key.toLowerCase()] = value;
            });

            const result = await webhookProcessorService.ingestEsewa({
                headers,
                rawBody,
            });

            return success(result);
        },
        {
            detail: {
                tags: ["Payment"],
                summary: "eSewa payment callback (HMAC-SHA256 signature + server-side status check)",
            },
        }
    );
