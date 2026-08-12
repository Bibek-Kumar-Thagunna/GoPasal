import { db } from "@/db";
import { stores, users } from "@/db/schema";
import { eq, desc, sql, or, and, ilike, inArray } from "drizzle-orm";
import { NotFoundError } from "@/utils/errors";
import { createAuditLog } from "@/shared";
import {
    buildStoreApprovedUpdate,
    buildStoreSuspendedUpdate,
} from "../store-governance.util";

export class AdminTenantService {
    async listTenants(
        page = 1,
        limit = 20,
        q?: string,
        lane?: "review" | "active" | "suspended"
    ) {
        const safePage = Math.max(1, page);
        const safeLimit = Math.min(100, Math.max(1, limit));
        const offset = (safePage - 1) * safeLimit;
        const term = q?.trim();

        const laneClause =
            lane === "review"
                ? or(
                      eq(stores.verificationStep, "UNDER_REVIEW"),
                      eq(stores.verificationStep, "PENDING_REVIEW"),
                      eq(stores.status, "PENDING"),
                      eq(stores.status, "PENDING_APPROVAL")
                  )
                : lane === "active"
                  ? eq(stores.status, "ACTIVE")
                  : lane === "suspended"
                    ? eq(stores.status, "SUSPENDED")
                    : undefined;

        const searchClause = term
            ? or(
                  ilike(stores.name, `%${term}%`),
                  ilike(stores.slug, `%${term}%`),
                  ilike(stores.phone, `%${term}%`),
                  ilike(users.name, `%${term}%`),
                  ilike(users.phone, `%${term}%`),
                  ilike(users.email, `%${term}%`)
              )
            : undefined;

        let matchingIds: string[] | null = null;
        if (searchClause || laneClause) {
            const rows = await db
                .select({ id: stores.id })
                .from(stores)
                .leftJoin(users, eq(stores.ownerId, users.id))
                .where(
                    and(
                        ...(searchClause ? [searchClause] : []),
                        ...(laneClause ? [laneClause] : [])
                    )
                );
            matchingIds = rows.map((r) => r.id);
            if (matchingIds.length === 0) {
                return { items: [], total: 0, page: safePage, limit: safeLimit };
            }
        }

        const [countRow] = await db
            .select({ total: sql<number>`count(*)::int`.mapWith(Number) })
            .from(stores)
            .where(matchingIds ? inArray(stores.id, matchingIds) : undefined);

        const items = await db.query.stores.findMany({
            where: matchingIds ? inArray(stores.id, matchingIds) : undefined,
            limit: safeLimit,
            offset,
            orderBy: desc(stores.createdAt),
            with: {
                owner: {
                    columns: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });

        return {
            items,
            total: countRow?.total ?? 0,
            page: safePage,
            limit: safeLimit,
        };
    }

    async getTenantDetails(storeId: string) {
        const tenant = await db.query.stores.findFirst({
            where: eq(stores.id, storeId),
            with: {
                owner: true,
                products: { limit: 5 }, // Just a preview
            }
        });
        if (!tenant) throw new NotFoundError("Tenant not found");
        return tenant;
    }

    async updateStatus(storeId: string, status: string, notes: string | undefined, adminUserId: string) {
        const [existing] = await db.select().from(stores).where(eq(stores.id, storeId));
        if (!existing) throw new NotFoundError("Tenant not found");

        let patch: Record<string, unknown> = {
            status,
            adminNotes: notes,
            updatedAt: new Date(),
        };

        if (status === "ACTIVE") {
            patch = { ...patch, ...buildStoreApprovedUpdate() };
        } else if (status === "SUSPENDED") {
            patch = { ...patch, ...buildStoreSuspendedUpdate() };
        } else if (status === "TERMINATED" || status === "CREATED") {
            patch = { ...patch, isOpen: false };
        }

        const [updated] = await db
            .update(stores)
            .set(patch as typeof stores.$inferInsert)
            .where(eq(stores.id, storeId))
            .returning();

        await createAuditLog({
            actorId: adminUserId,
            action: "UPDATE_TENANT_STATUS",
            resource: "stores",
            resourceId: storeId,
            metadata: { status, notes },
            beforeState: { status: existing.status, verificationStep: existing.verificationStep },
            afterState: patch,
        });

        return updated;
    }

    async updateCommission(storeId: string, rate: number, adminUserId: string) {
        const [updated] = await db
            .update(stores)
            .set({
                commissionRate: rate,
                updatedAt: new Date()
            })
            .where(eq(stores.id, storeId))
            .returning();

        if (!updated) throw new NotFoundError("Tenant not found");

        await createAuditLog({
            actorId: adminUserId,
            action: "UPDATE_COMMISSION",
            resource: "stores",
            resourceId: storeId,
            metadata: { rate }
        });

        return updated;
    }
}

export const adminTenantService = new AdminTenantService();
