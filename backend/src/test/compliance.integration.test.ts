import { describe, expect, it, beforeAll } from "bun:test";
import { userDataService } from "@/modules/admin/compliance/user-data.service";
import { retentionService } from "@/modules/admin/compliance/retention.service"; // Fixed import
import { db } from "@/db";
import { users, addresses } from "@/db/schema";
import { generateId } from "@/utils";
import { eq } from "drizzle-orm";

describe("Data Privacy & Compliance", () => {
    let userId: string;
    let userPhone: string;

    beforeAll(async () => {
        userId = "privacy_user_" + generateId();
        userPhone = "98" + generateId().substring(0, 8); // Unique test phone

        // Create User
        await db.insert(users).values({
            id: userId,
            phone: userPhone,
            name: "Privacy Test User",
            email: "test@privacy.com",
            isActive: true
        } as any);

        // Create Address
        await db.insert(addresses).values({
            id: generateId(),
            userId,
            label: "Home",
            addressLine: "Test St",
            city: "Ktm",
            latitude: 27.0,
            longitude: 85.0
        } as any);
    });

    it("should export user data correctly", async () => {
        const data = await userDataService.exportUserData(userId, userId);

        expect(data.profile.phone).toBe(userPhone);
        expect(data.addresses.length).toBe(1);
        expect(data.addresses[0].line).toBe("Test St");
    });

    it("should soft delete user", async () => {
        await userDataService.softDeleteUser(userId, userId);
        const [u] = await db.select().from(users).where(eq(users.id, userId));
        expect(u.deletedAt).toBeDefined();
        expect(u.isActive).toBe(false);
    });

    it("should anonymize user (Simulating job)", async () => {
        await userDataService.anonymizeUser(userId);

        const [u] = await db.select().from(users).where(eq(users.id, userId));
        const addrs = await db.select().from(addresses).where(eq(addresses.userId, userId));

        // Check PII Scrubbed
        expect(u.name).toBe("Deleted User");
        expect(u.phone).toContain("DEL_");
        expect(u.email).toBeNull();

        // Check Address Scrubbed
        expect(addrs[0].addressLine).toBe("REDACTED");
    });

    it("should run retention jobs without error", async () => {
        const result = await retentionService.runAllJobs();
        expect(result).toBeDefined();
        // counts might be 0, but shouldn't throw
    });
});
