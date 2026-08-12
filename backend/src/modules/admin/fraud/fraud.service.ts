import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { eq, and, gte, count } from "drizzle-orm";

const MAX_ORDERS_PER_HOUR = 5;
const HIGH_VALUE_THRESHOLD = 50000; // NPR

export class FraudService {
    /**
     * Check if a user is placing orders too frequently (velocity check).
     * Returns true if suspicious.
     */
    async checkVelocity(userId: string): Promise<boolean> {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const [result] = await db
            .select({ orderCount: count() })
            .from(orders)
            .where(
                and(
                    eq(orders.userId, userId),
                    gte(orders.createdAt, oneHourAgo)
                )
            );

        return (result?.orderCount || 0) >= MAX_ORDERS_PER_HOUR;
    }

    /**
     * Flag high-value orders for manual review.
     * Returns true if the order exceeds the threshold.
     */
    isHighValueOrder(totalAmount: number): boolean {
        return totalAmount >= HIGH_VALUE_THRESHOLD;
    }

    /**
     * Run all fraud checks for an order placement.
     * Returns an object with flags.
     */
    async runChecks(userId: string, totalAmount: number) {
        const velocityFlag = await this.checkVelocity(userId);
        const highValueFlag = this.isHighValueOrder(totalAmount);

        return {
            isSuspicious: velocityFlag || highValueFlag,
            flags: {
                velocityExceeded: velocityFlag,
                highValueOrder: highValueFlag,
            },
        };
    }
}

export const fraudService = new FraudService();
