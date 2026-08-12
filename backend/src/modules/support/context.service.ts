import { db } from "@/db";
import { orders, disputes, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export class ContextService {

    // Fetch last N orders for context
    async getUserContext(userId: string) {
        const lastOrders = await db.select()
            .from(orders)
            .where(eq(orders.userId, userId))
            .orderBy(desc(orders.createdAt))
            .limit(3);

        const activeDisputes = await db.select()
            .from(disputes)
            .where(and(
                eq(disputes.reporterId, userId),
                eq(disputes.status, "OPEN")
            ));

        const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

        return {
            user: user[0],
            orders: lastOrders,
            disputes: activeDisputes
        };
    }
}

export const contextService = new ContextService();
