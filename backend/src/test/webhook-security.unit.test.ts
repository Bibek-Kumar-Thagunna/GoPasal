import { describe, expect, it, beforeAll, afterAll, mock } from "bun:test";
import { webhookProcessorService } from "@/modules/payment/webhook-processor.service";
import { env } from "@/config/env";

describe("Payment webhooks", () => {
    beforeAll(() => {
        (env as { KHALTI_SECRET_KEY: string }).KHALTI_SECRET_KEY = "khalti-test-secret";
        (env as { ESEWA_SECRET_KEY: string }).ESEWA_SECRET_KEY = "esewa-test-secret";
    });

    afterAll(() => {
        mock.restore();
    });

    it("rejects Khalti webhooks with a missing/invalid signature", async () => {
        await expect(
            webhookProcessorService.ingestKhalti({
                headers: { authorization: "Key wrong" },
                rawBody: '{"pidx":"p_1"}',
            })
        ).rejects.toThrow("invalid signature");
    });

    it("rejects eSewa callbacks with an invalid HMAC signature", async () => {
        await expect(
            webhookProcessorService.ingestEsewa({
                headers: {},
                rawBody: JSON.stringify({
                    data: "eyJmb28iOiJiYXIifQ==",
                    signature: "bm90LWEtc2lnbmF0dXJl",
                }),
            })
        ).rejects.toThrow("invalid signature");
    });

    it("rejects eSewa callbacks missing data or signature", async () => {
        await expect(
            webhookProcessorService.ingestEsewa({
                headers: {},
                rawBody: JSON.stringify({ data: "abc" }),
            })
        ).rejects.toThrow("missing data or signature");
    });

    it("fails closed when merchant secrets are not configured", async () => {
        const savedK = env.KHALTI_SECRET_KEY;
        const savedE = env.ESEWA_SECRET_KEY;
        (env as { KHALTI_SECRET_KEY: string | undefined }).KHALTI_SECRET_KEY = undefined as never;
        (env as { ESEWA_SECRET_KEY: string | undefined }).ESEWA_SECRET_KEY = undefined as never;
        try {
            await expect(
                webhookProcessorService.ingestKhalti({ headers: {}, rawBody: '{"pidx":"p_1"}' })
            ).rejects.toThrow("not configured");
            await expect(
                webhookProcessorService.ingestEsewa({ headers: {}, rawBody: "{}" })
            ).rejects.toThrow("not configured");
        } finally {
            (env as { KHALTI_SECRET_KEY: string | undefined }).KHALTI_SECRET_KEY = savedK;
            (env as { ESEWA_SECRET_KEY: string | undefined }).ESEWA_SECRET_KEY = savedE;
        }
    });
});
