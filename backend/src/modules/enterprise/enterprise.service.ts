import { db } from "@/db";
import { masterMerchants, riderTiers, riders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateId, NotFoundError } from "@/utils";

export class EnterpriseService {
    // --- Master Merchant ---
    async createMasterMerchant(ownerId: string, name: string) {
        const id = generateId();
        const [mm] = await db.insert(masterMerchants).values({
            id,
            ownerId,
            name,
            branchIds: [],
        }).returning();
        return mm;
    }

    async addBranchToMaster(masterId: string, storeId: string) {
        // Add storeId to branchIds array
        // Simplified: Fetch, update array, save. 
        // Real app: Use array_append if database supports, or separate relation table
        const [mm] = await db.select().from(masterMerchants).where(eq(masterMerchants.id, masterId));
        if (!mm) throw new NotFoundError("Master Merchant not found");

        const branches = mm.branchIds || [];
        if (!branches.includes(storeId)) {
            branches.push(storeId);
            await db.update(masterMerchants).set({ branchIds: branches, updatedAt: new Date() }).where(eq(masterMerchants.id, masterId));
        }
        return { success: true };
    }

    // --- Rider Tiers ---
    async updateRiderTier(riderId: string, monthlyOrders: number, rating: number) {
        // Calculate Tier
        let tier = "BRONZE";
        if (monthlyOrders > 100 && rating > 900) tier = "DIAMOND";
        else if (monthlyOrders > 50 && rating > 800) tier = "GOLD";
        else if (monthlyOrders > 20) tier = "SILVER";

        // Update riderTiers table
        const [existing] = await db.select().from(riderTiers).where(eq(riderTiers.riderId, riderId));
        if (existing) {
            await db.update(riderTiers).set({ tier: tier as any, monthlyOrders, rating, updatedAt: new Date() }).where(eq(riderTiers.id, existing.id));
        } else {
            await db.insert(riderTiers).values({ id: generateId(), riderId, tier: tier as any, monthlyOrders, rating });
        }

        // Sync with Riders table
        await db.update(riders).set({ tier }).where(eq(riders.id, riderId));
    }
}

export const enterpriseService = new EnterpriseService();
