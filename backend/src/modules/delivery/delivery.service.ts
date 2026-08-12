import { db, type DbTransaction } from "@/db";
import { riders, deliveryTasks, orders, addresses, stores, orderStatusHistory, orderItems, users } from "@/db/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { generateId } from "@/utils";
import { NotFoundError, ConflictError, ValidationError } from "@/utils/errors";
import { createAuditLog } from "@/shared";
import { haversineDistanceKm } from "@/utils/geo";
import { DeliveryStateMachine, DeliveryTaskStatus } from "./delivery.state-machine";
import { UserRole } from "@/types";
import { walletService } from "@/modules/logistics/wallet.service";
import { invoiceService } from "@/modules/invoice/invoice.service";
import { escrowService } from "@/modules/payment/escrow.service";
import { recordCodCollection } from "@/modules/payment/cod-recording.service";

export class DeliveryService {
    async onboardRider(userId: string, data: { vehicleType: string; licensePlate: string }) {
        const [existing] = await db.select().from(riders).where(eq(riders.userId, userId));
        if (existing) throw new ConflictError("User is already a rider");

        const id = generateId();
        const [rider] = await db
            .insert(riders)
            .values({
                id,
                userId,
                vehicleType: data.vehicleType,
                licensePlate: data.licensePlate,
                status: "OFFLINE",
                isVerified: true, // Auto-verify for MVP
                isEV: ["EV_BIKE", "EV_SCOOTER"].includes(data.vehicleType),
            })
            .returning();

        return rider;
    }

    async getRiderProfile(userId: string) {
        const [rider] = await db.select().from(riders).where(eq(riders.userId, userId));
        return rider || null;
    }

    async updateStatus(userId: string, status: "ONLINE" | "OFFLINE" | "BUSY", lat?: number, lon?: number) {
        const [rider] = await db.select().from(riders).where(eq(riders.userId, userId));
        if (!rider) throw new NotFoundError("Rider profile not found");

        const updateData: any = { status, updatedAt: new Date() };
        if (lat !== undefined && lon !== undefined) {
            updateData.currentLat = lat;
            updateData.currentLon = lon;
            updateData.lastLocationUpdate = new Date();
        }

        const [updated] = await db
            .update(riders)
            .set(updateData)
            .where(eq(riders.id, rider.id))
            .returning();

        return updated;
    }

    // --- Task Management ---

