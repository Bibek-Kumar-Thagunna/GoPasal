import { db } from "@/db";
import { orders, orderItems, orderStatusHistory, inventory } from "@/db/schema";
import { generateId } from "@/utils";
import { eq, and, desc, inArray, count } from "drizzle-orm";
import { NotFoundError, ConflictError, ValidationError, ForbiddenError } from "@/utils";
import { createAuditLog } from "@/shared";
import { posService } from "@/modules/pos/pos.service";
import { logger } from "@/utils/logger";
import { isSellerTransitionAllowed, isIdempotentStatusUpdate, type OrderRowStatus } from "./order.workflow";
import { staffMayApplyOrderStatus } from "./order.staff-status-policy";
import { sellerPermissionService } from "@/modules/seller/permissions/seller-permission.service";
import { escrowService } from "@/modules/payment/escrow.service";
import { recordCodCollection } from "@/modules/payment/cod-recording.service";
import { deliveryTasks } from "@/db/schema";

export type OrderStatusGroup =
    | "ALL"
    | "PENDING"
    | "ACCEPTED"
    | "PREPARING"
    | "PACKED"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED";

const GROUP_STATUSES: Record<OrderStatusGroup, OrderRowStatus[] | null> = {
    ALL: null,
    PENDING: ["PLACED", "PENDING_PAYMENT"],
    ACCEPTED: ["ACCEPTED"],
    PREPARING: ["CONFIRMED"],
    PACKED: ["PACKED"],
    OUT_FOR_DELIVERY: ["SHIPPED", "OUT_FOR_DELIVERY"],
    DELIVERED: ["DELIVERED"],
    CANCELLED: ["CANCELLED"],
};

export class SellerOrderService {
    private groupWhereClause(group: OrderStatusGroup) {
        const statuses = GROUP_STATUSES[group];
        if (!statuses) return undefined;
        return inArray(orders.status, statuses);
    }

    async getOrderTabCounts(storeId: string) {
        const rows = await db
            .select({
                status: orders.status,
                c: count(),
            })
            .from(orders)
            .where(eq(orders.storeId, storeId))
            .groupBy(orders.status);

        const byDbStatus = Object.fromEntries(rows.map((r) => [r.status, Number(r.c)])) as Record<
            string,
            number
        >;

        const sum = (keys: string[]) =>
            keys.reduce((acc, k) => acc + (byDbStatus[k] ?? 0), 0);

        const all = rows.reduce((acc, r) => acc + Number(r.c), 0);

        return {
            all,
            pending: sum(["PLACED", "PENDING_PAYMENT"]),
            accepted: sum(["ACCEPTED"]),
            preparing: sum(["CONFIRMED"]),
            packed: sum(["PACKED"]),
            outForDelivery: sum(["SHIPPED", "OUT_FOR_DELIVERY"]),
            delivered: sum(["DELIVERED"]),
            cancelled: sum(["CANCELLED"]),
        };
    }

    async listStoreOrders(
        storeId: string,
        opts: { page?: number; limit?: number; group?: OrderStatusGroup }
    ) {
        const page = opts.page ?? 1;
        const limit = opts.limit ?? 20;
        const group = opts.group ?? "ALL";

        const groupCond = this.groupWhereClause(group);
        const whereClause = groupCond ? and(eq(orders.storeId, storeId), groupCond) : eq(orders.storeId, storeId);

        const [totalRow] = await db.select({ c: count() }).from(orders).where(whereClause);

        const total = Number(totalRow?.c ?? 0);

        const list = await db.query.orders.findMany({
            where: whereClause,
            limit,
            offset: (page - 1) * limit,
            with: {
                items: {
                    with: {
                        variant: true,
                    },
                },
                user: true,
                deliveryAddress: true,
            },
            orderBy: desc(orders.createdAt),
        });

        return { orders: list, total, page, limit };
    }

    async getStoreOrder(storeId: string, orderId: string) {
        const order = await db.query.orders.findFirst({
            where: and(eq(orders.id, orderId), eq(orders.storeId, storeId)),
            with: {
                items: {
                    with: {
                        variant: true,
                    },
                },
                user: true,
                deliveryAddress: true,
                history: {
                    orderBy: (history, { desc }) => [desc(history.createdAt)],
                },
            },
        });
        if (!order) throw new NotFoundError("Order not found");
        return order;
    }

