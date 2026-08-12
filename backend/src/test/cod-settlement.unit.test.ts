import { describe, expect, it } from "bun:test";
import {
    paymentCollectionStatusForNewOrder,
} from "@/modules/payment/order-payment.util";
import { checkDeliveryServiceability } from "@/utils/geo";

describe("COD checkout and settlement helpers", () => {
    it("marks COD orders as pending collection at place time", () => {
        expect(paymentCollectionStatusForNewOrder("COD")).toBe("PENDING");
    });

    it("marks online orders as pending until gateway confirms", () => {
        expect(paymentCollectionStatusForNewOrder("ESEWA")).toBe("PENDING");
    });
});

describe("COD delivery radius (regression)", () => {
    it("still blocks out-of-range addresses", () => {
        const result = checkDeliveryServiceability({
            storeLatitude: 27.7172,
            storeLongitude: 85.324,
            storeDeliveryRadius: 2,
            storeDeliveryType: "MERCHANT_SELF",
            customerLatitude: 27.75,
            customerLongitude: 85.324,
        });
        expect(result.ok).toBe(false);
    });
});
