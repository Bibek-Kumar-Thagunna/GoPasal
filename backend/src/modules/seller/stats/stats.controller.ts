import { Elysia } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireTenant } from "@/middlewares/tenant";
import { requireSellerPermission } from "@/middlewares/seller-store-permission";
import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { stores } from "@/db/schema/stores";
import { products, productVariants, inventory } from "@/db/schema/catalog";
import { eq, and, desc, gte, lte, sql, count, inArray } from "drizzle-orm";
import { success } from "@/utils/response";
import { privateSellerShortTermCache } from "@/utils/http-cache-headers";

function startOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function endOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
}

export const sellerStatsController = new Elysia({ prefix: "/api/v1/seller/stats" })
    .group("", (app) =>
        app
        .use(requireAuth())
        .use(requireTenant())
        .use(requireSellerPermission("analytics.view"))
        .get("/", async ({ tenantId, set }) => {
            privateSellerShortTermCache(set);
            const storeId = tenantId!;

            const [store] = await db.select().from(stores).where(eq(stores.id, storeId));
            if (!store) {
                return success({
                    storeId,
                    storeName: null,
                    todayRevenue: 0,
                    todayOrders: 0,
                    pendingOrders: 0,
                    totalProducts: 0,
                    avgRating: 0,
                    totalReviews: 0,
                    totalOrders: 0,
                    totalRevenue: 0,
                    weekChart: [] as { label: string; revenue: number }[],
                    recentOrders: [] as unknown[],
                    lowStock: [] as unknown[],
                });
            }

            const todayStart = startOfDay(new Date());

            const [todayRow] = await db
                .select({
                    todayOrders: count(),
                    todayRevenue: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`,
                })
                .from(orders)
                .where(and(eq(orders.storeId, storeId), gte(orders.createdAt, todayStart)));

            const [pendingRow] = await db
                .select({ c: count() })
                .from(orders)
                .where(
                    and(
                        eq(orders.storeId, storeId),
                        inArray(orders.status, ["PLACED", "PENDING_PAYMENT"])
                    )
                );

            const [totalsRow] = await db
                .select({
                    totalOrders: count(),
                    totalRevenue: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`,
                })
                .from(orders)
                .where(eq(orders.storeId, storeId));

            const [productCountRow] = await db
                .select({ c: count() })
                .from(products)
                .where(and(eq(products.storeId, storeId), eq(products.isArchived, false)));

            const weekChart: { label: string; revenue: number }[] = [];
            for (let i = 6; i >= 0; i--) {
                const day = new Date();
                day.setDate(day.getDate() - i);
                const s = startOfDay(day);
                const e = endOfDay(day);
                const [row] = await db
                    .select({
                        rev: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`,
                    })
                    .from(orders)
                    .where(
                        and(
                            eq(orders.storeId, storeId),
                            gte(orders.createdAt, s),
                            lte(orders.createdAt, e)
                        )
                    );
                weekChart.push({
                    label: s.toLocaleDateString("en-US", { weekday: "short" }),
                    revenue: Number(row?.rev ?? 0),
                });
            }

            const recentOrders = await db.query.orders.findMany({
                where: eq(orders.storeId, storeId),
                orderBy: desc(orders.createdAt),
                limit: 6,
                with: {
                    user: true,
                    deliveryAddress: true,
                    items: true,
                },
            });

            const lowStockCandidates = await db
                .select({
                    productId: products.id,
                    name: products.name,
                    quantity: inventory.quantity,
                    threshold: inventory.lowStockThreshold,
                    images: products.images,
                })
                .from(products)
                .innerJoin(productVariants, eq(productVariants.productId, products.id))
                .innerJoin(inventory, eq(inventory.variantId, productVariants.id))
                .where(
                    and(
                        eq(products.storeId, storeId),
                        eq(products.isArchived, false),
                        sql`${inventory.quantity} <= coalesce(${inventory.lowStockThreshold}, 5)`
                    )
                )
                .orderBy(inventory.quantity)
                .limit(120);

            const byProduct = new Map<
                string,
                {
                    id: string;
                    name: string;
                    remaining: number;
                    threshold: number;
                    image: string | null;
                }
            >();
            for (const r of lowStockCandidates) {
                const threshold = r.threshold ?? 5;
                const prev = byProduct.get(r.productId);
                if (!prev || r.quantity < prev.remaining) {
                    byProduct.set(r.productId, {
                        id: r.productId,
                        name: r.name,
                        remaining: r.quantity,
                        threshold,
                        image:
                            Array.isArray(r.images) && r.images.length > 0 ? r.images[0]! : null,
                    });
                }
            }

            const lowStock = Array.from(byProduct.values())
                .sort((a, b) => a.remaining - b.remaining)
                .slice(0, 8);

            return success({
                storeId: store.id,
                storeName: store.name,
                todayRevenue: Number(todayRow?.todayRevenue ?? 0),
                todayOrders: Number(todayRow?.todayOrders ?? 0),
                pendingOrders: Number(pendingRow?.c ?? 0),
                totalProducts: Number(productCountRow?.c ?? 0),
                avgRating: 0,
                totalReviews: 0,
                totalOrders: Number(totalsRow?.totalOrders ?? 0),
                totalRevenue: Number(totalsRow?.totalRevenue ?? 0),
                weekChart,
                recentOrders,
                lowStock,
            });
        })
);
