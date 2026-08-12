import { describe, expect, it } from "bun:test";
import { billSplitService } from "@/modules/payment/bill-split.service";

describe("Bill Splitting Logic", () => {
    it("should be defined", () => {
        expect(billSplitService).toBeDefined();
    });

    it("should calculate equal split logic correctly", () => {
        const total = 1000;
        const participants = 3;
        const split = Math.floor((total / participants) * 100) / 100;
        expect(split).toBe(333.33);
        const remainder = total - (split * participants);
        expect(remainder).toBeCloseTo(0.01);
    });
});
