import { db, type DbTransaction } from "@/db";
import {
    orders,
    orderItems,
    orderStatusHistory,
    carts,
    
    
    inventory,
    stores,
    addresses,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateId } from "@/utils";
import {
    NotFoundError,
    ValidationError,
    ConflictError,
} from "@/utils/errors";
import { createAuditLog } from "@/shared";
import { notificationService } from "@/modules/customer/notification.service";
import { OrderStateMachine } from "./order.state-machine";
import { OrderStatus, UserRole } from "@/types";
import { policyService } from "@/modules/policy/policy.service";
import { couponService } from "@/modules/growth/coupon.service";
import { loyaltyService, referralService } from "@/modules/growth/loyalty.service";
import { normalizeCommissionPercent } from "@/modules/payment/commission.util";
import { escrowService } from "@/modules/payment/escrow.service";
import {
    type CheckoutFulfillmentRequest,
    normalizeStoreDeliveryMode,
    resolveOrderFulfillmentType,
    shouldCreatePlatformDeliveryTask,
    storeRequiresDeliveryRadiusCheck,
    type OrderFulfillmentType,
} from "@/modules/fulfillment/fulfillment";
import { checkDeliveryServiceability } from "@/utils/geo";
import { paymentCollectionStatusForNewOrder } from "@/modules/payment/order-payment.util";
import { presentOrderForCustomer } from "./order.presenter";
import { getPaymentCapabilities } from "@/config/payments";
import { featureFlagService } from "@/modules/admin/feature-flag.service";
import { PLATFORM_DELIVERY_FLAG_KEY } from "@/modules/config/platform-delivery";
import {
    readConfiguredStoreDeliveryFee,
} from "@/utils/store-delivery-charges";
import { redis } from "@/lib/redis";
import { FlashSaleService } from "@/modules/flash_sale/flash-sale.service";
import { subscriptionService } from "@/modules/growth/subscription.service";
import {
    deliveryWaivedForMember,
    parseCustomerPlanBenefits,
} from "@/modules/growth/membership-delivery.util";
import {
    storeMarketingService,
    parseStoreMarketingBenefits,
} from "@/modules/growth/store-marketing.service";
import { billSplitService } from "@/modules/group-order/bill-split.service";

const flashSaleService = new FlashSaleService();
export type CheckoutFulfillmentType = CheckoutFulfillmentRequest;

export type PlaceOrderResult = {
    order: ReturnType<typeof presentOrderForCustomer>;
    requiresOnlinePayment?: boolean;
};

