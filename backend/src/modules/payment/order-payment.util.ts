import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { DbTransaction } from "@/db";

export type OrderPaymentMethod = "COD" | "ESEWA" | "KHALTI";

export function paymentCollectionStatusForNewOrder(method: OrderPaymentMethod): "PENDING" | "NOT_REQUIRED" {
    if (method === "COD") return "PENDING";
    return "PENDING";
}

export async function markOrderPaymentSettled(
    orderId: string,
    method: OrderPaymentMethod,
    tx: DbTransaction
): Promise<void> {
    await tx
        .update(orders)
        .set({
            paymentStatus: "PAID",
            paymentCollectionStatus: method === "COD" ? "COLLECTED" : "COLLECTED",
            updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
}

/** Online payment confirmed at gateway — funds held in escrow until delivery. */
export async function markOrderPrepaid(
    orderId: string,
    tx: DbTransaction
): Promise<void> {
    await tx
        .update(orders)
        .set({
            paymentStatus: "PAID",
            paymentCollectionStatus: "NOT_REQUIRED",
            updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
}
