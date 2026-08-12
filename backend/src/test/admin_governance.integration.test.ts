import { describe, expect, it, beforeAll } from "bun:test";
import { adminService } from "@/modules/admin/admin.service";
import { db } from "@/db";
import { stores, auditLogs, users } from "@/db/schema";
import { generateId } from "@/utils";
import { eq, desc } from "drizzle-orm"; // Fixed import

describe("Admin Governance System", () => {
    let storeId: string;
    let adminId: string;

    beforeAll(async () => {
        storeId = "store_gov_" + generateId();
        adminId = "admin_gov_" + generateId();
        const ownerId = "owner_gov_" + generateId();

        // Seed User (owner)
        await db.insert(users).values({
            id: ownerId,
            name: "Governance Store Owner",
            email: "govowner_" + generateId() + "@test.com",
            role: "SELLER",
            phone: "98" + generateId().substring(0, 8)
        } as any);

        // Create a dummy store
        await db.insert(stores).values({
            id: storeId,
            ownerId: ownerId,
            name: "Governance Store",
            slug: storeId,
            status: "PENDING"
        } as any);
    });

    it("should approve seller and log audit", async () => {
        await adminService.approveSeller(storeId, adminId);

        // Verify Status
        const [store] = await db.select().from(stores).where(eq(stores.id, storeId));
        expect(store.status).toBe("ACTIVE");

        // Verify Audit Log
        const [log] = await db.select().from(auditLogs)
            .where(eq(auditLogs.resourceId, storeId))
            .orderBy(desc(auditLogs.createdAt)) // Fixed sorting
            .limit(1);

        expect(log).toBeDefined();
        expect(log.action).toBe("APPROVE_SELLER");
        expect(log.actorId).toBe(adminId);
    });

    it("should suspend seller and log audit", async () => {
        await adminService.suspendSeller(storeId, "Violation of terms", adminId);

        // Verify Status
        const [store] = await db.select().from(stores).where(eq(stores.id, storeId));
        expect(store.status).toBe("SUSPENDED");

        // Verify Audit Log
        const [log] = await db.select().from(auditLogs)
            .where(eq(auditLogs.resourceId, storeId))
            .orderBy(desc(auditLogs.createdAt))
            .limit(1);

        expect(log.action).toBe("SUSPEND_SELLER");
        expect(log.metadata).toEqual({ reason: "Violation of terms" });
    });

    // Note: Refund/Settlement integration tests covered in respective service tests.
    // Here we primarily test proper delegation and logging wrapper.
});
