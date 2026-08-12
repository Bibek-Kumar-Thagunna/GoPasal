import { describe, expect, it } from "bun:test";
import { resolveStoreDeliveryFee } from "@/utils/store-delivery-charges";

describe("resolveStoreDeliveryFee", () => {
    it("returns 0 when shop has not configured delivery", () => {
        expect(resolveStoreDeliveryFee(null, 100, true)).toBe(0);
        expect(resolveStoreDeliveryFee({}, 100, true)).toBe(0);
    });

    it("uses shop delivery fee from metadata", () => {
        expect(
            resolveStoreDeliveryFee({ deliveryFee: 49 }, 100, true)
        ).toBe(49);
    });

    it("waives fee above threshold", () => {
        expect(
            resolveStoreDeliveryFee(
                { deliveryFee: 49, freeDeliveryThreshold: 500 },
                600,
                true
            )
        ).toBe(0);
    });

    it("returns 0 for pickup orders", () => {
        expect(
            resolveStoreDeliveryFee({ deliveryFee: 49 }, 100, false)
        ).toBe(0);
    });
});
