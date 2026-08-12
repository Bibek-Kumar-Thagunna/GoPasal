import { db } from "@/db";
import { orders, productVariants, carts, cartItems, products, inventory, stores } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateId } from "@/utils";
import { NotFoundError, BadRequestError } from "@/utils/errors";

export class ReorderService {

    // 1. Buy Again Widget (Top frequent items)
    async getBuyAgain(userId: string, limit = 10) {
        // Aggregation: Count frequency of variantId for this user
        // Drizzle doesn't support complex groupBy easily in query builder, using SQL

        const rows = await db.execute(sql`
            SELECT 
                oi.variant_id as "variantId", 
                oi.product_name as "productName",
                COUNT(*) as "frequency",
                MAX(oi.price_at_purchase) as "lastPrice"
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE o.user_id = ${userId}
            GROUP BY oi.variant_id, oi.product_name
            ORDER BY frequency DESC
            LIMIT ${limit}
        `);

        return rows.map((r: any) => ({
            variantId: r.variantId,
            productName: r.productName,
            frequency: Number(r.frequency),
            lastPrice: Number(r.lastPrice)
        }));
    }

    // 2. Clone Order (2-Tap Reorder)
    async cloneOrder(userId: string, originalOrderId: string) {
        // A. Fetch Original Order
        const order = await db.query.orders.findFirst({
            where: eq(orders.id, originalOrderId),
            with: {
                items: true
            }
        });

        if (!order) throw new NotFoundError("Order not found");
        if (order.userId !== userId) throw new BadRequestError("Cannot clone another user's order");

        // B. Create New Cart
        const cartId = `cart_${generateId()}`;
        await db.insert(carts).values({
            id: cartId,
            userId,
            storeId: order.storeId, // Must fetch from same store
            type: "SINGLE",
            status: "OPEN"
        });

        // C. Add Items (Check Stock & Current Price)
        const itemsToAdd = [];
        const warnings = [];

        for (const item of order.items) {
            // Check current variant status
            const variant = await db.query.productVariants.findFirst({
                where: eq(productVariants.id, item.variantId),
                with: { inventory: true, product: true }
            });

            if (!variant || !variant.isActive || variant.product.isArchived) {
                warnings.push(`Item '${item.productName}' is no longer available.`);
                continue;
            }

            if (variant.inventory.quantity < item.quantity) {
                warnings.push(`Item '${item.productName}' out of stock (Requested: ${item.quantity}).`);
                continue;
            }

            // Price Check? We use current variant price (base + offset)
            // Implementation detail: simplified here, assuming basePrice handling in CartService
            // We just insert to cart_items
            itemsToAdd.push({
                id: `ci_${generateId()}_${item.variantId.slice(0, 4)}`,
                cartId,
                variantId: item.variantId,
                quantity: item.quantity,
                addedBy: userId
            });
        }

        if (itemsToAdd.length > 0) {
            await db.insert(cartItems).values(itemsToAdd);
        }

        return {
            cartId,
            itemsAdded: itemsToAdd.length,
            warnings
        };
    }

    // 3. Prediction (Simple Heuristic)
    async getRestockSuggestions(userId: string) {
        const [store] = await db
            .select({ id: stores.id })
            .from(stores)
            .where(eq(stores.ownerId, userId))
            .limit(1);
        if (!store) return [];

        const lowStock = await db
            .select({
                productId: products.id,
                productName: products.name,
                quantity: inventory.quantity,
                lowStockThreshold: inventory.lowStockThreshold,
            })
            .from(inventory)
            .innerJoin(productVariants, eq(inventory.variantId, productVariants.id))
            .innerJoin(products, eq(productVariants.productId, products.id))
            .where(and(eq(products.storeId, store.id), eq(products.isActive, true)))
            .limit(20);

        return lowStock
            .filter((r) => r.quantity <= (r.lowStockThreshold ?? 10))
            .map((r) => ({
                productId: r.productId,
                productName: r.productName,
                reason: `Only ${r.quantity} left (threshold ${r.lowStockThreshold ?? 10})`,
            }));
    }
}

export const reorderService = new ReorderService();
