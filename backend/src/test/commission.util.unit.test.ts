import { describe, expect, it } from "bun:test";
import { normalizeCommissionPercent, splitGrossByCommissionPercent } from "@/modules/payment/commission.util";

describe("commission.util", () => {
    it("normalizes out-of-range percent", () => {
        expect(normalizeCommissionPercent(-5)).toBe(0);
        expect(normalizeCommissionPercent(150)).toBe(100);
        expect(normalizeCommissionPercent(undefined)).toBe(10);
    });

    it("splits gross using percent semantics (10 = 10%)", () => {
        const { commission, net, percentUsed } = splitGrossByCommissionPercent(1000, 10);
        expect(percentUsed).toBe(10);
        expect(commission).toBe(100);
        expect(net).toBe(900);
    });

    it("matches store snapshot 5%", () => {
        const { commission, net } = splitGrossByCommissionPercent(200, 5);
        expect(commission).toBe(10);
        expect(net).toBe(190);
    });
});
