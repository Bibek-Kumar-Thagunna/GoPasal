import type { orders, orderItems, orderStatusHistory } from "@/db/schema";

type OrderRow = typeof orders.$inferSelect;
type ItemRow = typeof orderItems.$inferSelect;
type HistoryRow = typeof orderStatusHistory.$inferSelect;

type PricingSnapshot = {
    itemsSubtotal?: number;
    deliveryFeeCharged?: number;
    platformFee?: number;
    payableTotal?: number;
};

const PIPELINE: { status: HistoryRow["status"]; label: string }[] = [
    { status: "PLACED", label: "Order placed" },
    { status: "ACCEPTED", label: "Accepted by store" },
    { status: "CONFIRMED", label: "Preparing your order" },
    { status: "PACKED", label: "Packed" },
    { status: "OUT_FOR_DELIVERY", label: "Out for delivery" },
    { status: "DELIVERED", label: "Delivered" },
];

function buildTrackingSteps(currentStatus: string, history: HistoryRow[]) {
    if (currentStatus === "CANCELLED") {
        const cancelledAt = history.find((h) => h.status === "CANCELLED")?.createdAt;
        return [
            {
                status: "CANCELLED",
                label: "Order cancelled",
                completed: true,
                current: true,
                timestamp: cancelledAt?.toISOString(),
            },
        ];
    }

    const historyByStatus = new Map(
        history.map((h) => [h.status, h.createdAt] as const)
    );
    const statusRank = new Map(PIPELINE.map((s, i) => [s.status, i]));
    const currentRank = statusRank.get(currentStatus as HistoryRow["status"]) ?? 0;

    return PIPELINE.map((step) => {
        const stepRank = statusRank.get(step.status) ?? 0;
        const completed =
            currentStatus === "DELIVERED" ? true : stepRank < currentRank;
        const current = step.status === currentStatus;
        return {
            status: step.status,
            label: step.label,
            completed,
            current,
            timestamp: historyByStatus.get(step.status)?.toISOString(),
        };
    });
}

function paymentStatusLabel(
    paymentMethod: string,
    paymentStatus: string,
    paymentCollectionStatus: string
): string {
    if (paymentMethod === "COD") {
        if (paymentCollectionStatus === "COLLECTED") return "Cash collected";
        if (paymentStatus === "PAID") return "Paid (COD)";
        return "Pay on delivery";
    }
    if (paymentStatus === "PAID") return "Paid online";
    if (paymentStatus === "FAILED") return "Payment failed";
    return "Payment pending";
}

export function presentOrderForCustomer(
    order: OrderRow & {
        items: ItemRow[];
        history?: HistoryRow[];
        store?: { id: string; name: string; slug?: string } | null;
        deliveryAddress?: {
            label: string;
            addressLine: string;
            city: string;
            latitude: number;
            longitude: number;
        } | null;
    }
) {
    const snap = (order.pricingSnapshot ?? {}) as PricingSnapshot;
    const subtotal =
        snap.itemsSubtotal ??
        order.items.reduce(
            (sum, it) => sum + Number(it.priceAtPurchase) * it.quantity,
            0
        );
    const deliveryFee = snap.deliveryFeeCharged ?? 0;
    const platformFee = snap.platformFee ?? 0;
    const total = snap.payableTotal ?? Number(order.totalAmount);
    const history = order.history ?? [];

    return {
        id: order.id,
        status: order.status,
        fulfillmentType: order.fulfillmentType,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentCollectionStatus: order.paymentCollectionStatus,
        paymentStatusLabel: paymentStatusLabel(
            order.paymentMethod,
            order.paymentStatus,
            order.paymentCollectionStatus
        ),
        items: order.items.map((it) => ({
            id: it.id,
            productId: it.variantId,
            productName: it.productName,
            productImage: "",
            quantity: it.quantity,
            price: Number(it.priceAtPurchase),
            total: Number(it.priceAtPurchase) * it.quantity,
        })),
        subtotal,
        deliveryFee,
        platformFee,
        discount: 0,
        total,
        store: order.store,
        deliveryAddress: order.deliveryAddress,
        createdAt: order.createdAt.toISOString(),
        notes: order.notes ?? undefined,
        trackingSteps: buildTrackingSteps(order.status, history),
    };
}
