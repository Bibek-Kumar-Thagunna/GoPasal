import { db, type DbTransaction } from "@/db";
import { coupons, couponRedemptions } from "@/db/schema";
import { eq, and, or, sql } from "drizzle-orm";
import {  ValidationError } from "@/utils/errors";
import { generateId } from "@/utils";
import { PLATFORM_PROMO_STORE_ID } from "@/config/commerce";

export class CouponService {
    async validateCoupon(code: string, storeId: string, userId: string, cartTotal: number) {
        // 1. Find Coupon
        const [coupon] = await db
            .select()
            .from(coupons)
            .where(
                and(
                    eq(coupons.code, code),
                    or(
                        eq(coupons.storeId, storeId),
                        eq(coupons.storeId, PLATFORM_PROMO_STORE_ID)
                    ),
                    eq(coupons.status, "ACTIVE")
                )
            );

        if (!coupon) throw new ValidationError("Invalid coupon code");

        // 2. Check Dates
        const now = new Date();
        if (now < coupon.startDate || now > coupon.endDate) {
            throw new ValidationError("Coupon expired or not yet active");
        }

        // 3. Check Min Order Value
        if (cartTotal < Number(coupon.minOrderValue)) {
            throw new ValidationError(`Minimum order value of ${coupon.minOrderValue} required`);
        }

        // 4. Check Global Usage Limit
        if (coupon.usageLimitTotal && (coupon.usedCount || 0) >= coupon.usageLimitTotal) {
            throw new ValidationError("Coupon usage limit exceeded");
        }

        // 5. Check Per User Limit
        const userUsage = await db.select({ count: sql<number>`count(*)` })
            .from(couponRedemptions)
            .where(and(
                eq(couponRedemptions.couponId, coupon.id),
                eq(couponRedemptions.userId, userId)
            ));

        if (Number(userUsage[0].count) >= (coupon.usageLimitPerUser || 1)) {
            throw new ValidationError("You have already used this coupon");
        }

        // 6. Check Gold Requirement
        if (coupon.requiresGold) {
            const { subscriptionService } = await import("@/modules/growth/subscription.service");
            const sub = await subscriptionService.getActiveSubscription(userId);
            if (!sub) {
                throw new ValidationError("This coupon is exclusively for GoPasal Gold members");
            }
        }

        // 7. Calculate Discount
        let discount = 0;
        if (coupon.type === "FIXED") {
            discount = Number(coupon.value);
        } else {
            discount = (cartTotal * Number(coupon.value)) / 100;
            if (coupon.maxDiscount) {
                discount = Math.min(discount, Number(coupon.maxDiscount));
            }
        }

        // Ensure discount doesn't exceed total
        discount = Math.min(discount, cartTotal);

        return {
            isValid: true,
            discountAmount: discount,
            couponId: coupon.id
        };
    }

    async redeemCoupon(couponId: string, userId: string, orderId: string, discountAmount: number) {
        return db.transaction(async (tx: DbTransaction) => {
            // 1. Record Redemption
            await tx.insert(couponRedemptions).values({
                id: generateId(),
                couponId,
                userId,
                orderId,
                discountAmount: String(discountAmount)
            });

            // 2. Increment Usage Count
            await tx.update(coupons)
                .set({
                    usedCount: sql`${coupons.usedCount} + 1`,
                    updatedAt: new Date()
                })
                .where(eq(coupons.id, couponId));
        });
    }

    async reverseRedemption(orderId: string) {
        // Find redemption
        const [redemption] = await db.select().from(couponRedemptions).where(eq(couponRedemptions.orderId, orderId));
        if (!redemption) return; // No coupon used

        // Decrement usage? 
        // Policy: If cancelled, allow re-use.
        await db.update(coupons)
            .set({ usedCount: sql`${coupons.usedCount} - 1` })
            .where(eq(coupons.id, redemption.couponId));

        // Remove redemption record or mark as reversed?
        // Let's delete it for simplicity to allow re-use check to pass, 
        // or we need a status field on redemption.
        // Given 'usage limit per user' check counts rows, we MUST delete or filter by status.
        // Schema didn't specify status on redemption but Plan said "REVERSED".
        // Schema impl was simple. Let's delete the row for now as MVP "Reversal".
        await db.delete(couponRedemptions).where(eq(couponRedemptions.id, redemption.id));
    }
}

export const couponService = new CouponService();
