import { db } from "@/db";
import { featureFlags } from "@/db/schema/feature-flags";
import { eq, and, isNull } from "drizzle-orm";
import { generateId } from "@/utils";

export class FeatureFlagService {
    async isEnabled(key: string, env: string = "production", tenantId?: string): Promise<boolean> {
        // Check Tenant Specific Flag
        if (tenantId) {
            const [tenantFlag] = await db
                .select()
                .from(featureFlags)
                .where(
                    and(
                        eq(featureFlags.key, key),
                        eq(featureFlags.env, env),
                        eq(featureFlags.tenantId, tenantId)
                    )
                );
            if (tenantFlag) return tenantFlag.isEnabled;
        }

        // Check Global Flag
        const [globalFlag] = await db
            .select()
            .from(featureFlags)
            .where(
                and(
                    eq(featureFlags.key, key),
                    eq(featureFlags.env, env),
                    isNull(featureFlags.tenantId)
                )
            );

        return globalFlag?.isEnabled ?? false;
    }

    async setFlag(key: string, isEnabled: boolean, env: string = "production", tenantId?: string) {
        // Upsert logic would be ideal, but for now simple insert/update check
        const existing = await this.getFlag(key, env, tenantId);

        if (existing) {
            await db
                .update(featureFlags)
                .set({ isEnabled, updatedAt: new Date() })
                .where(eq(featureFlags.id, existing.id));
            return;
        }

        await db.insert(featureFlags).values({
            id: generateId(),
            key,
            isEnabled,
            env,
            tenantId,
        });
    }

    private async getFlag(key: string, env: string, tenantId?: string) {
        const conditions = [
            eq(featureFlags.key, key),
            eq(featureFlags.env, env)
        ];

        if (tenantId) {
            conditions.push(eq(featureFlags.tenantId, tenantId));
        } else {
            conditions.push(isNull(featureFlags.tenantId));
        }

        const [flag] = await db
            .select()
            .from(featureFlags)
            .where(and(...conditions));
        return flag;
    }
}

export const featureFlagService = new FeatureFlagService();
