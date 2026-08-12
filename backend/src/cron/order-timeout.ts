import { Cron } from "croner";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, and, lt } from "drizzle-orm";
import { logger } from "@/shared/logger";
import { orderService } from "@/modules/order/order.service";

/**
 * Runs every minute to auto-cancel orders that are stuck in PLACED state
 * for more than 5 minutes.
 */
export const orderTimeoutJob = new Cron("* * * * *", async () => {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        // Find orders in PLACED status older than 5 minutes
        const stuckOrders = await db
            .select({ id: orders.id, userId: orders.userId })
            .from(orders)
            .where(
                and(
                    eq(orders.status, "PLACED"),
                    lt(orders.createdAt, fiveMinutesAgo)
                )
            );

        if (stuckOrders.length === 0) return;

        logger.info({ count: stuckOrders.length }, "Found unaccepted orders to auto-cancel");

        for (const order of stuckOrders) {
            try {
                // Cancel the order.
                // The orderService.cancelOrder will handle escrow reversal and notification
                // because it invokes the transition logic. Wait, let's check what it expects.
                // We will use updateStatus directly or a dedicated cancel method if we want.
                // Actually, let's use the standard updateStatus.
                // BUT we need the user role. Let's use SYSTEM.
                
                await orderService.updateStatus(
                    "SYSTEM", // SYSTEM actor
                    order.id,
                    "CANCELLED",
                    ["SYSTEM"], // Roles
                    "Auto-cancelled: Shop did not accept within 5 minutes"
                );
                logger.info({ orderId: order.id }, "Successfully auto-cancelled order");
            } catch (err) {
                logger.error({ orderId: order.id, err: String(err) }, "Failed to auto-cancel order");
            }
        }
    } catch (err) {
        logger.error({ err: String(err) }, "Error in orderTimeoutJob");
    }
});
