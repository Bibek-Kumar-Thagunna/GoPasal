import { OrderStatus, type OrderStatus as OrderStatusType } from "@/types";
import { notificationService } from "@/modules/customer/notification.service";

const STATUS_LABELS: Partial<Record<OrderStatusType, string>> = {
    PLACED: "Placed",
    PENDING_PAYMENT: "Awaiting payment",
    ACCEPTED: "Accepted by shop",
    PACKED: "Packed",
    OUT_FOR_DELIVERY: "Out for delivery",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    RETURN_INITIATED: "Return started",
    RETURNED: "Returned",
};

const NOTIFY_STATUSES = new Set<OrderStatusType>([
    OrderStatus.PLACED,
    OrderStatus.ACCEPTED,
    OrderStatus.PACKED,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
]);

export async function notifyCustomerOrderStatus(
    userId: string,
    orderId: string,
    previousStatus: string,
    newStatus: OrderStatusType
): Promise<void> {
    if (previousStatus === newStatus) return;
    if (!NOTIFY_STATUSES.has(newStatus)) return;

    const label = STATUS_LABELS[newStatus] ?? newStatus.replace(/_/g, " ").toLowerCase();
    const shortId = orderId.slice(-8).toUpperCase();

    await notificationService.send(
        userId,
        `Order #${shortId}`,
        `Your order is now: ${label}.`,
        "ORDER_UPDATE",
        { orderId, status: newStatus }
    );
}
