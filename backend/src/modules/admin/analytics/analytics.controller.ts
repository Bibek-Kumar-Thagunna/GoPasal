import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/rbac";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema/orders";
import { users } from "@/db/schema/users";
import { stores } from "@/db/schema/stores";
import { products, productVariants } from "@/db/schema/catalog";
import { success } from "@/utils/response";
import { sql, desc, eq } from "drizzle-orm";

export const adminAnalyticsController = new Elysia({
    prefix: "/api/v1/admin/analytics",
})
    .use(requireAuth())
    .use(requireRole("SUPER_ADMIN", "PLATFORM_OPERATOR"))
    .get("/dashboard", async () => {
        const [orderStats] = await db
            .select({
                totalOrders: sql<number>`count(*)`.mapWith(Number),
                totalRevenue: sql<number>`sum(${orders.totalAmount})`.mapWith(
                    Number
                ),
            })
            .from(orders);

        const [userStats] = await db
            .select({ count: sql<number>`count(*)`.mapWith(Number) })
            .from(users);

        const [storeStats] = await db
            .select({ count: sql<number>`count(*)`.mapWith(Number) })
            .from(stores)
            .where(sql`${stores.status} = 'ACTIVE'`);

        return success({
            totalOrders: orderStats?.totalOrders ?? 0,
            totalRevenue: orderStats?.totalRevenue ?? 0,
            totalUsers: userStats?.count ?? 0,
            activeStores: storeStats?.count ?? 0,
        });
    })
    .get("/order-status-counts", async () => {
        const rows = await db
            .select({
                status: orders.status,
                count: sql<number>`count(*)::int`.mapWith(Number),
            })
            .from(orders)
            .groupBy(orders.status);

        const totalOrders = rows.reduce((s, r) => s + (r.count ?? 0), 0);
        const withPct = rows.map((r) => ({
            status: r.status,
            count: r.count,
            percent:
                totalOrders > 0 ? Math.round((r.count / totalOrders) * 1000) / 10 : 0,
        }));
        return success({ breakdown: withPct, totalOrders });
    })
    .get(
        "/recent-orders",
        async ({ query }) => {
        const limit = Math.min(
            25,
            Math.max(1, query.limit ? parseInt(query.limit, 10) : 8)
        );
        const rows = await db
            .select({
                id: orders.id,
                status: orders.status,
                totalAmount: orders.totalAmount,
                createdAt: orders.createdAt,
                customerName: users.name,
                customerPhone: users.phone,
                storeName: stores.name,
            })
            .from(orders)
            .innerJoin(users, eq(orders.userId, users.id))
            .innerJoin(stores, eq(orders.storeId, stores.id))
            .orderBy(desc(orders.createdAt))
            .limit(limit);

            return success(rows);
        },
        {
            query: t.Object({ limit: t.Optional(t.String()) }),
            detail: {
                tags: ["Admin - Analytics"],
                summary: "Recent orders for dashboard",
            },
        }
    )
    .get("/catalog-overview", async () => {
        const [p] = await db
            .select({ count: sql<number>`count(*)::int`.mapWith(Number) })
            .from(products)
            .where(eq(products.isActive, true));
        const [s] = await db
            .select({ count: sql<number>`count(*)::int`.mapWith(Number) })
            .from(stores);
        return success({
            activeProducts: p?.count ?? 0,
            storesTotal: s?.count ?? 0,
        });
    })
    .get("/revenue-chart", async () => {
        const dailyRevenue = await db.execute(sql`
            SELECT DATE(created_at) as date, SUM(total_amount) as revenue
            FROM orders
            WHERE created_at > NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) ASC
        `);
        return success(
            dailyRevenue as unknown as { date: string; revenue: number }[]
        );
    })
    .get("/top-products", async () => {
        const rows = await db
            .select({
                productId: products.id,
                productName: products.name,
                totalSold: sql<number>`sum(${orderItems.quantity})`.mapWith(
                    Number
                ),
                revenue: sql<number>`sum(${orderItems.priceAtPurchase} * ${orderItems.quantity})`.mapWith(
                    Number
                ),
            })
            .from(orderItems)
            .innerJoin(
                productVariants,
                eq(orderItems.variantId, productVariants.id)
            )
            .innerJoin(products, eq(productVariants.productId, products.id))
            .groupBy(products.id, products.name)
            .orderBy(desc(sql`sum(${orderItems.quantity})`))
            .limit(5);
        return success(rows);
    });
