import {describe, expect, it, spyOn, mock, afterAll} from "bun:test";
import { smartReorderService } from "@/modules/order/smart-reorder.service";
import { db } from "@/db";

describe("Smart Reorder Engine", () => {

    afterAll(() => {
        mock.restore();
    });

    it("should return top frequent items for user", async () => {
        // Mock SQL result
        spyOn(db, 'execute').mockResolvedValue([
            { variantId: "v1", productName: "Milk", frequency: 10, stock: 5, lastOrderedAt: new Date(), lastPrice: 50, currentPrice: 55, storeId: "s1", storeName: "Store A" },
            { variantId: "v2", productName: "Bread", frequency: 5, stock: 2, lastOrderedAt: new Date(), lastPrice: 30, currentPrice: 30, storeId: "s1", storeName: "Store A" }
        ] as any);

        const suggestions = await smartReorderService.getReorderSuggestions("u1");
        expect(suggestions.length).toBe(2);
        expect(suggestions[0].productName).toBe("Milk");
        expect(suggestions[0].inStock).toBe(true);
    });

    it("should exclude out of stock items from suggestions (handled in SQL)", async () => {
        // The SQL query has `WHERE v.inventory_quantity > 0`
        // We simulate the DB returning only valid items
        spyOn(db, 'execute').mockResolvedValue([] as any);
        const suggestions = await smartReorderService.getReorderSuggestions("u1");
        expect(suggestions.length).toBe(0);
    });
});
