import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { eq, and, inArray, sql, desc, count, gte } from "drizzle-orm";

export class SellerInsightsService {
    async listCustomersForStore(storeId: string) {
        const grouped = await db
            .select({
                userId: orders.userId,
                orderCount: count(),
                lastOrderAt: sql<string>`max(${orders.createdAt})::text`,
                spent: sql<string>`coalesce(sum(${orders.totalAmount})::text, '0')`,
            })
            .from(orders)
            .where(eq(orders.storeId, storeId))
            .groupBy(orders.userId)
            .orderBy(desc(sql`max(${orders.createdAt})`))
            .limit(200);

        const userIds = grouped.map((g) => g.userId).filter(Boolean) as string[];
        if (userIds.length === 0) return [];

        const userRows = await db
            .select({
                id: users.id,
                name: users.name,
                phone: users.phone,
                email: users.email,
            })
            .from(users)
            .where(inArray(users.id, userIds));

        const byId = new Map(userRows.map((u) => [u.id, u]));

        return grouped.map((g) => ({
            userId: g.userId,
            orderCount: Number(g.orderCount ?? 0),
            spent: Number(g.spent ?? 0),
            lastOrderAt: g.lastOrderAt,
            user: g.userId ? byId.get(g.userId) ?? null : null,
        }));
    }

    async getEarningsSummary(storeId: string) {
        const [delivered] = await db
            .select({
                orders: count(),
                revenue: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`,
            })
            .from(orders)
            .where(and(eq(orders.storeId, storeId), eq(orders.status, "DELIVERED")));

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [last30] = await db
            .select({
                revenue: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`,
                orders: count(),
            })
            .from(orders)
            .where(
                and(
                    eq(orders.storeId, storeId),
                    eq(orders.status, "DELIVERED"),
                    gte(orders.createdAt, thirtyDaysAgo)
                )
            );

        const [pending] = await db
            .select({ orders: count() })
            .from(orders)
            .where(
                and(
                    eq(orders.storeId, storeId),
                    inArray(orders.status, [
                        "PLACED",
                        "PENDING_PAYMENT",
                        "ACCEPTED",
                        "CONFIRMED",
                        "PACKED",
                        "SHIPPED",
                        "OUT_FOR_DELIVERY",
                    ])
                )
            );

        return {
            currency: "NPR",
            lifetimeDeliveredRevenue: Number(delivered?.revenue ?? 0),
            lifetimeDeliveredOrders: Number(delivered?.orders ?? 0),
            last30DaysRevenue: Number(last30?.revenue ?? 0),
            last30DaysOrders: Number(last30?.orders ?? 0),
            openPipelineOrders: Number(pending?.orders ?? 0),
        };
    }
}

export const sellerInsightsService = new SellerInsightsService();
