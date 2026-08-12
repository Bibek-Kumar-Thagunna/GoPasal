import {describe, expect, it, spyOn, beforeAll, mock, afterAll} from "bun:test";
import { FlashSaleService } from "@/modules/flash_sale/flash-sale.service";
import { redis } from "@/lib/redis";
import { db } from "@/db";

describe("Flash Sale Engine", () => {

    afterAll(() => {
        mock.restore();
    });

    beforeAll(() => {
        // Mock DB for Config Lookup
        spyOn(db.query.hotItemConfig, 'findFirst').mockResolvedValue({
            id: "c1",
            eventId: "e1",
            variantId: "v1",
            shardCount: 4,
            status: "ACTIVE"
        } as any);

        spyOn(db, 'update').mockReturnValue({
            set: () => ({ where: () => Promise.resolve() })
        } as any);
    });

    it("should initialize stock across shards", async () => {
        const service = new FlashSaleService();
        await service.initializeStock("e1", "v1", 100, 4);

        // 100 / 4 = 25 per shard
        const s0 = await redis.get("stock:e1:v1:0");
        const s1 = await redis.get("stock:e1:v1:1");

        expect(s0).toBe("25");
        expect(s1).toBe("25");
    });

    it("should reserve stock correctly", async () => {
        const service = new FlashSaleService();

        // Reserve 1
        const resId = await service.reserveStock("v1", 1, "u1");
        expect(resId).toContain("res_");

        // Verify Total Decreased
        // We don't know which shard was hit, but one should be 24
        let found = false;
        for (let i = 0; i < 4; i++) {
            const val = await redis.get(`stock:e1:v1:${i}`);
            if (val === "24") found = true;
        }
        expect(found).toBe(true);
    });

    it("should fail when OOS", async () => {
        const service = new FlashSaleService();
        // Drain stock
        // Manually set all shards to 0
        for (let i = 0; i < 4; i++) {
            await redis.set(`stock:e1:v1:${i}`, 0);
        }

        try {
            await service.reserveStock("v1", 1, "u2");
            expect(false).toBe(true); // Should fail
        } catch (e: any) {
            expect(e.message).toBe("Sold Out");
        }
    });

    it("should trigger waiting room when RPS exceeded", async () => {
        const service = new FlashSaleService();
        // Mock Redis Incr to return 101
        spyOn(redis, 'incr').mockResolvedValue(101);

        const admission = await service.checkAdmission("e1", "u3");
        expect(admission.allowed).toBe(false);
        expect(admission.estimatedWait).toBe(30);
    });

    it("should allow admission when RPS is low", async () => {
        const service = new FlashSaleService();
        spyOn(redis, 'incr').mockResolvedValue(50);

        const admission = await service.checkAdmission("e1", "u4");
        expect(admission.allowed).toBe(true);
    });

});
