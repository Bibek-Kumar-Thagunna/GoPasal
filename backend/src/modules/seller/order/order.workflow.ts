import type { orders } from "@/db/schema";

export type OrderRowStatus = (typeof orders.$inferSelect)["status"];
export type OrderFulfillmentType = (typeof orders.$inferSelect)["fulfillmentType"];

export const ALLOWED_TRANSITIONS: Record<OrderRowStatus, OrderRowStatus[]> = {
    PENDING_PAYMENT: ["ACCEPTED", "CANCELLED"],
    PLACED: ["ACCEPTED", "CANCELLED"],
    ACCEPTED: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["PACKED", "CANCELLED"],
    PACKED: ["SHIPPED", "OUT_FOR_DELIVERY", "CANCELLED"],
    SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
    OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
    DELIVERED: [],
    CANCELLED: [],
    RETURN_INITIATED: [],
    RETURNED: [],
};

export function isAllowedTransition(from: OrderRowStatus, to: OrderRowStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
}

/** Seller transitions: base graph plus shortcuts when no platform rider is involved. */
export function isSellerTransitionAllowed(
    from: OrderRowStatus,
    to: OrderRowStatus,
    fulfillmentType?: OrderFulfillmentType | null
): boolean {
    if (isAllowedTransition(from, to)) return true;
    if (fulfillmentType === "PICKUP" && from === "PACKED" && to === "DELIVERED") return true;
    if (
        fulfillmentType === "MERCHANT_DELIVERY" &&
        from === "PACKED" &&
        (to === "DELIVERED" || to === "OUT_FOR_DELIVERY" || to === "SHIPPED")
    ) {
        return true;
    }
    return false;
}

export function isIdempotentStatusUpdate(current: OrderRowStatus, next: OrderRowStatus): boolean {
    return current === next;
}
