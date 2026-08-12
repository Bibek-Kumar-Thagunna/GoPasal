import {describe, expect, it, spyOn, mock, afterAll} from "bun:test";
import { EnterpriseProductService } from "@/modules/enterprise/enterprise-product.service";
import { EnterpriseAnalyticsService } from "@/modules/enterprise/enterprise-analytics.service";
import { db } from "@/db";

describe("Enterprise Engine", () => {

    afterAll(() => {
        mock.restore();
    });

    it("should aggregate stats from multiple branches", async () => {
        // Mock Master Retrieval
        spyOn(db.query.masterMerchants, 'findFirst').mockResolvedValue({
            id: "m1",
            branchIds: ["b1", "b2"]
        } as any);

        // Mock Aggregation Query
        // Drizzle return type is array of records
        spyOn(db, 'select').mockReturnValue({
            from: () => ({
                where: () => Promise.resolve([{
                    totalRevenue: "1000.00",
                    totalOrders: 50
                }])
            })
        } as any);

        const analytics = new EnterpriseAnalyticsService();
        const stats = await analytics.getConsolidatedStats("m1");

        expect(stats.totalRevenue).toBe(1000);
        expect(stats.branchCount).toBe(2);
    });

    it("should push template to branches (mock transaction)", async () => {
        const service = new EnterpriseProductService();

        // Mock Template & Master
        spyOn(db.query.masterProductTemplates, 'findFirst').mockResolvedValue({
            id: "t1", basePrice: 100, name: "Burger", zoneRates: { "KTM-1": 120 }
        } as any);
        spyOn(db.query.masterMerchants, 'findFirst').mockResolvedValue({
            id: "m1", branchIds: ["b1", "b2"]
        } as any);

        // Mock Branch Fetch
        spyOn(db.query.stores, 'findMany').mockResolvedValue([
            { id: "b1", branchZone: "KTM-1" },
            { id: "b2", branchZone: "POKHARA" }
        ] as any);

        // Mock Transaction
        // We just mock db.transaction to execute the callback immediately
        spyOn(db, 'transaction').mockImplementation(async (cb: any) => {
            const tx = {
                query: {
                    products: { findFirst: () => Promise.resolve(null) },
                    branchProductLinks: { findFirst: () => Promise.resolve(null) }
                },
                insert: () => ({ values: () => ({ onConflictDoUpdate: () => Promise.resolve() }) }),
                update: () => ({ set: () => ({ where: () => Promise.resolve() }) })
            } as any;
            await cb(tx);
            return {} as any;
        });

        const result = await service.pushTemplateToBranches("m1", "t1");
        expect(result.synced).toBe(2);
    });
});
