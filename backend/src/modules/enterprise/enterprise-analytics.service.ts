import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { masterMerchants } from "@/db/schema/enterprise";
import { stores } from "@/db/schema/stores";
import { eq, inArray, sum, count } from "drizzle-orm";

export class EnterpriseAnalyticsService {

    async getConsolidatedStats(masterId: string) {
        // 1. Get Branches
        const master = await db.query.masterMerchants.findFirst({
            where: eq(masterMerchants.id, masterId)
        });

        if (!master || !master.branchIds || master.branchIds.length === 0) {
            return { totalRevenue: 0, totalOrders: 0 };
        }

        const branchIds = master.branchIds;

        // 2. Aggregate
        const [stats] = await db
            .select({
                totalRevenue: sum(orders.totalAmount),
                totalOrders: count(orders.id)
            })
            .from(orders)
            .where(
                inArray(orders.storeId, branchIds)
            );

        return {
            totalRevenue: Number(stats.totalRevenue || 0),
            totalOrders: Number(stats.totalOrders || 0),
            branchCount: branchIds.length
        };
    }

    async getBranchBreakdown(masterId: string) {
        const master = await db.query.masterMerchants.findFirst({
            where: eq(masterMerchants.id, masterId)
        });

        if (!master || !master.branchIds || master.branchIds.length === 0) return [];

        const stats = await db
            .select({
                storeId: orders.storeId,
                storeName: stores.name,
                revenue: sum(orders.totalAmount),
                orderCount: count(orders.id)
            })
            .from(orders)
            .innerJoin(stores, eq(orders.storeId, stores.id))
            .where(inArray(orders.storeId, master.branchIds))
            .groupBy(orders.storeId, stores.name);

        return stats.map(s => ({
            storeId: s.storeId,
            storeName: s.storeName,
            revenue: Number(s.revenue),
            orderCount: Number(s.orderCount)
        }));
    }
}
