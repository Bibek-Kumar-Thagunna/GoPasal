import { db } from "@/db";
import { systemConfigs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createAuditLog } from "@/shared";
import { NotFoundError } from "@/utils/errors";

export class AdminConfigService {
    async listConfigs() {
        return await db.select().from(systemConfigs);
    }

    async updateConfig(key: string, value: any, description: string | undefined, adminUserId: string) {
        // Upsert
        const [existing] = await db.select().from(systemConfigs).where(eq(systemConfigs.key, key));

        let updated;
        if (existing) {
            [updated] = await db
                .update(systemConfigs)
                .set({
                    value,
                    description: description || existing.description,
                    updatedBy: adminUserId,
                    updatedAt: new Date(),
                })
                .where(eq(systemConfigs.key, key))
                .returning();

            await createAuditLog({
                actorId: adminUserId, action: "UPDATE_CONFIG", resource: "system_configs", resourceId: key, metadata: { value }
            });
        } else {
            [updated] = await db
                .insert(systemConfigs)
                .values({
                    key,
                    value,
                    description,
                    updatedBy: adminUserId,
                })
                .returning();

            await createAuditLog({
                actorId: adminUserId, action: "CREATE_CONFIG", resource: "system_configs", resourceId: key, metadata: { value }
            });
        }

        return updated;
    }

    async getConfig(key: string) {
        const [config] = await db.select().from(systemConfigs).where(eq(systemConfigs.key, key));
        if (!config) throw new NotFoundError("Config not found");
        return config;
    }
}

export const adminConfigService = new AdminConfigService();
