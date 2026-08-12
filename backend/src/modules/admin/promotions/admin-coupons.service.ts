import { db } from "@/db";
import { coupons, stores } from "@/db/schema";
import { desc, eq, ilike, sql, and, SQL } from "drizzle-orm";
import { growthService } from "@/modules/growth/growth.service";
import { PLATFORM_PROMO_STORE_ID } from "@/config/commerce";
import { NotFoundError } from "@/utils/errors";

export class AdminCouponsService {
    async listCoupons(params: {
        page: number;
        limit: number;
        q?: string;
        storeId?: string;
    }) {
        const page = Math.max(1, params.page);
        const limit = Math.min(100, Math.max(1, params.limit));
        const offset = (page - 1) * limit;

        const filters: SQL[] = [];
        if (params.q?.trim()) {
            filters.push(ilike(coupons.code, `%${params.q.trim()}%`));
        }
        if (params.storeId) {
            filters.push(eq(coupons.storeId, params.storeId));
        }
        const whereClause = filters.length ? and(...filters) : undefined;

        const countBase = db.select({ c: sql<number>`count(*)::int`.mapWith(Number) }).from(coupons);
        const [countRow] = whereClause ? await countBase.where(whereClause) : await countBase;
        const total = countRow?.c ?? 0;

        const qy = db
            .select({
                coupon: coupons,
                storeName: stores.name,
            })
            .from(coupons)
            .innerJoin(stores, eq(coupons.storeId, stores.id))
            .orderBy(desc(coupons.createdAt))
            .limit(limit)
            .offset(offset);

        const rows = whereClause ? await qy.where(whereClause) : await qy;

        return {
            items: rows.map((r) => ({
                ...r.coupon,
                storeName: r.storeName,
                isPlatformWide: r.coupon.storeId === PLATFORM_PROMO_STORE_ID,
            })),
            total,
            page,
            limit,
        };
    }

    async updateStatus(couponId: string, status: "ACTIVE" | "PAUSED") {
        const [existing] = await db.select().from(coupons).where(eq(coupons.id, couponId));
        if (!existing) throw new NotFoundError("Coupon not found");

        const [updated] = await db
            .update(coupons)
            .set({ status, updatedAt: new Date() })
            .where(eq(coupons.id, couponId))
            .returning();

        return updated;
    }

    async updateStatusForStore(
        couponId: string,
        storeId: string,
        status: "ACTIVE" | "PAUSED"
    ) {
        const [existing] = await db
            .select()
            .from(coupons)
            .where(and(eq(coupons.id, couponId), eq(coupons.storeId, storeId)))
            .limit(1);
        if (!existing) throw new NotFoundError("Coupon not found for this store");
        return this.updateStatus(couponId, status);
    }

    async createCoupon(input: {
        storeId?: string;
        code: string;
        type: "FIXED" | "PERCENT";
        value: string;
        minOrderValue: string;
        maxDiscount: string | null;
        startDate: Date;
        endDate: Date;
        usageLimitTotal: number | null;
        usageLimitPerUser: number;
        requiresMembership: boolean;
        createdBy: string;
    }) {
        const storeId = input.storeId?.trim() || PLATFORM_PROMO_STORE_ID;
        return growthService.createCoupon(storeId, {
            code: input.code.trim().toUpperCase(),
            type: input.type,
            value: input.value,
            minOrderValue: input.minOrderValue,
            maxDiscount: input.maxDiscount,
            startDate: input.startDate,
            endDate: input.endDate,
            status: "ACTIVE",
            requiresGold: input.requiresMembership,
            usageLimitTotal: input.usageLimitTotal,
            usageLimitPerUser: input.usageLimitPerUser,
            createdBy: input.createdBy,
        });
    }
}

export const adminCouponsService = new AdminCouponsService();
