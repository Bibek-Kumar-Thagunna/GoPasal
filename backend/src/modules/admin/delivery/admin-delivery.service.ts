import { db } from "@/db";
import {
    riders,
    deliveryTasks,
    users,
    orders,
    stores,
} from "@/db/schema";
import { and, desc, eq, SQL } from "drizzle-orm";

export class AdminDeliveryService {
    async listRiders(limit = 200) {
        const cap = Math.min(500, Math.max(1, limit));
        return db
            .select({
                id: riders.id,
                userId: riders.userId,
                status: riders.status,
                vehicleType: riders.vehicleType,
                licensePlate: riders.licensePlate,
                isVerified: riders.isVerified,
                walletBalance: riders.walletBalance,
                tier: riders.tier,
                phone: users.phone,
                name: users.name,
                updatedAt: riders.updatedAt,
            })
            .from(riders)
            .innerJoin(users, eq(riders.userId, users.id))
            .orderBy(desc(riders.updatedAt))
            .limit(cap);
    }

    /**
     * Recent delivery_tasks with order + customer + storefront context for the admin desk.
     * Optional filter by delivery task lifecycle status (PENDING, ASSIGNED, …).
     */
    async listRecentTasks(limit = 50, taskStatus?: string) {
        const cap = Math.min(200, Math.max(1, limit));
        const filters: SQL[] = [];
        if (taskStatus && taskStatus.trim().length > 0) {
            filters.push(eq(deliveryTasks.status, taskStatus.trim() as (typeof deliveryTasks.$inferSelect)["status"]));
        }
        const whereClause = filters.length ? and(...filters) : undefined;

        const base = db
            .select({
                taskId: deliveryTasks.id,
                orderId: deliveryTasks.orderId,
                riderId: deliveryTasks.riderId,
                taskStatus: deliveryTasks.status,
                codCollected: deliveryTasks.codCollected,
                codAmount: deliveryTasks.codAmount,
                failureReason: deliveryTasks.failureReason,
                taskCreatedAt: deliveryTasks.createdAt,
                pickedUpAt: deliveryTasks.pickedUpAt,
                deliveredAt: deliveryTasks.deliveredAt,
                orderStatus: orders.status,
                paymentMethod: orders.paymentMethod,
                customerPhone: users.phone,
                customerName: users.name,
                storeName: stores.name,
            })
            .from(deliveryTasks)
            .innerJoin(orders, eq(deliveryTasks.orderId, orders.id))
            .innerJoin(users, eq(orders.userId, users.id))
            .innerJoin(stores, eq(orders.storeId, stores.id))
            .orderBy(desc(deliveryTasks.createdAt))
            .limit(cap);

        return whereClause ? await base.where(whereClause) : await base;
    }

    async assignRiderToTask(taskId: string, riderId: string) {
        const [task] = await db
            .select()
            .from(deliveryTasks)
            .where(eq(deliveryTasks.id, taskId))
            .limit(1);
        if (!task) throw new Error("Delivery task not found");

        const [rider] = await db
            .select()
            .from(riders)
            .where(eq(riders.id, riderId))
            .limit(1);
        if (!rider) throw new Error("Rider not found");

        await db
            .update(deliveryTasks)
            .set({
                riderId,
                status: "ASSIGNED",
                updatedAt: new Date(),
            })
            .where(eq(deliveryTasks.id, taskId));

        return { taskId, riderId, status: "ASSIGNED" as const };
    }
}

export const adminDeliveryService = new AdminDeliveryService();
