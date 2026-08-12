import { describe, expect, it, beforeAll } from "bun:test";
import { couponService } from "@/modules/growth/coupon.service";
import { loyaltyService } from "@/modules/growth/loyalty.service";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { generateId } from "@/utils";

describe("Growth Engine", () => {
    let storeId: string;
    let userId: string;
    let couponId: string;
    const COUPON_CODE = "TEST50";

    beforeAll(async () => {
        storeId = "store_growth_" + generateId();
        userId = "user_growth_" + generateId();
        couponId = generateId();

        // Create Coupon
        await db.insert(coupons).values({
            id: couponId,
            storeId,
            code: COUPON_CODE,
            type: "FIXED",
            value: "50",
            minOrderValue: "100",
            startDate: new Date(Date.now() - 10000), // Active
            endDate: new Date(Date.now() + 100000),
            usageLimitTotal: 10,
            status: "ACTIVE"
        } as any);

        // Mock User? Not needed for direct service test if only relying on ID string
    });

    it("should validate valid coupon", async () => {
        const res = await couponService.validateCoupon(COUPON_CODE, storeId, userId, 200);
        expect(res.isValid).toBe(true);
        expect(res.discountAmount).toBe(50);
    });

    it("should reject invalid amount coupon", async () => {
        try {
            await couponService.validateCoupon(COUPON_CODE, storeId, userId, 50); // < 100
        } catch (e: any) {
            expect(e.message).toContain("Minimum order value");
        }
    });

    it("should earn loyalty points", async () => {
        // Mock add transaction
        const initial = await loyaltyService.getBalance(userId);

        await loyaltyService.addTransaction(userId, 10, "EARN", "order_123");

        const final = await loyaltyService.getBalance(userId);
        expect(final).toBe(initial + 10);
    });
});