    async createTaskForOrder(orderId: string, tx: any = db) {
        // Called by Order Service/Controller usually
        const id = generateId();
        await tx.insert(deliveryTasks).values({
            id,
            orderId,
            status: "PENDING",
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return id;
    }

    async findAvailableTasks(userId: string, lat?: number, lon?: number, radiusKm = 10) {
        const [rider] = await db.select().from(riders).where(eq(riders.userId, userId));
        if (!rider) throw new NotFoundError("Rider not found");
        if (rider.status !== "ONLINE") return []; // Must be online

        // Simple approach: Get PENDING tasks, filter by distance in JS if needed, or just return all for MVP.
        // For accurate distance, we need Pickup Location (Store Lat/Lon).

        // Join Tasks -> Orders -> Stores
        const rawTasks = await db
            .select({
                taskId: deliveryTasks.id,
                orderId: orders.id,
                storeName: stores.name,
                storeAddress: stores.address,
                storeLat: stores.latitude,
                storeLon: stores.longitude,
                deliveryAddress: addresses.addressLine,
                totalAmount: orders.totalAmount,
                codAmount: deliveryTasks.codAmount,
                createdAt: deliveryTasks.createdAt,
                isGreenDelivery: orders.isGreenDelivery,
                // We could calculate distance here if we had pickup/delivery coords easily available
                // For MVP, assuming "Long Distance" implies some external logic or we just stick to explicit Green Opt-in for now
                // to avoid complex geo-calc queries without PostGIS enabled/configured fully in this query context.
            })
            .from(deliveryTasks)
            .innerJoin(orders, eq(deliveryTasks.orderId, orders.id))
            .innerJoin(stores, eq(orders.storeId, stores.id))
            .leftJoin(addresses, eq(orders.deliveryAddressId, addresses.id))
            .where(eq(deliveryTasks.status, "PENDING"))
            .orderBy(desc(deliveryTasks.createdAt));

        // Visibility Filtering (Green Window)
        const now = Date.now();
        const GREEN_WINDOW_MS = 15 * 60 * 1000; // 15 mins for Opt-in

        const withDistance = rawTasks.map((task) => ({
            ...task,
            distanceKm:
                lat != null && lon != null && Number.isFinite(lat) && Number.isFinite(lon) &&
                task.storeLat != null && task.storeLon != null
                    ? haversineDistanceKm(lat, lon, task.storeLat, task.storeLon)
                    : null,
        }));

        return withDistance
            .filter((task) => {
                if (task.distanceKm != null && task.distanceKm > radiusKm) {
                    return false; // Too far from the rider
                }
                return true;
            })
            .filter(task => {
            const ageMs = now - new Date(task.createdAt!).getTime();

            // 1. Green Opt-in Exclusivity
            if (task.isGreenDelivery) {
                if (ageMs < GREEN_WINDOW_MS) {
                    // Only visible to Verified EV
                    if (!rider.isEV || !rider.isVerified) return false;
                }
            }

            // 2. Long Distance Exclusivity (Placeholder logic)
            // if (task.distance > 5 && ageMs < LONG_DISTANCE_WINDOW_MS) { ... }

            return true;
        });
    }

    async getAssignedTasks(userId: string) {
        const [rider] = await db.select().from(riders).where(eq(riders.userId, userId));
        if (!rider) throw new NotFoundError("Rider not found");

        return await db
            .select({
                taskId: deliveryTasks.id,
                status: deliveryTasks.status,
                orderId: orders.id,
                storeName: stores.name,
                storeAddress: stores.address,
                deliveryAddress: addresses.addressLine, // Join address in real app
                codAmount: deliveryTasks.codAmount,
                codCollected: deliveryTasks.codCollected,
                createdAt: deliveryTasks.createdAt
            })
            .from(deliveryTasks)
            .innerJoin(orders, eq(deliveryTasks.orderId, orders.id))
            .innerJoin(stores, eq(orders.storeId, stores.id))
            .leftJoin(addresses, eq(orders.deliveryAddressId, addresses.id)) // Address is optional for pickup orders
            .where(eq(deliveryTasks.riderId, rider.id))
            .orderBy(desc(deliveryTasks.updatedAt));
    }

    async getTaskHistory(userId: string, limit = 50) {
        const [rider] = await db.select().from(riders).where(eq(riders.userId, userId));
        if (!rider) throw new NotFoundError("Rider not found");

        return db
            .select({
                taskId: deliveryTasks.id,
                status: deliveryTasks.status,
                orderId: orders.id,
                storeName: stores.name,
                deliveryAddress: addresses.addressLine,
                codAmount: deliveryTasks.codAmount,
                codCollected: deliveryTasks.codCollected,
                createdAt: deliveryTasks.createdAt,
                deliveredAt: deliveryTasks.deliveredAt,
            })
            .from(deliveryTasks)
            .innerJoin(orders, eq(deliveryTasks.orderId, orders.id))
            .innerJoin(stores, eq(orders.storeId, stores.id))
            .leftJoin(addresses, eq(orders.deliveryAddressId, addresses.id))
            .where(
                and(
                    eq(deliveryTasks.riderId, rider.id),
                    inArray(deliveryTasks.status, ["DELIVERED", "FAILED", "CANCELLED", "RETURNED_TO_SELLER"])
                )
            )
            .orderBy(desc(deliveryTasks.updatedAt))
            .limit(Math.min(Math.max(limit, 1), 200));
    }

    async getTaskDetail(userId: string, taskId: string) {
        const [rider] = await db.select().from(riders).where(eq(riders.userId, userId));
        if (!rider) throw new NotFoundError("Rider not found");

        const [task] = await db
            .select({
                taskId: deliveryTasks.id,
                status: deliveryTasks.status,
                orderId: orders.id,
                orderStatus: orders.status,
                storeId: stores.id,
                storeName: stores.name,
                storeAddress: stores.address,
                deliveryAddress: addresses.addressLine,
                deliveryCity: addresses.city,
                customerName: users.name,
                customerPhone: users.phone,
                totalAmount: orders.totalAmount,
                codAmount: deliveryTasks.codAmount,
                codCollected: deliveryTasks.codCollected,
                isGreenDelivery: orders.isGreenDelivery,
                createdAt: deliveryTasks.createdAt,
                updatedAt: deliveryTasks.updatedAt,
            })
            .from(deliveryTasks)
            .innerJoin(orders, eq(deliveryTasks.orderId, orders.id))
            .innerJoin(stores, eq(orders.storeId, stores.id))
            .innerJoin(users, eq(orders.userId, users.id))
            .leftJoin(addresses, eq(orders.deliveryAddressId, addresses.id))
            .where(eq(deliveryTasks.id, taskId))
            .limit(1);

        if (!task) throw new NotFoundError("Task not found");

        // A rider may view a PENDING task (to decide whether to accept) or their own assigned task.
        if (task.status !== "PENDING") {
            const [mine] = await db
                .select()
                .from(deliveryTasks)
                .where(
                    and(eq(deliveryTasks.id, taskId), eq(deliveryTasks.riderId, rider.id))
                );
            if (!mine) throw new NotFoundError("Task not found");
        }

        const items = await db
            .select({
                name: orderItems.productName,
                quantity: orderItems.quantity,
            })
            .from(orderItems)
            .where(eq(orderItems.orderId, task.orderId));

        return { ...task, items };
    }

    /**
     * Live rider location for a customer's order (platform-logistics or
     * merchant-delivered orders with an assigned rider).
     */
    async getOrderRiderLocation(orderId: string) {
        const [task] = await db
            .select({
                status: deliveryTasks.status,
                riderId: deliveryTasks.riderId,
                orderId: orders.id,
            })
            .from(deliveryTasks)
            .innerJoin(orders, eq(deliveryTasks.orderId, orders.id))
            .where(eq(deliveryTasks.orderId, orderId))
            .limit(1);
        if (!task || !task.riderId) {
            return { available: false };
        }

        const [rider] = await db
            .select({
                currentLat: riders.currentLat,
                currentLon: riders.currentLon,
                lastLocationUpdate: riders.lastLocationUpdate,
            })
            .from(riders)
            .where(eq(riders.id, task.riderId))
            .limit(1);
        if (!rider) return { available: false };

        return {
            available: true,
            taskStatus: task.status,
            lat: rider.currentLat,
            lon: rider.currentLon,
            lastUpdate: rider.lastLocationUpdate?.toISOString() ?? null,
        };
    }

    async acceptTask(userId: string, taskId: string) {
        const [rider] = await db.select().from(riders).where(eq(riders.userId, userId));
        if (!rider) throw new NotFoundError("Rider not found");

        // Transaction to prevent race conditions
        return await db.transaction(async (tx: DbTransaction) => {
            const [task] = await tx
                .select()
                .from(deliveryTasks)
                .where(eq(deliveryTasks.id, taskId));

            if (!task) throw new NotFoundError("Task not found");

            // --- LOGISTICS: WALLET CHECK ---
            if (task.codAmount && Number(task.codAmount) > 0) {
                const canAccept = await walletService.checkLimit(rider.id, Number(task.codAmount));
                if (!canAccept) {
                    throw new ValidationError("Wallet Limit Exceeded. Please deposit cash to accept more COD orders.");
                }
            }

            // State Machine Validation for PENDING -> ASSIGNED
            DeliveryStateMachine.validateTransition(
                task.status as DeliveryTaskStatus,
                "ASSIGNED",
                ["RIDER"]
            );

            // Assign
            const [updatedTask] = await tx
                .update(deliveryTasks)
                .set({
                    riderId: rider.id,
                    status: "ASSIGNED",
                    updatedAt: new Date()
                })
                .where(eq(deliveryTasks.id, taskId))
                .returning();

            // Mark Rider BUSY
            await tx
                .update(riders)
                .set({ status: "BUSY", updatedAt: new Date() })
                .where(eq(riders.id, rider.id));

            await createAuditLog({
                actorId: userId,
                action: "ACCEPT_TASK",
                resource: "delivery_tasks",
                resourceId: taskId
            }, tx);

            return updatedTask;
        });
    }

    async updateTaskStatus(
        userId: string,
        taskId: string,
        status: DeliveryTaskStatus,
        userRoles: UserRole[] = ["RIDER"],
        meta?: {
            podImageUrl?: string;
            podNotes?: string;
            codCollected?: boolean;
            codAmount?: number;
        }
    ) {
        // 1. Get Task & Rider
        const [task] = await db
            .select()
            .from(deliveryTasks)
            .where(eq(deliveryTasks.id, taskId));

        if (!task) throw new NotFoundError("Task not found");

        // RBAC: Riders are identified by their riders row (the JWT may only carry CUSTOMER roles).
        const [rider] = await db.select().from(riders).where(eq(riders.userId, userId));
        const effectiveRoles: UserRole[] = rider
            ? ["RIDER", ...userRoles.filter((r) => r === "ADMIN" || r === "SUPER_ADMIN")]
            : userRoles;

        // If Rider, must be assigned to this task
        if (rider && !userRoles.includes("ADMIN") && !userRoles.includes("SUPER_ADMIN")) {
            if (task.riderId !== rider.id) {
                throw new NotFoundError("Task not found or not assigned to you");
            }
        }

        // 2. State Machine Validation
        DeliveryStateMachine.validateTransition(
            task.status as DeliveryTaskStatus,
            status,
            effectiveRoles
        );

        // 3. Update Transaction
        return await db.transaction(async (tx: DbTransaction) => {
            const updateData: any = { status, updatedAt: new Date() };

            // A. COD Enforcement
            if (status === "DELIVERED") {
                const [order] = await tx.select().from(orders).where(eq(orders.id, task.orderId));

                if (order && order.paymentMethod === "COD") {
                    if (!meta?.codCollected) {
                        throw new ValidationError("COD payment must be collected to mark delivered");
                    }

                    updateData.codCollected = true;
                    updateData.codAmount = order.totalAmount;
                    updateData.codCollectedAt = new Date();

                    if (task.riderId) {
                        await recordCodCollection(
                            {
                                deliveryTaskId: taskId,
                                orderId: task.orderId,
                                riderId: task.riderId,
                                expectedAmount: Number(order.totalAmount),
                                collectedAmount: Number(
                                    meta?.codAmount ?? order.totalAmount
                                ),
                            },
                            tx
                        );
                    }

                    await tx.update(riders)
                        .set({
                            codCashInHand: sql`${riders.codCashInHand} + ${order.totalAmount}`,
                            updatedAt: new Date()
                        })
                        .where(eq(riders.id, task.riderId!));
                }

                updateData.podImageUrl = meta?.podImageUrl || null;
                updateData.podNotes = meta?.podNotes || "Delivered successfully";
                updateData.deliveredAt = new Date();
            } else if (status === "PICKED_UP") {
                updateData.pickedUpAt = new Date();
            }

            // B. Update Task
            await tx
                .update(deliveryTasks)
                .set(updateData)
                .where(eq(deliveryTasks.id, taskId));

            // C. Rider Availability
            if (["DELIVERED", "FAILED", "CANCELLED", "RETURNED_TO_SELLER"].includes(status)) {
                if (task.riderId) { // Only if rider was assigned
                    await tx
                        .update(riders)
                        .set({ status: "ONLINE", updatedAt: new Date() })
                        .where(eq(riders.id, task.riderId));
                }
            }

            // D. Sync Order Status
            const orderStatusMap: Record<string, string> = {
                PICKED_UP: "OUT_FOR_DELIVERY",
                DELIVERED: "DELIVERED",
                FAILED: "ACCEPTED", // Policy: Revert to ACCEPTED to find new rider
                RETURN_INITIATED: "RETURN_INITIATED",
                RETURNED_TO_SELLER: "RETURNED",
            };

            const orderStatus = orderStatusMap[status];
            if (orderStatus) {
                await tx.update(orders).set({ status: orderStatus as any }).where(eq(orders.id, task.orderId));

                await tx.insert(orderStatusHistory).values({
                    id: generateId(),
                    orderId: task.orderId,
                    status: orderStatus as any,
                    notes: `Updated by Logistics (${status})`
                });

                // --- VAT INVOICE: ISSUE ON DELIVERY ---
                if (status === "DELIVERED") {
                    // Note: invoiceService is fire-and-forget here to allow transaction to complete
                    invoiceService.issueInvoice(task.orderId).catch((err: any) => {
                        console.error(`[Invoice Issue Failed] Order ${task.orderId}:`, err);
                    });
                }
            }

            if (status === "DELIVERED") {
                const [oSettle] = await tx.select().from(orders).where(eq(orders.id, task.orderId)).limit(1);
                await escrowService.settleAfterDelivery(
                    task.orderId,
                    {
                        codCollected:
                            oSettle?.paymentMethod === "COD" ? meta?.codCollected === true : undefined,
                    },
                    tx
                );
            }

            await createAuditLog({
                actorId: userId,
                action: "UPDATE_DELIVERY_STATUS",
                resource: "delivery_tasks",
                resourceId: taskId,
                metadata: { from: task.status, to: status, meta }
            }, tx);
        });
    }
}

export const deliveryService = new DeliveryService();
