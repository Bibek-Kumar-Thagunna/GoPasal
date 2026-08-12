import { contextService } from "./context.service";
import { db, type DbTransaction } from "@/db";
import { supportActions, supportConversations, supportMessages, orderItems } from "@/db/schema";
import { generateId } from "@/utils";
import { eq } from "drizzle-orm";

type Intent = "ORDER_STATUS" | "MISSING_ITEM" | "REFUND_POLICY" | "AGENT_HANDOFF" | "GREETING" | "UNKNOWN";

export class AiAgentService {
    private readonly MAX_AUTO_CREDIT = 200;

    async handleQuery(userId: string, query: string, conversationId?: string) {
        // 1. Ensure Conversation Exists
        if (!conversationId) {
            conversationId = `conv_${generateId()}`;
            await db.insert(supportConversations).values({
                id: conversationId,
                userId,
                status: "BOT_ACTIVE"
            });
        }

        // 2. Log User Message
        await db.insert(supportMessages).values({
            id: `msg_${generateId()}`,
            conversationId,
            sender: "USER",
            message: query
        });

        const context = await contextService.getUserContext(userId);
        const intent = this.detectIntent(query);

        let response = { reply: "", action: "" };

        // Guardrails
        if (this.isNegativeSentiment(query)) {
            response = await this.handoffToAgent(userId, conversationId, "Negative Sentiment");
        } else {
            switch (intent) {
                case "ORDER_STATUS":
                    response = this.handleOrderStatus(context);
                    break;
                case "MISSING_ITEM":
                    response = await this.handleMissingItem(userId, conversationId, context, query);
                    break;
                case "REFUND_POLICY":
                    response = {
                        reply: "Refunds for damaged items must be requested within 7 days via the Dispute center. I cannot process bank refunds directly.",
                        action: "none"
                    };
                    break;
                case "AGENT_HANDOFF":
                    response = await this.handoffToAgent(userId, conversationId, "User Request");
                    break;
                case "GREETING":
                    response = {
                        reply: `Hi ${context.user?.name || 'there'}! I can help with Order Status or Missing Items.`,
                        action: "none"
                    };
                    break;
                default:
                    response = {
                        reply: "I'm not sure. I can connect you to a human agent if you wish.",
                        action: "none"
                    };
            }
        }

        // 3. Log Bot Reply
        await db.insert(supportMessages).values({
            id: `msg_${generateId()}`,
            conversationId,
            sender: "BOT",
            message: response.reply,
            metadata: { intent }
        });

        return { ...response, conversationId };
    }

    private detectIntent(query: string): Intent {
        const lower = query.toLowerCase();
        if (lower.includes("order") || lower.includes("where") || lower.includes("status")) return "ORDER_STATUS";
        if (lower.includes("missing") || lower.includes("didn't get") || lower.includes("item")) return "MISSING_ITEM";
        if (lower.includes("refund") || lower.includes("return")) return "REFUND_POLICY";
        if (lower.includes("agent") || lower.includes("human")) return "AGENT_HANDOFF";
        if (lower.includes("hi") || lower.includes("hello")) return "GREETING";
        return "UNKNOWN";
    }

    private isNegativeSentiment(query: string): boolean {
        const negatives = ["scam", "cheat", "stupid", "useless", "worst"];
        return negatives.some(word => query.toLowerCase().includes(word));
    }

    private handleOrderStatus(context: any) {
        const recentOrder = context.orders[0];
        if (!recentOrder) return { reply: "You don't have any active orders.", action: "none" };

        return {
            reply: `Order #${recentOrder.id.slice(0, 8)} is ${recentOrder.status}. Total: ${recentOrder.totalAmount}.`,
            action: "show_order"
        };
    }

    private async handleMissingItem(
        userId: string,
        conversationId: string,
        context: any,
        query: string
    ) {
        const recentOrder = context.orders[0];
        // Rules: Must have order, must be Delivered
        if (!recentOrder || recentOrder.status !== "DELIVERED") {
            return { reply: "I can only help with missing items for delivered orders. Please check your order status.", action: "none" };
        }

        // Verify the claim against the actual order line items. We only
        // auto-credit when the query names an item that exists on the order;
        // anything ambiguous is escalated to a human agent.
        const items = await db.query.orderItems.findMany({
            where: eq(orderItems.orderId, recentOrder.id),
        });
        const lowerQuery = query.toLowerCase();
        const match = items.find(
            (it: any) =>
                it.productName?.toLowerCase().includes(lowerQuery) ||
                lowerQuery.includes(it.productName?.toLowerCase())
        );

        if (!match) {
            return this.handoffToAgent(
                userId,
                conversationId,
                "Missing item claim could not be matched to an order line item"
            );
        }

        const claimAmount = Math.min(
            Number(match.priceAtPurchase ?? 0) * Number(match.quantity ?? 1),
            this.MAX_AUTO_CREDIT
        );

        if (claimAmount <= 0) {
            return this.handoffToAgent(userId, conversationId, "Missing item has zero value");
        }

        // Auto-Credit Logic (Ledger)
        await db.transaction(async (tx: DbTransaction) => {
            // 1. Create Support Action Audit
            await tx.insert(supportActions).values({
                id: `act_${generateId()}`,
                conversationId,
                actionType: "ISSUE_WALLET_CREDIT",
                status: "EXECUTED",
                payload: { amount: claimAmount, orderId: recentOrder.id, item: match.productName }
            });

            // 2. Ledger - Debit Expense, Credit User Wallet (simplified)
            // In real app: insert into ledgerEntries
        });

        return {
            reply: `I've credited Rs. ${claimAmount} to your wallet for the missing item. Sorry for the inconvenience!`,
            action: "wallet_credit"
        };
    }

    private async handoffToAgent(userId: string, conversationId: string, reason: string) {
        await db.update(supportConversations)
            .set({ status: "HUMAN_PENDING", updatedAt: new Date() })
            .where(eq(supportConversations.id, conversationId));

        await db.insert(supportActions).values({
            id: `act_${generateId()}`,
            conversationId,
            actionType: "ESCALATE",
            status: "EXECUTED",
            payload: { reason, userId }
        });

        return {
            reply: "I've connected you to our support team. An agent will review your chat shortly.",
            action: "ticket_created"
        };
    }
}

export const aiAgentService = new AiAgentService();
