import { describe, expect, it, beforeAll } from "bun:test";
import { adService } from "@/modules/adtech/ad.service";
import { db } from "@/db";
import { sponsoredCampaigns, sponsoredTargets, adSpendDaily, products, stores, users, categories } from "@/db/schema";
import { generateId } from "@/utils";
import { eq, inArray } from "drizzle-orm";

describe("AdTech Engine", () => {
    let storeId: string;
    let campaignId: string;
    const TARGET_KEYWORD = "testad";

    beforeAll(async () => {
        // Clean up leftovers from previous runs so the budget assertions are hermetic.
        const staleTargets = await db
            .select({ id: sponsoredTargets.id, campaignId: sponsoredTargets.campaignId })
            .from(sponsoredTargets)
            .where(eq(sponsoredTargets.targetValue, TARGET_KEYWORD));
        const staleCampaignIds = staleTargets.map((t) => t.campaignId);
        if (staleCampaignIds.length > 0) {
            await db.delete(adSpendDaily).where(
                inArray(adSpendDaily.campaignId, staleCampaignIds)
            );
            await db.delete(sponsoredTargets).where(
                inArray(sponsoredTargets.id, staleTargets.map((t) => t.id))
            );
            await db.delete(sponsoredCampaigns).where(
                inArray(sponsoredCampaigns.id, staleCampaignIds)
            );
        }

        storeId = "store_ad_" + generateId();
        campaignId = generateId();
        const ownerId = "owner_ad_" + generateId();

        // Seed the category referenced by the product (FK).
        await db.insert(categories).values({
            id: "cat_misc",
            name: "Miscellaneous",
            slug: "misc-" + generateId(),
            isActive: true,
        } as any).onConflictDoNothing();

        // Seed User (owner)
        await db.insert(users).values({
            id: ownerId,
            name: "Ad Store Owner",
            email: "adowner_" + generateId() + "@test.com",
            role: "SELLER",
            phone: "98" + generateId().substring(0, 8)
        } as any);

        // Setup Store & Product (Needed for AdService to pick a product)
        await db.insert(stores).values({
            id: storeId,
            ownerId: ownerId,
            name: "Ad Store",
            slug: storeId,
            status: "ACTIVE"
        } as any);

        await db.insert(products).values({
            id: "prod_ad_" + generateId(),
            storeId,
            name: "Test Ad Product",
            slug: "ad-product-" + generateId(),
            basePrice: "100",
            isActive: true,
            categoryId: "cat_misc"
        } as any);

        // Create Campaign
        await db.insert(sponsoredCampaigns).values({
            id: campaignId,
            storeId,
            name: "Test Campaign",
            dailyBudget: "10.00",
            startDate: new Date(Date.now() - 1000),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: "ACTIVE"
        } as any);

        // Create Target
        await db.insert(sponsoredTargets).values({
            id: generateId(),
            campaignId,
            targetType: "KEYWORD",
            targetValue: TARGET_KEYWORD,
            bidAmount: "1.00"
        } as any);
    });

    it("should return sponsored products for matching query", async () => {
        const results = await adService.getSponsoredProducts({ query: TARGET_KEYWORD });
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].isSponsored).toBe(true);
    });

    it("should enforce daily budget", async () => {
        // 1. Manually exhaust budget (upsert — impressions from the previous test may exist)
        const today = new Date().toISOString().split("T")[0];
        await db.insert(adSpendDaily).values({
            date: today,
            campaignId,
            storeId,
            totalSpend: "10.00" // Hit limit
        }).onConflictDoUpdate({
            target: [adSpendDaily.date, adSpendDaily.campaignId],
            set: { totalSpend: "10.00" }
        });

        // 2. Search again
        const results = await adService.getSponsoredProducts({ query: TARGET_KEYWORD });
        expect(results.length).toBe(0); // Should be empty due to budget
    });
});
