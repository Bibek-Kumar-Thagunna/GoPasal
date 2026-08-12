import { describe, expect, it } from "bun:test";
import {
    defaultCheckoutFulfillment,
    normalizeStoreDeliveryMode,
    resolveOrderFulfillmentType,
    shouldCreatePlatformDeliveryTask,
    storeSupportsMerchantDelivery,
} from "@/modules/fulfillment/fulfillment";

describe("fulfillment", () => {
    it("normalizes legacy store delivery aliases", () => {
        expect(normalizeStoreDeliveryMode("SELF")).toBe("MERCHANT_SELF");
        expect(normalizeStoreDeliveryMode("MERCHANT")).toBe("MERCHANT_SELF");
        expect(normalizeStoreDeliveryMode("PLATFORM")).toBe("PLATFORM");
    });

    it("defaults merchant-self stores to merchant delivery checkout", () => {
        expect(defaultCheckoutFulfillment("MERCHANT_SELF")).toBe("MERCHANT_DELIVERY");
        expect(
            resolveOrderFulfillmentType("MERCHANT_SELF", "MERCHANT_DELIVERY")
        ).toBe("MERCHANT_DELIVERY");
    });

    it("maps platform-configured stores to platform logistics when delivering", () => {
        expect(
            resolveOrderFulfillmentType("PLATFORM", "MERCHANT_DELIVERY")
        ).toBe("PLATFORM_LOGISTICS");
        expect(shouldCreatePlatformDeliveryTask("PLATFORM_LOGISTICS")).toBe(true);
        expect(shouldCreatePlatformDeliveryTask("MERCHANT_DELIVERY")).toBe(false);
    });

    it("pickup-only stores reject delivery", () => {
        expect(() =>
            resolveOrderFulfillmentType("PICKUP_ONLY", "MERCHANT_DELIVERY")
        ).toThrow();
        expect(resolveOrderFulfillmentType("PICKUP_ONLY", "PICKUP")).toBe("PICKUP");
    });

    it("merchant self mode supports merchant delivery", () => {
        expect(storeSupportsMerchantDelivery("MERCHANT_SELF")).toBe(true);
        expect(storeSupportsMerchantDelivery("PICKUP_ONLY")).toBe(false);
    });
});
