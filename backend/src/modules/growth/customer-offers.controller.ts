import { Elysia } from "elysia";
import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { PLATFORM_PROMO_STORE_ID } from "@/config/commerce";
import { success } from "@/utils/response";

function mapCouponToOffer(c: typeof coupons.$inferSelect) {
    return {
        id: c.id,
        title: c.code,
        description:
            c.type === "PERCENT"
                ? `${c.value}% off orders over Rs. ${c.minOrderValue}`
                : `Rs. ${c.value} off orders over Rs. ${c.minOrderValue}`,
        discount: Number(c.value),
        discountType: c.type === "PERCENT" ? ("PERCENTAGE" as const) : ("FIXED" as const),
        code: c.code,
        validUntil: c.endDate.toISOString(),
        minOrderValue: Number(c.minOrderValue),
    };
}

export const customerOffersController = new Elysia({ prefix: "/api/v1/offers" }).get(
    "/",
    async () => {
        const now = new Date();
        const rows = await db
            .select()
            .from(coupons)
            .where(
                and(
                    eq(coupons.status, "ACTIVE"),
                    eq(coupons.storeId, PLATFORM_PROMO_STORE_ID),
                    gt(coupons.endDate, now)
                )
            )
            .orderBy(desc(coupons.createdAt))
            .limit(50);

        return success(rows.map(mapCouponToOffer));
    },
    {
        detail: { tags: ["Growth"], summary: "List platform offers for customers" },
    }
);
