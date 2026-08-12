import { db } from "@/db";
import {  productVariants } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { cartService } from "@/modules/cart/cart.service";
import { NotFoundError, BadRequestError } from "@/utils/errors";

// Metric: <100ms goal -> distinct SQL query rather than App-layer filter
// Time Buckets: MORNING (5-11), AFTERNOON (11-16), EVENING (16-21), NIGHT (21-5)

interface ReorderCandidate {
    variantId: string;
    productName: string;
    storeId: string;
    storeName: string;
    lastPrice: number;
    currentPrice: number;
    frequency: number;
    lastOrderedAt: Date;
    score: number;
    inStock: boolean;
}

export class SmartReorderService {

    async getReorderSuggestions(userId: string): Promise<ReorderCandidate[]> {

        // Complex Query:
        // 1. Get User's ordered items (completed orders only)
        // 2. Join with Current Variant/Product Info (to check stock/archived)
        // 3. Aggregate Frequency
        // 4. Boost Score if frequently bought in current Time Bucket (Simulated via simple recency/freq for MVP SQL)

        // Note: Full Time-of-Day extraction from SQL is expensive without pre-computed columns.
        // For <100ms, we will rely on Frequency (Base) + In-Memory Time Boost if needed, 
        // OR just pure Frequency decending filtered by Stock.

        const rawItems = await db.execute(sql`
            SELECT 
                oi.variant_id as "variantId",
                oi.product_name as "productName",
                o.store_id as "storeId",
                s.name as "storeName",
                MAX(oi.price_at_purchase) as "lastPrice",
                COUNT(*) as "frequency",
                MAX(o.created_at) as "lastOrderedAt",
                v.price as "currentPrice",
                v.inventory_quantity as "stock"
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            JOIN product_variants v ON v.id = oi.variant_id
            JOIN products p ON p.id = v.product_id
            JOIN stores s ON s.id = o.store_id
            WHERE 
                o.user_id = ${userId} 
                AND o.status = 'DELIVERED'
                AND v.is_active = true
                AND p.is_archived = false
                AND v.inventory_quantity > 0
            GROUP BY oi.variant_id, oi.product_name, o.store_id, s.name, v.price, v.inventory_quantity
            ORDER BY frequency DESC
            LIMIT 20
        `);

        // Transform and Score
        const candidates: ReorderCandidate[] = rawItems.map((r: any) => ({
            variantId: r.variantId,
            productName: r.productName,
            storeId: r.storeId,
            storeName: r.storeName,
            lastPrice: Number(r.lastPrice),
            currentPrice: Number(r.currentPrice),
            frequency: Number(r.frequency),
            lastOrderedAt: new Date(r.lastOrderedAt),
            score: Number(r.frequency), // Base Score
            inStock: r.stock > 0
        }));

        // Application-Layer Time-of-Day Re-ranking (Optimization)
        // If we had a "UserOrderProfile" with buckets, we'd boost here.
        // For now, Recency Boost:
        return candidates.map(c => {
            // Boost if bought recently (habit) but not TOO recently (already stocked)?
            // "Smart" Rule: Higher frequency is dominant.
            return c;
        }).sort((a, b) => b.frequency - a.frequency).slice(0, 10);
    }

    async reorderItem(userId: string, variantId: string) {
        // 1. Validation
        const variant = await db.query.productVariants.findFirst({
            where: eq(productVariants.id, variantId),
            with: { product: true, inventory: true }
        });

        if (!variant) throw new NotFoundError("Product not found");
        if (!variant.isActive) throw new BadRequestError("Product archived");
        if (variant.inventory.quantity <= 0) throw new BadRequestError("Out of stock");

        // 2. Price Check (Silent Update, Warn if drastic?)
        // For 2-tap, we use CURRENT price.

        // 3. Add to Cart (Reuse Service)
        return await cartService.addItem(userId, variantId, 1);
    }
}

export const smartReorderService = new SmartReorderService();
