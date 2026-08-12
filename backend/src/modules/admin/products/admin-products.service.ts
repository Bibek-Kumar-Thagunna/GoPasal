import { db } from "@/db";
import { products, stores } from "@/db/schema";
import { desc, eq, ilike, sql, and, SQL } from "drizzle-orm";

export class AdminProductsService {
    async listProducts(params: {
        page: number;
        limit: number;
        q?: string;
        storeId?: string;
        onlyActive?: boolean;
    }) {
        const page = Math.max(1, params.page);
        const limit = Math.min(100, Math.max(1, params.limit));
        const offset = (page - 1) * limit;

        const filters: SQL[] = [];
        if (params.onlyActive !== false) {
            filters.push(eq(products.isActive, true));
        }
        if (params.q?.trim()) {
            filters.push(ilike(products.name, `%${params.q.trim()}%`));
        }
        if (params.storeId) {
            filters.push(eq(products.storeId, params.storeId));
        }
        const whereClause = filters.length ? and(...filters) : undefined;

        const countBase = db.select({ c: sql<number>`count(*)::int`.mapWith(Number) }).from(products);
        const [countRow] = whereClause ? await countBase.where(whereClause) : await countBase;
        const total = countRow?.c ?? 0;

        const query = db
            .select({
                id: products.id,
                name: products.name,
                slug: products.slug,
                storeId: products.storeId,
                storeName: stores.name,
                basePrice: products.basePrice,
                isActive: products.isActive,
                createdAt: products.createdAt,
            })
            .from(products)
            .innerJoin(stores, eq(products.storeId, stores.id))
            .orderBy(desc(products.createdAt))
            .limit(limit)
            .offset(offset);

        const items = whereClause ? await query.where(whereClause) : await query;

        return { items, total, page, limit };
    }

    async setProductActive(productId: string, isActive: boolean) {
        const [updated] = await db
            .update(products)
            .set({ isActive, updatedAt: new Date() })
            .where(eq(products.id, productId))
            .returning();
        return updated ?? null;
    }

    async listStoreOptions() {
        const rows = await db
            .select({
                id: stores.id,
                name: stores.name,
                slug: stores.slug,
                status: stores.status,
            })
            .from(stores)
            .orderBy(desc(stores.createdAt))
            .limit(500);
        return rows;
    }
}

export const adminProductsService = new AdminProductsService();
