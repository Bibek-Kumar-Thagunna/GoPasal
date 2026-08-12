import { db, type DbTransaction } from "@/db";
import { groupOrderSplits, orders, orderStatusHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateId, NotFoundError, ValidationError } from "@/utils";
import { GroupCartService } from "./group-cart.service";

const groupCartService = new GroupCartService();

export class BillSplitService {
    async calculateSplits(cartId: string, strategy: "NONE" | "EQUAL" | "ITEMIZED", totalAmount: number) {
        if (strategy === "NONE") return [];

        const cart = await groupCartService.getCart(cartId);
        const participants = await groupCartService.getParticipants(cartId);

        if (!participants.length) return []; // Should be at least host

        const splits: { userId: string, amount: number }[] = [];

        if (strategy === "EQUAL") {
            const splitAmount = Math.floor((totalAmount / participants.length) * 100) / 100;
            let remainder = totalAmount - (splitAmount * participants.length);

            // Assign remainder to Host
            participants.forEach((p: any) => {
                let amount = splitAmount;
                if (p.role === "HOST") {
                    amount += remainder;
                    remainder = 0; // Consumed
                }
                splits.push({ userId: p.userId, amount });
            });
        } else if (strategy === "ITEMIZED") {
            // 1. Calculate Individual Consumption
            const userTotals: Record<string, number> = {};
            let sharedTotal = 0;

            for (const item of cart.items) {
                const itemTotal = Number(item.variant.product.basePrice) * item.quantity;
                if (item.addedBy) {
                    userTotals[item.addedBy] = (userTotals[item.addedBy] || 0) + itemTotal;
                } else {
                    sharedTotal += itemTotal;
                }
            }

            // 2. Split Shared Cost Equally
            const sharedPerPerson = sharedTotal > 0 ? sharedTotal / participants.length : 0;

            // 3. Construct Splits
            participants.forEach((p: any) => {
                const personal = userTotals[p.userId] || 0;
                const total = personal + sharedPerPerson;
                splits.push({ userId: p.userId, amount: Number(total.toFixed(2)) });
            });

            // Fix rounding errors by adjusting Host
            const calculatedTotal = splits.reduce((sum, s) => sum + s.amount, 0);
            const diff = totalAmount - calculatedTotal;
            if (Math.abs(diff) > 0.001) {
                const hostSplit = splits.find(s => participants.find((p: any) => p.userId === s.userId)?.role === "HOST");
                if (hostSplit) hostSplit.amount += diff;
            }
        }

        return splits;
    }

    async createSplits(
        orderId: string,
        splits: { userId: string; amount: number }[],
        tx: DbTransaction | typeof db = db
    ) {
        if (splits.length === 0) return;

        for (const split of splits) {
            await tx.insert(groupOrderSplits).values({
                id: generateId(),
                orderId,
                userId: split.userId,
                amountOwed: String(split.amount),
                amountPaid: "0",
                status: "PENDING"
            });
        }
    }

    async processPayment(splitId: string, userId: string, amount: number, paymentRef: string) {
        return await db.transaction(async (tx: DbTransaction) => {
            const [split] = await tx.select().from(groupOrderSplits).where(eq(groupOrderSplits.id, splitId));
            if (!split) throw new NotFoundError("Split record not found");
            if (split.userId !== userId) throw new ValidationError("User mismatch");
            if (split.status === "PAID") return split; // Idempotent

            // Update Split
            await tx.update(groupOrderSplits)
                .set({
                    amountPaid: String(amount),
                    status: "PAID",
                    transactionRef: paymentRef,
                    updatedAt: new Date()
                })
                .where(eq(groupOrderSplits.id, splitId));

            // Check if ALL splits for this order are paid
            const allSplits = await tx.select().from(groupOrderSplits).where(eq(groupOrderSplits.orderId, split.orderId));
            const allPaid = allSplits.every(s => s.status === "PAID" || s.id === splitId); // Current one is updated in tx but select might see old if isolation level varies, safely rely on logic

            if (allPaid) {
                // Update Order Status to PLACED
                await tx
                    .update(orders)
                    .set({
                        status: "PLACED",
                        paymentCollectionStatus: "COLLECTED",
                        paymentStatus: "PAID", // Since all parts collected
                        updatedAt: new Date()
                    })
                    .where(eq(orders.id, split.orderId))
                    .returning();

                await tx.insert(orderStatusHistory).values({
                    id: generateId(),
                    orderId: split.orderId,
                    status: "PLACED",
                    notes: "Group Order: All splits collected",
                });

                // Trigger delivery task? Usually handled in OrderService based on PLACED.
                // We might need to manually trigger it or allow the poller/listener to pick it up.
                // For now, assuming OrderStateMachine would handle it if we used `OrderService.updateStatus`, 
                // but avoiding circular dependency here. 
                // Better: OrderService should expose `markPaid()`
            }

            return { success: true, allPaid };
        });
    }

    async getMySplits(userId: string) {
        return await db.select().from(groupOrderSplits)
            .where(eq(groupOrderSplits.userId, userId));
    }
}

export const billSplitService = new BillSplitService();
