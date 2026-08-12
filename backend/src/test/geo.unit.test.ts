import { describe, expect, it } from "bun:test";
import {
    checkDeliveryServiceability,
    effectiveServiceRadiusKm,
    haversineDistanceKm,
} from "@/utils/geo";

describe("geo", () => {
    it("haversine returns ~0 for same point", () => {
        expect(haversineDistanceKm(27.7172, 85.324, 27.7172, 85.324)).toBeLessThan(0.01);
    });

    it("uses default delivery radius for merchant stores", () => {
        expect(effectiveServiceRadiusKm("MERCHANT_SELF", null)).toBe(3);
        expect(effectiveServiceRadiusKm("MERCHANT_SELF", 5)).toBe(5);
    });

    it("uses wider discovery radius for pickup-only", () => {
        expect(effectiveServiceRadiusKm("PICKUP_ONLY", 3)).toBe(25);
    });

    it("rejects delivery when customer is outside radius", () => {
        const result = checkDeliveryServiceability({
            storeLatitude: 27.7172,
            storeLongitude: 85.324,
            storeDeliveryRadius: 2,
            storeDeliveryType: "MERCHANT_SELF",
            customerLatitude: 27.75,
            customerLongitude: 85.324,
            enforceDeliveryRadius: true,
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.code).toBe("OUT_OF_DELIVERY_AREA");
        }
    });

    it("accepts delivery inside radius", () => {
        const result = checkDeliveryServiceability({
            storeLatitude: 27.7172,
            storeLongitude: 85.324,
            storeDeliveryRadius: 5,
            storeDeliveryType: "MERCHANT_SELF",
            customerLatitude: 27.72,
            customerLongitude: 85.325,
            enforceDeliveryRadius: true,
        });
        expect(result.ok).toBe(true);
    });
});
