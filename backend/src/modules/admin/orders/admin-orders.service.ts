import { db } from "@/db";
import { orders, users, stores, orderItems, productVariants } from "@/db/schema";
import { desc, eq, sql, and, SQL, ilike, or } from "drizzle-orm";
import { NotFoundError } from "@/utils/errors";

export class AdminOrdersService {
    async listOrders(params: {
        page: number;
        limit: number;
        status?: string;
        /** Case-insensitive match on order id, customer phone, customer name, or store name */
        q?: string;
    }) {
        const page = Math.max(1, params.page);
        const limit = Math.min(100, Math.max(1, params.limit));
        const offset = (page - 1) * limit;

        const filters: SQL[] = [];
        if (params.status) {
            filters.push(eq(orders.status, params.status as (typeof orders.$inferSelect)["status"]));
        }
        const qRaw = params.q?.trim();
        if (qRaw) {
            const safe = qRaw.replace(/[%_\\]/g, "");
            if (safe.length > 0) {
                const pattern = `%${safe}%`;
                filters.push(
                    or(
                        ilike(orders.id, pattern),
                        ilike(users.phone, pattern),
                        ilike(users.name, pattern),
                        ilike(stores.name, pattern)
                    )!
                );
            }
        }
        const whereClause = filters.length ? and(...filters) : undefined;

        const joinQueryBase = db
            .select({ c: sql<number>`count(*)::int`.mapWith(Number) })
            .from(orders)
            .innerJoin(users, eq(orders.userId, users.id))
            .innerJoin(stores, eq(orders.storeId, stores.id));

        const [countRow] = whereClause
            ? await joinQueryBase.where(whereClause)
            : await joinQueryBase;

        const total = countRow?.c ?? 0;

        const listQuery = db
            .select({
                id: orders.id,
                userId: orders.userId,
                storeId: orders.storeId,
                status: orders.status,
                paymentStatus: orders.paymentStatus,
                totalAmount: orders.totalAmount,
                paymentMethod: orders.paymentMethod,
                fulfillmentType: orders.fulfillmentType,
                createdAt: orders.createdAt,
                customerPhone: users.phone,
                customerName: users.name,
                storeName: stores.name,
            })
            .from(orders)
            .innerJoin(users, eq(orders.userId, users.id))
            .innerJoin(stores, eq(orders.storeId, stores.id))
            .orderBy(desc(orders.createdAt))
            .limit(limit)
            .offset(offset);

        const rows = whereClause ? await listQuery.where(whereClause) : await listQuery;

        return { items: rows, total, page, limit };
    }

    async getOrderDetail(orderId: string) {
        const [row] = await db
            .select({
                id: orders.id,
                userId: orders.userId,
                storeId: orders.storeId,
                status: orders.status,
                paymentStatus: orders.paymentStatus,
                totalAmount: orders.totalAmount,
                paymentMethod: orders.paymentMethod,
                fulfillmentType: orders.fulfillmentType,
                notes: orders.notes,
                pricingSnapshot: orders.pricingSnapshot,
                createdAt: orders.createdAt,
                updatedAt: orders.updatedAt,
                customerPhone: users.phone,
                customerName: users.name,
                customerEmail: users.email,
                storeName: stores.name,
                storeSlug: stores.slug,
            })
            .from(orders)
            .innerJoin(users, eq(orders.userId, users.id))
            .innerJoin(stores, eq(orders.storeId, stores.id))
            .where(eq(orders.id, orderId))
            .limit(1);

        if (!row) throw new NotFoundError("Order not found");

        const items = await db
            .select({
                id: orderItems.id,
                quantity: orderItems.quantity,
                priceAtPurchase: orderItems.priceAtPurchase,
                productName: orderItems.productName,
                variantName: productVariants.name,
            })
            .from(orderItems)
            .innerJoin(productVariants, eq(orderItems.variantId, productVariants.id))
            .where(eq(orderItems.orderId, orderId));

        return { ...row, items };
    }
}

export const adminOrdersService = new AdminOrdersService();
