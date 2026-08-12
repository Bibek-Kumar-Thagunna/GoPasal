import {describe, expect, it, spyOn, mock, afterAll} from "bun:test";
import { aiAgentService } from "@/modules/support/ai-agent.service";
import { contextService } from "@/modules/support/context.service";
import { db } from "@/db";

describe("Safe AI Support Agent", () => {

    afterAll(() => {
        mock.restore();
    });

    // Mock Context
    const mockContext = {
        user: { id: "u1", name: "Test User" },
        orders: [
            { id: "ord_123", status: "DELIVERED", totalAmount: "1000" }
        ],
        disputes: []
    };

    // Spy on context service
    spyOn(contextService, 'getUserContext').mockResolvedValue(mockContext as any);
    // Mock DB insert
    spyOn(db, 'insert').mockReturnValue({ values: () => Promise.resolve() } as any);
    spyOn(db, 'update').mockReturnValue({ set: () => ({ where: () => Promise.resolve() }) } as any);
    // Mock transaction + orderItems query (used by the verified missing-item flow)
    spyOn(db, 'transaction').mockImplementation(async (cb) => {
        return cb({
            insert: () => ({ values: () => Promise.resolve() })
        } as any);
    });
    spyOn(db, 'query').mockReturnValue({
        orderItems: {
            findMany: () =>
                Promise.resolve([
                    { id: "itm_1", orderId: "ord_123", productName: "Raita", quantity: 2, priceAtPurchase: "25" },
                ]),
        },
    } as never);

    it("should handle GREETING intent", async () => {
        const res = await aiAgentService.handleQuery("u1", "Hello");
        expect(res.reply).toContain("Test User");
    });

    it("should handle MISSING_ITEM with verified Auto-Credit", async () => {
        // The query must name an item that exists on the delivered order.
        const res = await aiAgentService.handleQuery("u1", "My Raita is missing");
        expect(res.reply).toContain("credited Rs. 50"); // 2 × 25, capped at 200
        expect(res.action).toBe("wallet_credit");
    });

    it("should escalate MISSING_ITEM claims that don't match an order line item", async () => {
        const res = await aiAgentService.handleQuery("u1", "My Diamond Ring is missing");
        expect(res.action).toBe("ticket_created");
        expect(res.reply).toContain("support team");
    });

    it("should handle MISSING_ITEM with non-delivered order", async () => {
        // Change context momentarily
        spyOn(contextService, 'getUserContext').mockResolvedValue({
            ...mockContext,
            orders: [{ id: "ord_123", status: "PLACED" }] // Not delivered
        } as any);

        const res = await aiAgentService.handleQuery("u1", "Missing item");
        expect(res.reply).toContain("only help with missing items for delivered");
    });

    it("should escalate on NEGATIVE sentiment", async () => {
        const res = await aiAgentService.handleQuery("u1", "This service is useless");
        expect(res.action).toBe("ticket_created");
        expect(res.reply).toContain("support team");
    });
});
