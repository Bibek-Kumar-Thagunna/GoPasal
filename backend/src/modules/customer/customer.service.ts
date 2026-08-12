import { db } from "@/db";
import { users, addresses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateId, NotFoundError } from "@/utils";
import { createAuditLog } from "@/shared";

export class CustomerService {
    async getProfile(userId: string) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        return user;
    }

    async updateProfile(
        userId: string,
        data: { name?: string; email?: string; avatarUrl?: string; pushToken?: string }
    ) {
        const [existing] = await db
            .select()
            .from(users)
            .where(eq(users.id, userId));
        if (!existing) throw new NotFoundError("User");

        const [updated] = await db
            .update(users)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(users.id, userId))
            .returning();

        await createAuditLog({
            actorId: userId,
            action: "UPDATE",
            resource: "users",
            resourceId: userId,
            beforeState: existing,
            afterState: updated,
        });

        return updated;
    }

    // --- Addresses ---

    async listAddresses(userId: string) {
        return db
            .select()
            .from(addresses)
            .where(eq(addresses.userId, userId))
            .orderBy(addresses.createdAt);
    }

    async addAddress(
        userId: string,
        data: {
            label: string;
            addressLine: string;
            city: string;
            landmark?: string;
            latitude: number;
            longitude: number;
            isDefault?: boolean;
            contactName?: string;
            contactPhone?: string;
            buildingName?: string;
            floor?: string;
        }
    ) {
        // If setting as default, unset other defaults
        if (data.isDefault) {
            await db
                .update(addresses)
                .set({ isDefault: false, updatedAt: new Date() })
                .where(eq(addresses.userId, userId));
        }

        const id = generateId();
        const [address] = await db
            .insert(addresses)
            .values({ id, userId, ...data })
            .returning();

        await createAuditLog({
            actorId: userId,
            action: "CREATE",
            resource: "addresses",
            resourceId: id,
            afterState: data,
        });

        return address;
    }

    async updateAddress(
        userId: string,
        addressId: string,
        data: {
            label?: string;
            addressLine?: string;
            city?: string;
            landmark?: string;
            latitude?: number;
            longitude?: number;
            isDefault?: boolean;
            contactName?: string;
            contactPhone?: string;
            buildingName?: string;
            floor?: string;
        }
    ) {
        const [existing] = await db
            .select()
            .from(addresses)
            .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)));

        if (!existing) throw new NotFoundError("Address");

        if (data.isDefault) {
            await db
                .update(addresses)
                .set({ isDefault: false, updatedAt: new Date() })
                .where(eq(addresses.userId, userId));
        }

        const [updated] = await db
            .update(addresses)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(addresses.id, addressId))
            .returning();

        await createAuditLog({
            actorId: userId,
            action: "UPDATE",
            resource: "addresses",
            resourceId: addressId,
            beforeState: existing,
            afterState: updated,
        });

        return updated;
    }

    async deleteAddress(userId: string, addressId: string) {
        const [existing] = await db
            .select()
            .from(addresses)
            .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)));

        if (!existing) throw new NotFoundError("Address");

        await db.delete(addresses).where(eq(addresses.id, addressId));

        await createAuditLog({
            actorId: userId,
            action: "DELETE",
            resource: "addresses",
            resourceId: addressId,
            beforeState: existing,
        });
    }
}
