import { describe, expect, it } from "bun:test";
import {
    ALLOWED_TRANSITIONS,
    isAllowedTransition,
    isIdempotentStatusUpdate,
    isSellerTransitionAllowed,
} from "@/modules/seller/order/order.workflow";

describe("seller order workflow", () => {
    it("allows PLACED → ACCEPTED", () => {
        expect(isAllowedTransition("PLACED", "ACCEPTED")).toBe(true);
    });

    it("rejects PLACED → DELIVERED", () => {
        expect(isAllowedTransition("PLACED", "DELIVERED")).toBe(false);
    });

    it("allows PACKED → DELIVERED for PICKUP orders only", () => {
        expect(isSellerTransitionAllowed("PACKED", "DELIVERED", "PICKUP")).toBe(true);
    });

    it("allows merchant self-delivery shortcuts without platform riders", () => {
        expect(isSellerTransitionAllowed("PACKED", "DELIVERED", "MERCHANT_DELIVERY")).toBe(
            true
        );
        expect(
            isSellerTransitionAllowed("PACKED", "OUT_FOR_DELIVERY", "MERCHANT_DELIVERY")
        ).toBe(true);
        expect(isSellerTransitionAllowed("PACKED", "DELIVERED", "PLATFORM_LOGISTICS")).toBe(
            false
        );
    });

    it("marks identical status as idempotent", () => {
        expect(isIdempotentStatusUpdate("ACCEPTED", "ACCEPTED")).toBe(true);
    });

    it("defines outgoing transitions for every enum member", () => {
        const keys = Object.keys(ALLOWED_TRANSITIONS) as (keyof typeof ALLOWED_TRANSITIONS)[];
        for (const k of keys) {
            expect(Array.isArray(ALLOWED_TRANSITIONS[k])).toBe(true);
        }
    });
});