    async updateOrderStatus(
        storeId: string,
        orderId: string,
        status: OrderRowStatus,
        userId: string,
        ctx?: { requestId?: string; codCollected?: boolean }
    ) {
        const [order] = await db
            .select()
            .from(orders)
            .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)));

        if (!order) throw new NotFoundError("Order not found");

        if (isIdempotentStatusUpdate(order.status, status)) {
            logger.info("seller.order.status.idempotent", {
                requestId: ctx?.requestId,
                tenantId: storeId,
                actorId: userId,
                orderId,
                status,
            });
            return order;
        }

        if (!isSellerTransitionAllowed(order.status, status, order.fulfillmentType)) {
            logger.warn("seller.order.status.invalid_transition", {
                requestId: ctx?.requestId,
                tenantId: storeId,
                actorId: userId,
                orderId,
                from: order.status,
                to: status,
            });
            throw new ConflictError(`Cannot transition from ${order.status} to ${status}`);
        }

        const actorCtx = await sellerPermissionService.getMembershipContext(userId, storeId);
        if (!actorCtx.isOwner && actorCtx.staffRoles.length === 0) {
            throw new ForbiddenError("Access denied");
        }
        if (!staffMayApplyOrderStatus(status, actorCtx.staffRoles, actorCtx.isOwner)) {
            throw new ForbiddenError("Access denied");
        }

        if (status === "DELIVERED" && order.paymentMethod === "COD" && !ctx?.codCollected) {
            throw new ValidationError(
                "COD orders require payment confirmation: pass codCollected: true when marking delivered."
            );
        }

        if (status === "CANCELLED" && order.status !== "CANCELLED") {
            const orderItemsList = await db
                .select()
                .from(orderItems)
                .where(eq(orderItems.orderId, orderId));

            for (const item of orderItemsList) {
                const [inv] = await db
                    .select()
                    .from(inventory)
                    .where(eq(inventory.variantId, item.variantId));

                if (inv) {
                    await db
                        .update(inventory)
                        .set({
                            quantity: inv.quantity + item.quantity,
                            updatedAt: new Date(),
                        })
                        .where(eq(inventory.id, inv.id));
                }
            }
        }

        const updated = await db.transaction(async (tx) => {
            const [row] = await tx
                .update(orders)
                .set({ status, updatedAt: new Date() })
                .where(eq(orders.id, orderId))
                .returning();

            await tx.insert(orderStatusHistory).values({
                id: generateId(),
                orderId,
                status,
                notes: `Updated by seller`,
            });

            if (status === "DELIVERED") {
                if (
                    order.paymentMethod === "COD" &&
                    ctx?.codCollected === true
                ) {
                    const [task] = await tx
                        .select()
                        .from(deliveryTasks)
                        .where(eq(deliveryTasks.orderId, orderId))
                        .limit(1);
                    if (task?.riderId) {
                        await recordCodCollection(
                            {
                                deliveryTaskId: task.id,
                                orderId,
                                riderId: task.riderId,
                                expectedAmount: Number(order.totalAmount),
                                collectedAmount: Number(order.totalAmount),
                            },
                            tx
                        );
                    }
                }

                await escrowService.settleAfterDelivery(
                    orderId,
                    {
                        codCollected:
                            order.paymentMethod === "COD"
                                ? ctx?.codCollected === true
                                : undefined,
                    },
                    tx
                );
            }

            return row;
        });

        await createAuditLog({
            actorId: userId,
            action: "UPDATE_STATUS",
            resource: "orders",
            resourceId: orderId,
            beforeState: { status: order.status },
            afterState: { status },
        });

        void import("@/modules/order/order-notifications").then(({ notifyCustomerOrderStatus }) =>
            notifyCustomerOrderStatus(
                order.userId,
                orderId,
                order.status,
                status as import("@/types").OrderStatus
            )
        );

        if (status === "ACCEPTED") {
            logger.info("seller.order.accepted", {
                requestId: ctx?.requestId,
                tenantId: storeId,
                actorId: userId,
                orderId,
            });
            posService.pushOrderToPos(orderId).catch((err) => {
                logger.error("seller.order.pos_push_failed", {
                    requestId: ctx?.requestId,
                    orderId,
                    err: String(err),
                });
            });
        }

        if (status === "PACKED") {
            const { shouldCreatePlatformDeliveryTask } = await import(
                "@/modules/fulfillment/fulfillment"
            );
            if (shouldCreatePlatformDeliveryTask(order.fulfillmentType)) {
                const { deliveryService } = await import(
                    "@/modules/delivery/delivery.service"
                );
                await deliveryService.createTaskForOrder(orderId);
                logger.info("seller.order.platform_task_created", {
                    requestId: ctx?.requestId,
                    tenantId: storeId,
                    actorId: userId,
                    orderId,
                });
            }
        }

        return updated;
    }
}

export const sellerOrderService = new SellerOrderService();
