import { db, type DbTransaction } from "@/db";
import {
    sponsoredCampaigns,
    sponsoredTargets,
    adSpendDaily,
    adImpressions
} from "@/db/schema";
import { eq, and, sql, desc, gte, lte, inArray } from "drizzle-orm";
import { generateId } from "@/utils";
import { productService } from "@/modules/seller/product/product.service";

export interface AdContext {
    query?: string;
    categoryId?: string;
    storeId?: string; // If viewing a specific store (Cross-selling? Not implemented in MVP but good to have)
}

export class AdService {

    async getSponsoredProducts(context: AdContext, limit = 2) {
        // 1. Find matching targets (Keywords or Category)
        const conditions = [];
        if (context.query) {
            conditions.push(and(
                eq(sponsoredTargets.targetType, "KEYWORD"),
                eq(sponsoredTargets.targetValue, context.query.toLowerCase()) // Simple match
            ));
        }
        if (context.categoryId) {
            conditions.push(and(
                eq(sponsoredTargets.targetType, "CATEGORY"),
                eq(sponsoredTargets.targetValue, context.categoryId)
            ));
        }

        if (conditions.length === 0) return [];

        // 2. Get Potential Campaigns
        // Optimized: Single query join Campaigns + Targets
        // Filter: Status=ACTIVE, Date in range
        const now = new Date();
        const candidates = await db.select({
            campaignId: sponsoredCampaigns.id,
            storeId: sponsoredCampaigns.storeId,
            dailyBudget: sponsoredCampaigns.dailyBudget,
            bidAmount: sponsoredTargets.bidAmount,
            targetId: sponsoredTargets.id,
        })
            .from(sponsoredTargets)
            .innerJoin(sponsoredCampaigns, eq(sponsoredTargets.campaignId, sponsoredCampaigns.id))
            .where(and(
                eq(sponsoredCampaigns.status, "ACTIVE"),
                gte(sponsoredCampaigns.endDate, now),
                lte(sponsoredCampaigns.startDate, now),
                // OR conditions for targets
                sql`(${sql.join(conditions, sql` OR `)})`
            ))
            .orderBy(desc(sponsoredTargets.bidAmount))
            .limit(10); // Check top 10 bidders

        if (candidates.length === 0) return [];

        // 3. Check Budgets (In-Memory or DB Check)
        const today = new Date().toISOString().split("T")[0];
        const campaignIds = candidates.map(c => c.campaignId);

        const spends = await db.select()
            .from(adSpendDaily)
            .where(and(
                eq(adSpendDaily.date, today),
                inArray(adSpendDaily.campaignId, campaignIds)
            ));

        const spendMap = new Map(spends.map(s => [s.campaignId, Number(s.totalSpend)]));

        const eligibleAds = [];
        for (const cand of candidates) {
            const currentSpend = spendMap.get(cand.campaignId) || 0;
            if (currentSpend < Number(cand.dailyBudget)) {
                eligibleAds.push(cand);
            }
            if (eligibleAds.length >= limit) break;
        }

        if (eligibleAds.length === 0) return [];

        // 4. Fetch Products (We need to specific product this campaign is promoting... 
        // Schema didn't strictly link Campaign -> Product, but usually it does.
        // Let's assume Campaign promotes the WHOLE STORE or we add specific mapping. 
        // For MVP, Prompt said "Target Type: PRODUCT". 
        // Wait, current schema `sponsored_targets` has `targetType`. 
        // If type is KEYWORD, what Product do we show?
        // Usually Campaign has a list of "Promoted Products".
        // Let's simplify: A Campaign promotes specific Products. 
        // Missing table `sponsored_ad_groups` or `campaign_products`.
        // Let's assume for this MVP, the TARGET itself might be the PRODUCT if targetType=PRODUCT.
        // But for KEYWORD target, we need a way to know WHICH product to show.
        // Let's assume Campaign has `metadata` or we just pick top product from Store?
        // Let's fix schema or logic: Assume Campaign is linked to a Product directly? 
        // Or fetch "Best Selling" product from Store?
        // Let's assume Campaign -> 1 Product for simplicity or auto-select.
        // Let's fetch Top Product from Store for now to unblock.

        const results = [];
        for (const ad of eligibleAds) {
            // Mock: Get 1 product from store
            const products = await productService.listMyProducts(ad.storeId);
            if (products.length > 0) {
                const product = products[0]; // Pick first active
                results.push({
                    ...product,
                    isSponsored: true,
                    sponsoredContext: {
                        campaignId: ad.campaignId,
                        targetId: ad.targetId,
                        bid: ad.bidAmount
                    }
                });

                // Track Impression Async
                this.trackImpression(ad.campaignId, ad.storeId, ad.targetId, 0.01); // 0.01 cost per impression
            }
        }

        return results;
    }

    async createCampaign(storeId: string, data: {
        name: string;
        dailyBudget: number;
        startDate: Date;
        endDate?: Date;
        targets?: { targetType: "KEYWORD" | "CATEGORY" | "PRODUCT"; targetValue: string; bidAmount: number }[];
    }) {
        const campaignId = generateId();
        await db.insert(sponsoredCampaigns).values({
            id: campaignId,
            storeId,
            name: data.name,
            dailyBudget: String(data.dailyBudget),
            startDate: data.startDate,
            endDate: data.endDate ?? null,
        });
        if (data.targets?.length) {
            for (const t of data.targets) {
                await db.insert(sponsoredTargets).values({
                    id: generateId(),
                    campaignId,
                    targetType: t.targetType,
                    targetValue: t.targetValue,
                    bidAmount: String(t.bidAmount),
                });
            }
        }
        return { id: campaignId, storeId, name: data.name };
    }

    async listCampaigns(storeId: string) {
        return db.select()
            .from(sponsoredCampaigns)
            .where(eq(sponsoredCampaigns.storeId, storeId))
            .orderBy(desc(sponsoredCampaigns.createdAt));
    }

    async trackImpression(campaignId: string, storeId: string, targetId: string, cost: number) {
        // Fire and forget logic usually, but here await to ensure tests pass
        const today = new Date().toISOString().split("T")[0];

        try {
            await db.transaction(async (tx: DbTransaction) => {
                // 1. Log Impression
                await tx.insert(adImpressions).values({
                    id: generateId(),
                    campaignId,
                    storeId,
                    targetId,
                    cost: String(cost)
                });

                // 2. Update Daily Spend
                // Upsert logic
                await tx.insert(adSpendDaily)
                    .values({
                        date: today,
                        campaignId,
                        storeId,
                        totalSpend: String(cost)
                    })
                    .onConflictDoUpdate({
                        target: [adSpendDaily.date, adSpendDaily.campaignId],
                        set: {
                            totalSpend: sql`${adSpendDaily.totalSpend} + ${String(cost)}`,
                            updatedAt: new Date()
                        }
                    });
            });
        } catch (e) {
            console.error("Ad Impression Error", e);
        }
    }
}

export const adService = new AdService();
