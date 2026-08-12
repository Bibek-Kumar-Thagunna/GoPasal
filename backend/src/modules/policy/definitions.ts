import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, and, count, sql } from "drizzle-orm";

export interface PolicyContext {
    type: "PRODUCT" | "ORDER" | "REFUND";
    data: any;
    actorId: string;
}

export const PolicyRules = {
    // 1. Product Policy: Prohibited Items
    PRODUCT_PROHIBITED_ITEMS: async (ctx: PolicyContext) => {
        if (ctx.type !== "PRODUCT") return true; // Pass

        const prohibitedPatterns = [
            /gun/i, /weapon/i, /firearm/i,
            /drug/i, /narcotic/i,
            /alcohol/i, /liquor/i, /beer/i // Unless licensed, but blocking for now as per simple rule
        ];

        const textToCheck = `${ctx.data.name} ${ctx.data.description || ""}`;

        for (const pattern of prohibitedPatterns) {
            if (pattern.test(textToCheck)) {
                return "Contains prohibited item keywords";
            }
        }
        return true;
    },

    // 2. Order Policy: Excessive Unpaid COD
    ORDER_UNPAID_LIMIT: async (ctx: PolicyContext) => {
        if (ctx.type !== "ORDER") return true;

        if (ctx.data.paymentMethod === "COD") {
            // Check count of OPEN orders with COD
            // Simplified query: Count orders by this user that are PLACED/ACCEPTED/PACKED/OUT_FOR_DELIVERY and COD
            // If > 3, block.

            const result = await db.select({ count: count() }).from(orders)
                .where(and(
                    eq(orders.userId, ctx.actorId),
                    eq(orders.paymentMethod, "COD"),
                    sql`${orders.status} IN ('PLACED', 'ACCEPTED', 'PACKED', 'OUT_FOR_DELIVERY')`
                ));

            if (result[0].count >= 3) {
                return "Too many active COD orders (Limit: 3). Please complete existing orders first.";
            }
        }
        return true;
    },

    // 3. Refund Policy: Abuse Check (Example)
    REFUND_ABUSE_CHECK: async (ctx: PolicyContext) => {
        if (ctx.type !== "REFUND") return true;
        // Check if user has refunded more than 3 times in last month?
        return true; // Placeholder
    }
};
