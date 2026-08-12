import { describe, expect, it } from "bun:test";
import { isKhaltiPaymentCompleted } from "@/modules/payment/gateways/khalti.gateway";
import { getPaymentCapabilities } from "@/config/payments";

describe("khalti payment helpers", () => {
    it("treats only Completed as success", () => {
        expect(isKhaltiPaymentCompleted("Completed")).toBe(true);
        expect(isKhaltiPaymentCompleted("completed")).toBe(true);
        expect(isKhaltiPaymentCompleted("Pending")).toBe(false);
        expect(isKhaltiPaymentCompleted("User canceled")).toBe(false);
    });

    it("exposes payment capabilities object", () => {
        const caps = getPaymentCapabilities();
        expect(caps.cod).toBe(true);
        expect(typeof caps.khalti).toBe("boolean");
        expect(caps.minOnlineAmountPaisa).toBe(1000);
    });
});
