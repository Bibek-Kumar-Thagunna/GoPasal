import { db } from "@/db";
import { inventory } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NotFoundError } from "@/utils/errors";

export class InventoryService {
    async checkStock(variantId: string, quantity: number) {
        const item = await db.query.inventory.findFirst({
            where: eq(inventory.variantId, variantId),
        });

        if (!item) throw new NotFoundError("Inventory item");

        return {
            available: item.quantity >= quantity,
            currentStock: item.quantity
        };
    }

    async reserveStock(variantId: string, quantity: number) {
        // Simple DB decrement for now. Flash Sale uses Redis.
        await db.update(inventory)
            .set({ quantity: sql`${inventory.quantity} - ${quantity}` })
            .where(eq(inventory.variantId, variantId));
    }

    async releaseStock(variantId: string, quantity: number) {
        await db.update(inventory)
            .set({ quantity: sql`${inventory.quantity} + ${quantity}` })
            .where(eq(inventory.variantId, variantId));
    }

    async getStock(variantId: string) {
        const item = await db.query.inventory.findFirst({
            where: eq(inventory.variantId, variantId)
        });
        return item?.quantity || 0;
    }
}

export const inventoryService = new InventoryService();
