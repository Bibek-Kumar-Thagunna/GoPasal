import { db } from "@/db";
import { users, userRoles, roles } from "@/db/schema";
import { sql, desc, eq, or, ilike, and, isNull, inArray } from "drizzle-orm";
import { NotFoundError } from "@/utils/errors";
import { createAuditLog } from "@/shared";

export class AdminUsersService {
    async listUsers(params: { page: number; limit: number; q?: string }) {
        const page = Math.max(1, params.page);
        const limit = Math.min(100, Math.max(1, params.limit));
        const offset = (page - 1) * limit;

        const q = params.q?.trim();
        const searchCond = q
            ? or(
                  ilike(users.phone, `%${q}%`),
                  ilike(users.email, `%${q}%`),
                  ilike(users.name, `%${q}%`)
              )
            : undefined;

        const whereClause = searchCond
            ? and(isNull(users.deletedAt), searchCond)
            : isNull(users.deletedAt);

        const [countRow] = await db
            .select({ c: sql<number>`count(*)::int`.mapWith(Number) })
            .from(users)
            .where(whereClause);

        const total = countRow?.c ?? 0;

        const rows = await db
            .select({
                id: users.id,
                phone: users.phone,
                email: users.email,
                name: users.name,
                isActive: users.isActive,
                isPhoneVerified: users.isPhoneVerified,
                lastLoginAt: users.lastLoginAt,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(whereClause)
            .orderBy(desc(users.createdAt))
            .limit(limit)
            .offset(offset);

        const ids = rows.map((r) => r.id);
        const roleMap = new Map<string, string[]>();
        if (ids.length > 0) {
            const roleRows = await db
                .select({
                    userId: userRoles.userId,
                    roleName: roles.name,
                })
                .from(userRoles)
                .innerJoin(roles, eq(userRoles.roleId, roles.id))
                .where(inArray(userRoles.userId, ids));

            for (const r of roleRows) {
                const list = roleMap.get(r.userId) ?? [];
                list.push(r.roleName);
                roleMap.set(r.userId, list);
            }
        }

        return {
            items: rows.map((u) => ({
                ...u,
                roles: roleMap.get(u.id) ?? [],
            })),
            total,
            page,
            limit,
        };
    }

    async setUserActive(userId: string, isActive: boolean, adminId: string) {
        const [u] = await db.select().from(users).where(eq(users.id, userId));
        if (!u) throw new NotFoundError("User not found");

        const [updated] = await db
            .update(users)
            .set({ isActive, updatedAt: new Date() })
            .where(eq(users.id, userId))
            .returning();

        await createAuditLog({
            actorId: adminId,
            action: "ADMIN_USER_STATUS",
            resource: "users",
            resourceId: userId,
            metadata: { isActive },
        });

        return updated;
    }
}

export const adminUsersService = new AdminUsersService();