export class OrderService {
    async placeOrder(
        userId: string,
        data: {
            deliveryAddressId?: string | null;
            fulfillmentType?: CheckoutFulfillmentType;
            paymentMethod: "COD" | "ESEWA" | "KHALTI";
            notes?: string;
            isGreenDelivery?: boolean;
            couponCode?: string;
        },
        idempotencyKey?: string
    ): Promise<PlaceOrderResult> {
        const idempotencyKeyResolved = idempotencyKey?.trim();
        const cacheKey = idempotencyKeyResolved
            ? `idempotency:order:${userId}:${idempotencyKeyResolved}`
            : null;

        if (cacheKey) {
            try {
                const cached = await redis.get(cacheKey);
                if (cached) {
                    return JSON.parse(cached) as PlaceOrderResult;
                }
            } catch {}
        }

        // 0. Policy Check (e.g. COD Limits)
        const policyCheck = await policyService.evaluate({
            type: "ORDER",
            data: { paymentMethod: data.paymentMethod },
            actorId: userId,
        });

        if (!policyCheck.allowed) {
            throw new ValidationError(`Policy Violation: ${policyCheck.reason}`);
        }

        const paymentCaps = getPaymentCapabilities();
        if (data.paymentMethod === "KHALTI" && !paymentCaps.khalti) {
            throw new ValidationError(
                "Khalti is not enabled on this server. Use cash on delivery or contact support."
            );
        }
        if (data.paymentMethod === "ESEWA" && !paymentCaps.esewa) {
            throw new ValidationError(
                "eSewa is not enabled on this server. Use cash on delivery or Khalti."
            );
        }

        let redeemCouponMeta: { couponId: string; discount: number } | null = null;

        const placed = await db.transaction(async (tx: DbTransaction) => {
            // 1. Get Cart
            const [cart] = await tx
                .select()
                .from(carts)
                .where(sql`${carts.userId} = ${userId}`);

            if (!cart) {
                throw new ValidationError("Cart is empty");
            }

            // Fetch full object with relations
            const fullCart = await tx.query.carts.findFirst({
                where: eq(carts.id, cart.id),
                with: {
                    items: {
                        with: {
                            variant: {
                                with: {
                                    product: true,
                                    inventory: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!fullCart) throw new ValidationError("Cart not found");

            const [storeDeliveryRow] = await tx
                .select({
                    deliveryType: stores.deliveryType,
                    latitude: stores.latitude,
                    longitude: stores.longitude,
                    deliveryRadius: stores.deliveryRadius,
                    metadata: stores.metadata,
                })
                .from(stores)
                .where(eq(stores.id, fullCart.storeId))
                .limit(1);

            let storeDeliveryMode = normalizeStoreDeliveryMode(storeDeliveryRow?.deliveryType);
            if (storeDeliveryRow?.latitude == null || storeDeliveryRow?.longitude == null) {
                storeDeliveryMode = "PICKUP_ONLY";
            }

            let fulfillmentType: OrderFulfillmentType;
            try {
                fulfillmentType = resolveOrderFulfillmentType(
                    storeDeliveryMode,
                    data.fulfillmentType
                );
            } catch (e) {
                const code = e instanceof Error ? e.message : "";
                if (code === "PICKUP_NOT_AVAILABLE") {
                    throw new ValidationError("This shop does not offer pickup.");
                }
                if (code === "DELIVERY_NOT_AVAILABLE") {
                    throw new ValidationError("This shop is pickup-only.");
                }
                if (code === "PLATFORM_LOGISTICS_NOT_AVAILABLE") {
                    throw new ValidationError(
                        "Platform delivery is not available for this shop yet."
                    );
                }
                throw new ValidationError("Invalid fulfillment option for this shop.");
            }

            const platformDeliveryOn = await featureFlagService.isEnabled(
                PLATFORM_DELIVERY_FLAG_KEY
            );
            if (!platformDeliveryOn && fulfillmentType === "PLATFORM_LOGISTICS") {
                throw new ValidationError(
                    "GoPasal fleet delivery is not available yet. Choose merchant delivery or pickup."
                );
            }

            let deliveryAddressId: string | null = null;

            const needsDeliveryAddress =
                fulfillmentType === "MERCHANT_DELIVERY" ||
                fulfillmentType === "PLATFORM_LOGISTICS";

            if (needsDeliveryAddress) {
                const addrId = data.deliveryAddressId?.trim();
                if (!addrId) {
                    throw new ValidationError("Delivery address is required for delivery orders");
                }
                const [addr] = await tx
                    .select({
                        id: addresses.id,
                        latitude: addresses.latitude,
                        longitude: addresses.longitude,
                    })
                    .from(addresses)
                    .where(and(eq(addresses.id, addrId), eq(addresses.userId, userId)))
                    .limit(1);
                if (!addr) {
                    throw new ValidationError("Invalid delivery address");
                }
                deliveryAddressId = addr.id;

                if (storeRequiresDeliveryRadiusCheck(storeDeliveryMode)) {
                    const serviceability = checkDeliveryServiceability({
                        storeLatitude: storeDeliveryRow?.latitude,
                        storeLongitude: storeDeliveryRow?.longitude,
                        storeDeliveryRadius: storeDeliveryRow?.deliveryRadius,
                        storeDeliveryType: storeDeliveryRow?.deliveryType,
                        customerLatitude: addr.latitude,
                        customerLongitude: addr.longitude,
                        enforceDeliveryRadius: true,
                    });
                    if (!serviceability.ok) {
                        throw new ValidationError(serviceability.message);
                    }
                }

                for (const item of fullCart.items) {
                    if (!item.variant.product.isDeliverable) {
                        throw new ValidationError(
                            `"${item.variant.product.name}" is pickup-only. Switch to store pickup or remove it from your cart.`
                        );
                    }
                }
            }

            // 2. Validate Inventory & Calculate Total
            let totalAmount = 0;
            const orderItemsData: any[] = [];

            for (const item of fullCart.items) {
                // Flash Sale Check
                let reservationId: string | null = null;
                try {
                    const result = await flashSaleService.reserveStock(item.variantId, item.quantity, userId);
                    if (result !== "USE_STANDARD_FLOW") {
                        reservationId = result;
                    }
                } catch (e: any) {
                    if (e.message === "Sold Out") {
                        throw new ConflictError(`Flash Sale Item Sold Out: ${item.variant.product.name}`);
                    }
                }

                if (!reservationId) {
                    // Standard DB Check
                    const stock = item.variant.inventory.quantity;
                    if (stock < item.quantity) {
                        throw new ConflictError(
                            `Insufficient stock for ${item.variant.product.name} (${item.variant.name})`
                        );
                    }
                }

                const price = Number(item.variant.product.basePrice) + Number(item.variant.priceOffset);
                totalAmount += price * item.quantity;

                orderItemsData.push({
                    id: generateId(),
                    variantId: item.variantId,
                    productName: `${item.variant.product.name} - ${item.variant.name}`,
                    quantity: item.quantity,
                    priceAtPurchase: String(price),
                    metadata: reservationId ? { reservationId } : null
                });
            }

            const itemsSubtotal = Math.round(totalAmount * 100) / 100;

            const sub = await subscriptionService.getActiveSubscription(userId);
            const memberBenefits =
                sub?.plan && typeof sub.plan.benefits === "object" && sub.plan.benefits !== null
                    ? parseCustomerPlanBenefits(sub.plan.benefits)
                    : {};

            let isPriority = false;
            let deliveryBase = 0;
            if (fulfillmentType === "MERCHANT_DELIVERY" || fulfillmentType === "PLATFORM_LOGISTICS") {
                const meta = storeDeliveryRow?.metadata as any;
                const configuredFee = meta?.deliveryFee != null && meta?.deliveryFee !== "" ? Number(meta.deliveryFee) : null;
                const freeThreshold = meta?.freeDeliveryThreshold != null && meta?.freeDeliveryThreshold !== "" ? Number(meta.freeDeliveryThreshold) : null;

                if (meta?.freeDelivery === true) {
                    deliveryBase = 0;
                } else if (configuredFee != null) {
                    if (configuredFee === 0) {
                        deliveryBase = 0;
                    } else if (freeThreshold != null && freeThreshold > 0 && itemsSubtotal >= freeThreshold) {
                        deliveryBase = 0;
                    } else {
                        deliveryBase = configuredFee;
                    }
                } else {
                    // Default to FREE if shop has not set a delivery fee
                    deliveryBase = 0;
                }
            }

            let deliveryCharged = deliveryBase;
            let deliveryWaiver: { waived: boolean; reason: string } | null = null;

            if (
                (fulfillmentType === "MERCHANT_DELIVERY" ||
                    fulfillmentType === "PLATFORM_LOGISTICS") &&
                sub &&
                sub.plan.isActive
            ) {
                isPriority = sub.plan.isPriorityDelivery || false;
                const waiver = deliveryWaivedForMember({
                    plan: sub.plan,
                    benefits: memberBenefits,
                    itemsSubtotal,
                });
                deliveryWaiver = waiver;
                if (waiver.waived) {
                    deliveryCharged = 0;
                }
            }

            const [storeRow] = await tx
                .select({ commissionRate: stores.commissionRate })
                .from(stores)
                .where(eq(stores.id, fullCart.storeId))
                .limit(1);

            const storeMktCtx = await storeMarketingService.getActiveForStore(fullCart.storeId, tx);

            const sellerBenefits =
                storeMktCtx?.plan?.benefits != null
                    ? parseStoreMarketingBenefits(storeMktCtx.plan.benefits)
                    : {};
            const bpsOff = sellerBenefits.commissionDiscountBps ?? 0;
            const commissionBeforeTier = normalizeCommissionPercent(storeRow?.commissionRate);
            const commissionRateSnapshot = normalizeCommissionPercent(
                Math.max(0, commissionBeforeTier - bpsOff / 100)
            );

            let couponDiscount = 0;
            if (data.couponCode?.trim()) {
                const validation = await couponService.validateCoupon(
                    data.couponCode.trim().toUpperCase(),
                    fullCart.storeId,
                    userId,
                    itemsSubtotal
                );
                couponDiscount = validation.discountAmount;
                redeemCouponMeta = {
                    couponId: validation.couponId,
                    discount: validation.discountAmount,
                };
            }

            const platformFee = 10;

            const payableTotal = Math.max(
                0,
                Math.round((itemsSubtotal + deliveryCharged + platformFee - couponDiscount) * 100) / 100
            );

            const pricingSnapshot = {
                version: 1 as const,
                itemsSubtotal,
                couponCode: data.couponCode?.trim().toUpperCase() || undefined,
                couponDiscount,
                storeDeliveryMode,
                fulfillmentType,
                deliveryFeeBase: deliveryBase,
                deliveryFeeCharged: deliveryCharged,
                platformFee,
                deliveryWaiver,
                membership:
                    sub && sub.plan.isActive
                        ? {
                              planId: sub.plan.id,
                              planSlug: sub.plan.slug,
                              planName: sub.plan.name,
                          }
                        : undefined,
                shopTier: storeMktCtx?.plan
                    ? {
                          planId: storeMktCtx.plan.id,
                          slug: storeMktCtx.plan.slug,
                          commissionDiscountBpsApplied: bpsOff,
                      }
                    : undefined,
                merchantDeliveryFlatConfigured:
                    readConfiguredStoreDeliveryFee(storeDeliveryRow?.metadata) ?? 0,
                commissionPercentBeforeTier: commissionBeforeTier,
                commissionRateSnapshot,
                payableTotal,
            };

            const orderId = generateId();

            const paymentCollectionStatus = paymentCollectionStatusForNewOrder(
                data.paymentMethod
            );

            const [order] = await tx
                .insert(orders)
                .values({
                    id: orderId,
                    userId,
                    storeId: fullCart.storeId,
                    status: "PLACED",
                    paymentStatus: "PENDING",
                    paymentCollectionStatus,
                    totalAmount: String(payableTotal),
                    fulfillmentType,
                    commissionRateSnapshot,
                    deliveryAddressId,
                    paymentMethod: data.paymentMethod,
                    isPriorityDelivery:
                        fulfillmentType === "MERCHANT_DELIVERY" ||
                        fulfillmentType === "PLATFORM_LOGISTICS"
                            ? isPriority
                            : false,
                    isGreenDelivery:
                        fulfillmentType === "MERCHANT_DELIVERY" ||
                        fulfillmentType === "PLATFORM_LOGISTICS"
                            ? data.isGreenDelivery || false
                            : false,
                    notes: data.notes,
                    pricingSnapshot,
                })
                .returning();

            // 4. Create Order Items
            for (const itemData of orderItemsData) {
                await tx.insert(orderItems).values({
                    ...itemData,
                    orderId,
                });
            }

            // --- BILL SPLITTING LOGIC ---
            if (fullCart.type === "GROUP" && (order.splittingStrategy && order.splittingStrategy !== "NONE")) {
                const splits = await billSplitService.calculateSplits(fullCart.id, order.splittingStrategy, payableTotal);
                if (splits.length > 0) {
                    await billSplitService.createSplits(orderId, splits, tx);

                    // Update status to PENDING_PAYMENT if splits exist
                    await tx.update(orders).set({
                        status: "PENDING_PAYMENT",
                        paymentCollectionStatus: "PENDING",
                        paymentStatus: "PENDING"
                    }).where(eq(orders.id, orderId));

                    // Add history
                    await tx.insert(orderStatusHistory).values({
                        id: generateId(),
                        orderId,
                        status: "PENDING_PAYMENT",
                        notes: "Order placed. Waiting for group payments.",
                    });
                }
            }

            // 5. Initial Status History
            await tx.insert(orderStatusHistory).values({
                id: generateId(),
                orderId,
                status: "PLACED",
                notes: "Order placed successfully",
            });

            // 6. Deduct Inventory (Atomic conditional guard to prevent overselling)
            for (const item of fullCart.items) {
                // Check if this item had a reservation
                const itemData = orderItemsData.find(i => i.variantId === item.variantId);
                const isReserved = itemData?.metadata?.reservationId;

                if (!isReserved) {
                    const updated = await tx
                        .update(inventory)
                        .set({
                            quantity: sql`${inventory.quantity} - ${item.quantity}`,
                            updatedAt: new Date(),
                        })
                        .where(
                            and(
                                eq(inventory.variantId, item.variantId),
                                sql`${inventory.quantity} >= ${item.quantity}`
                            )
                        )
                        .returning({ newQuantity: inventory.quantity });

                    if (!updated.length) {
                        throw new ConflictError(
                            `Insufficient stock for ${item.variant.product.name} (${item.variant.name})`
                        );
                    }

                    const remainingStock = updated[0].newQuantity;
                    const lowStockThreshold = item.variant.inventory.lowStockThreshold ?? 5;
                    if (remainingStock <= lowStockThreshold) {
                        const [store] = await tx
                            .select()
                            .from(stores)
                            .where(eq(stores.id, fullCart.storeId))
                            .limit(1);
                        if (store) {
                            notificationService.send(
                                store.ownerId,
                                "Low Stock Alert",
                                `${item.variant.product.name} (${item.variant.name}) has only ${remainingStock} units left.`,
                                "SYSTEM",
                                { variantId: item.variantId, remaining: remainingStock }
                            ).catch(() => {});
                        }
                    }
                }
            }

            // 7. Clear Cart
            await tx.delete(carts).where(eq(carts.id, fullCart.id));

            await createAuditLog({
                actorId: userId,
                action: "CREATE",
                resource: "orders",
                resourceId: orderId,
                afterState: order,
                metadata: { idempotencyKey }
            }, tx);

            return order;
        });

        const fullOrder = await db.query.orders.findFirst({
            where: eq(orders.id, placed.id),
            with: {
                store: true,
                items: true,
                deliveryAddress: true,
                history: {
                    orderBy: (history, { desc }) => [desc(history.createdAt)],
                },
            },
        });
        if (!fullOrder) throw new NotFoundError("Order");

        const couponMeta = redeemCouponMeta as { couponId: string; discount: number } | null;
        if (couponMeta) {
            await couponService.redeemCoupon(
                couponMeta.couponId,
                userId,
                placed.id,
                couponMeta.discount
            );
        }

        const result: PlaceOrderResult = {
            order: presentOrderForCustomer(fullOrder),
            requiresOnlinePayment:
                data.paymentMethod === "KHALTI" || data.paymentMethod === "ESEWA",
        };

        if (cacheKey) {
            await redis.set(cacheKey, JSON.stringify(result), "EX", 300).catch(() => {});
        }

        return result;
    }

    async listOrders(userId: string) {
        const rows = await db.query.orders.findMany({
            where: eq(orders.userId, userId),
            with: {
                store: true,
                items: true,
                history: {
                    orderBy: (history, { desc }) => [desc(history.createdAt)],
                },
            },
            orderBy: (orders, { desc }) => [desc(orders.createdAt)],
        });
        return rows.map((order) => presentOrderForCustomer(order));
    }

    async getOrder(userId: string, orderId: string) {
        const order = await db.query.orders.findFirst({
            where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
            with: {
                store: true,
                items: true,
                deliveryAddress: true,
                history: {
                    orderBy: (history, { desc }) => [desc(history.createdAt)],
                },
            },
        });

        if (!order) throw new NotFoundError("Order");
        return presentOrderForCustomer(order);
    }

    async cancelOrder(userId: string, orderId: string, reason?: string) {
        // Re-use general update logic but restricted to cancellation
        return this.updateStatus(userId, orderId, "CANCELLED", ["CUSTOMER"], reason);
    }

    async updateStatus(
        userId: string,
        orderId: string,
        newStatus: OrderStatus,
        userRoles: UserRole[],
        notes?: string,
        opts?: { codCollected?: boolean }
    ) {
        const order = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
            with: { items: true, store: true }
        });

        if (!order) throw new NotFoundError("Order");

        const hasElevatedOrderRole = userRoles.some((r) =>
            ["SELLER_OWNER", "SELLER_STAFF", "ADMIN", "SUPER_ADMIN", "RIDER", "SYSTEM"].includes(r)
        );
        if (!hasElevatedOrderRole && order.userId !== userId) {
            throw new NotFoundError("Order");
        }

        // 1. Verify Tenant/Owner Access (seller/store linkage enforced via seller routes in practice)
        // Seller can only access their store's orders
        if (userRoles.includes("SELLER_OWNER") || userRoles.includes("SELLER_STAFF")) {
            // In a real app, verify `userId` owns `order.storeId`. 
            // Assuming `userRoles` context generation handled this check or we do it here:
            // For now, rely on `requireRole` middleware + implicit ownership check if strictly enforced
            // But strict SRS says:
            // const isOwner = await isStoreOwner(userId, order.storeId);
        }

        if (newStatus === "DELIVERED" && order.paymentMethod === "COD" && !opts?.codCollected) {
            throw new ValidationError(
                "COD orders require payment confirmation (codCollected: true) before marking delivered."
            );
        }

        // 2. State Machine Validation
        OrderStateMachine.validateTransition(
            order.status as OrderStatus,
            newStatus,
            userRoles,
            order.fulfillmentType
        );

        const updated = await db.transaction(async (tx) => {
            const [row] = await tx
                .update(orders)
                .set({ status: newStatus, updatedAt: new Date() })
                .where(eq(orders.id, orderId))
                .returning();

            await tx.insert(orderStatusHistory).values({
                id: generateId(),
                orderId,
                status: newStatus,
                notes: notes || `Status changed to ${newStatus}`,
            });

            if (newStatus === "DELIVERED") {
                await escrowService.settleAfterDelivery(
                    orderId,
                    {
                        codCollected:
                            order.paymentMethod === "COD"
                                ? opts?.codCollected === true
                                : undefined,
                    },
                    tx
                );
            }

            if (newStatus === "CANCELLED" && order.paymentStatus === "PAID") {
                await escrowService.reverseEscrow(orderId, tx);
                // Also update the order payment status to REFUNDED to reflect it's being handled
                await tx.update(orders)
                    .set({ paymentStatus: "REFUNDED" })
                    .where(eq(orders.id, orderId));
            }

            return row;
        });

        if (newStatus === "PACKED" && shouldCreatePlatformDeliveryTask(order.fulfillmentType)) {
            const { deliveryService } = await import("@/modules/delivery/delivery.service");
            await deliveryService.createTaskForOrder(orderId);
        }

        await createAuditLog({
            actorId: userId,
            action: "UPDATE_STATUS",
            resource: "orders",
            resourceId: orderId,
            metadata: { from: order.status, to: newStatus },
            afterState: updated,
        });

        if (newStatus === "CANCELLED") {
            const { notificationService } = await import("@/modules/customer/notification.service");
            
            // Get item details
            // @ts-ignore - store and items are joined dynamically above
            const items = order.items || [];
            const itemName = items.length > 0 ? items[0].productName : 'items';
            const extraCount = items.length > 1 ? items.length - 1 : 0;
            const itemDescription = extraCount > 0 ? `${itemName} and ${extraCount} more` : itemName;
            
            // @ts-ignore
            const storeName = order.store ? order.store.name : 'The store';

            let title = `Order Cancelled: ${itemDescription}`;
            let msg = '';

            if (userRoles.includes("SYSTEM")) {
                msg = order.paymentStatus === "PAID" 
                    ? `We apologize, but ${storeName} was unable to accept your order for ${itemDescription} within the expected timeframe. Your order has been automatically cancelled, and a full refund has been initiated to your original payment method. We hope to serve you better next time.`
                    : `We apologize, but ${storeName} was unable to accept your order for ${itemDescription} within the expected timeframe. Your order has been automatically cancelled. We hope to serve you better next time.`;
            } else if (userRoles.includes("CUSTOMER")) {
                msg = order.paymentStatus === "PAID"
                    ? `You have successfully cancelled your order for ${itemDescription} from ${storeName}. A full refund has been initiated to your original payment method and will reflect shortly.`
                    : `You have successfully cancelled your order for ${itemDescription} from ${storeName}.`;
            } else {
                msg = order.paymentStatus === "PAID"
                    ? `Your order for ${itemDescription} has been cancelled by ${storeName}. A full refund has been initiated to your original payment method and will reflect shortly.`
                    : `Your order for ${itemDescription} has been cancelled by ${storeName}.`;
            }

            await notificationService.send(
                order.userId,
                title,
                msg,
                "ORDER_UPDATE",
                { orderId, status: newStatus }
            );
        } else {
            void import("./order-notifications").then(({ notifyCustomerOrderStatus }) =>
                notifyCustomerOrderStatus(
                    order.userId,
                    orderId,
                    order.status,
                    newStatus
                )
            );
        }

        // --- GROWTH ENGINE: COMPLETION TRIGGERS ---
        if (newStatus === "DELIVERED") {
            // A. Loyalty Earn (1 Point per 100 Currency Unit? Or 1% cashback?)
            // SRS says: "Earn rate: points per currency unit spent"
            // Let's safe default: 1 Point = 1 Rupee for simplicity or 1 per 100.
            // Let's assume 1 point per 100 spent (1%).
            const earnAmount = Math.floor(Number(order.totalAmount) * 0.01);
            if (earnAmount > 0) {
                await loyaltyService.addTransaction(order.userId, earnAmount, "EARN", orderId);
            }

            // B. Referral Reward (If this was first order?)
            // Use ReferralService
            await referralService.processReferralReward(order.userId);
        }

        return updated;
    }
}

export const orderService = new OrderService();
