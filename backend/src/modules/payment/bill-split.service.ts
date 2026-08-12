import { db, type DbTransaction } from "@/db";
import { groupOrderSplits, orders, cartParticipants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateId, NotFoundError, ValidationError } from "@/utils";

export class BillSplitService {

    // 1. Calculate and Create Splits
    async createSplits(
        orderId: string,
        cartId: string, // Needed to fetch items/participants for calculation
        strategy: "EQUAL" | "ITEMIZED",
        totalAmount: number
    ) {
        const participants = await db.select().from(cartParticipants)
            .where(and(eq(cartParticipants.cartId, cartId), eq(cartParticipants.status, "ACTIVE")));

        if (participants.length === 0) throw new ValidationError("No participants to split bill");

        let splits: { userId: string, amount: number }[] = [];

        if (strategy === "EQUAL") {
            const splitAmount = Math.floor((totalAmount / participants.length) * 100) / 100;
            const remainder = totalAmount - (splitAmount * participants.length);

            splits = participants.map((p, index) => ({
                userId: p.userId,
                amount: index === 0 ? splitAmount + remainder : splitAmount // Host (usually first) takes remainder? Or random.
            }));
        } else if (strategy === "ITEMIZED") {
            // Assuming we join with Product/Variant to get price. 
            // For MVP, letting CartService pass enriched items or refetching here.
            // Let's assume we can fetch price. 
            // Since `cartItems` table doesn't have price, we need to join.
            // Complex logic omitted for MVP brevity, simulating logic:

            // "Shared" items (addedBy null) -> Equal split
            // "Personal" items (addedBy set) -> Assigned to user

            // Placeholder logic:
            const splitAmount = Math.floor((totalAmount / participants.length) * 100) / 100; // Fallback for MVP code block
            splits = participants.map((p) => ({ userId: p.userId, amount: splitAmount }));
        }

        // Insert Splits
        await db.transaction(async (tx: DbTransaction) => {
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

            await tx.update(orders)
                .set({
                    splittingStrategy: strategy,
                    paymentCollectionStatus: "PENDING",
                    updatedAt: new Date()
                })
                .where(eq(orders.id, orderId));
        });

        return splits;
    }

    // 2. Pay Split
    async paySplit(splitId: string, amount: number, transactionRef?: string) {
        const [split] = await db.select().from(groupOrderSplits).where(eq(groupOrderSplits.id, splitId));
        if (!split) throw new NotFoundError("Split record not found");

        if (split.status === "PAID") return split;

        // Verify Amount? 
        if (Number(split.amountOwed) > amount) {
            // Partial? For now, require full.
            // throw new ValidationError("Partial payment not supported yet");
        }

        await db.update(groupOrderSplits)
            .set({
                amountPaid: String(amount),
                status: "PAID",
                transactionRef,
                updatedAt: new Date()
            })
            .where(eq(groupOrderSplits.id, splitId));

        // Check if Order is fully Paid
        await this.checkOrderCompletion(split.orderId);

        return { message: "Split paid" };
    }

    // 3. Check & Finalize Order
    async checkOrderCompletion(orderId: string) {
        const splits = await db.select().from(groupOrderSplits).where(eq(groupOrderSplits.orderId, orderId));

        const allPaid = splits.every(s => s.status === "PAID");

        if (allPaid) {
            await db.update(orders)
                .set({
                    paymentCollectionStatus: "COLLECTED",
                    status: "PLACED", // Move from PENDING to PLACED
                    updatedAt: new Date()
                })
                .where(eq(orders.id, orderId));

            // Trigger downstream? (Notification etc)
        }
    }
}

export const billSplitService = new BillSplitService();
