import { db } from "@/db";
import {  hotItemConfig } from "@/db/schema/flash_sale";
import { inventory } from "@/db/schema/catalog"; // For reconciliation
import { eq, and } from "drizzle-orm";
import { generateId } from "@/utils";
import { AppError } from "@/utils/errors";
import { redis } from "@/lib/redis";

export class FlashSaleService {

    /**
     * Tries to reserve stock for a hot item using sharded counters.
     * @returns reservationId or throws Error if OOS
     */
    async reserveStock(variantId: string, quantity: number, userId: string): Promise<string> {
        void userId;
        // 1. Check if Hot Item
        const config = await db.query.hotItemConfig.findFirst({
            where: and(eq(hotItemConfig.variantId, variantId), eq(hotItemConfig.status, "ACTIVE"))
        });

        if (!config) {
            // Not a flash sale item, return null to let standard DB flow handle it
            // Or throw specific error code to signal "Use Standard Flow"
            return "USE_STANDARD_FLOW";
        }

        // 2. Sharding Logic
        const shardCount = config.shardCount || 16;
        // Deterministic or Random? Random is better for avoiding hot keys if user base is huge.
        // But for "User X always hits Shard Y" (Session affinity), deterministic is okay. 
        // Random is safer for true distribution.

        let reserved = 0;
        const reservationId = `res_${generateId()}`;

        // We need to fulfill `quantity`. Usually 1.
        for (let q = 0; q < quantity; q++) {
            let success = false;
            // Try up to 3 random shards
            for (let attempt = 0; attempt < 3; attempt++) {
                const shardIndex = Math.floor(Math.random() * shardCount);
                const key = `stock:${config.eventId}:${variantId}:${shardIndex}`;

                const result = await redis.decr(key);

                if (result >= 0) {
                    success = true;
                    break;
                } else {
                    // Rollback this decrement
                    await redis.incr(key);
                }
            }

            if (success) {
                reserved++;
            } else {
                // Failed to get unit. Rollback previous units if any?
                // Complex for multi-qty. For Flash Sale, mostly Qty=1 limit.
                // If Qty > 1 and we got partial, we must rollback partial.
                if (reserved > 0) {
                    await this.releaseStock(variantId, reserved, config);
                }
                throw new AppError("Sold Out", 409);
            }
        }

        // If success
        return reservationId;
    }

    async releaseStock(variantId: string, quantity: number, config?: any) {
        if (!config) {
            config = await db.query.hotItemConfig.findFirst({
                where: eq(hotItemConfig.variantId, variantId)
            });
        }
        if (!config) return;

        const shardCount = config.shardCount || 16;
        // Distribute rollback randomly or round-robin
        for (let q = 0; q < quantity; q++) {
            const shardIndex = Math.floor(Math.random() * shardCount);
            const key = `stock:${config.eventId}:${variantId}:${shardIndex}`;
            await redis.incr(key);
        }
    }

    /**
     * Initialize Stock in Redis from DB
     * Called when Flash Sale Activated
     */
    async initializeStock(eventId: string, variantId: string, totalStock: number, shardCount = 16) {
        const stockPerShard = Math.floor(totalStock / shardCount);
        let remainder = totalStock % shardCount;

        for (let i = 0; i < shardCount; i++) {
            let val = stockPerShard;
            if (remainder > 0) {
                val++;
                remainder--;
            }
            const key = `stock:${eventId}:${variantId}:${i}`;
            await redis.set(key, val);
        }

        // Mark Config Active
        await db.update(hotItemConfig).set({ status: "ACTIVE" }).where(and(eq(hotItemConfig.eventId, eventId), eq(hotItemConfig.variantId, variantId)));
    }

    /**
     * Virtual Waiting Room Admission Check
     * @returns token if queued, null if allowed immediately (or throws)
     */
    async checkAdmission(eventId: string, userId: string): Promise<{ allowed: boolean; token?: string; estimatedWait?: number }> {
        void userId;
        // Simplified Logic:
        // 1. Get current RPS
        // 2. If > Threshold, return Wait Token

        const key = `fs:rps:${eventId}:${Math.floor(Date.now() / 1000)}`;
        const currentRps = await redis.incr(key);

        // Config lookup (Cached in memory in real app)
        // const event = ...
        const maxRps = 100; // Mock

        if (currentRps > maxRps) {
            // Queue User
            // Return Token
            return { allowed: false, token: "wait_token_123", estimatedWait: 30 };
        }

        return { allowed: true };
    }

    /**
     * Reconcile Redis -> DB
     * Batch job
     */
    async reconcileInventory() {
        // Logic:
        // 1. Scan active hot items.
        // 2. Sum stock from Redis.
        // 3. Update DB inventory = Redis Sum.
        // 4. Update reservedStock in config.

        // Fetch active configs
        const activeConfigs = await db.query.hotItemConfig.findMany({
            where: eq(hotItemConfig.status, "ACTIVE")
        });

        const results = [];

        for (const config of activeConfigs) {
            let totalRedisStock = 0;
            const shardCount = config.shardCount || 16;

            for (let i = 0; i < shardCount; i++) {
                const key = `stock:${config.eventId}:${config.variantId}:${i}`;
                const val = await redis.get(key);
                totalRedisStock += Number(val || 0);
            }

            // Update Inventory (Source of Truth for "Available to Promise" if we switched back)
            // But actually, for Flash Sale, DB inventory should reflect "Remaining".
            // We should trust Redis.

            await db.update(inventory)
                .set({ quantity: totalRedisStock, updatedAt: new Date() })
                .where(eq(inventory.variantId, config.variantId));

            // Also update config metadata if needed
            results.push({ variantId: config.variantId, stock: totalRedisStock });
        }

        return results;
    }
}
