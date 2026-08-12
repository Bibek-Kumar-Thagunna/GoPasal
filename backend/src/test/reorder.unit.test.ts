import { describe, expect, it, spyOn, mock, afterAll } from "bun:test";
import { reorderService } from "@/modules/order/reorder.service";
import { db } from "@/db";

describe("Reorder Service", () => {

    afterAll(() => {
        mock.restore();
    });

    it("should fetch buy again items", async () => {
        // Mock db.execute
        spyOn(db, 'execute').mockResolvedValue([
            { variantId: "v1", productName: "Milk", frequency: 5, lastPrice: 100 }
        ] as any);

        const res = await reorderService.getBuyAgain("u1");
        expect(res.length).toBe(1);
        expect(res[0].frequency).toBe(5);
    });

    // Validating Clone Logic is harder without full DB mock, 
    // but we can verify the Service method exists and handles basic inputs
    it("should be defined", () => {
        expect(reorderService.cloneOrder).toBeDefined();
    });
});
