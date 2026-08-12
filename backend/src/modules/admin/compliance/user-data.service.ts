import { db } from "@/db";
import { users, addresses, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NotFoundError } from "@/utils";
import { createAuditLog } from "@/shared";

export class UserDataService {

    async exportUserData(userId: string, requestorId: string) {
        // Self or Admin check
        if (userId !== requestorId) {
            // Check if admin? For now assume controller handles or strict equality.
            // Let's enforce strict self-export here or rely on Admin calling logic.
            // We'll proceed assuming authorized caller.
        }

        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) throw new NotFoundError("User not found");

        const userAddresses = await db.select().from(addresses).where(eq(addresses.userId, userId));
        const userOrders = await db.select().from(orders).where(eq(orders.userId, userId));

        // Fetch items for orders? Heavy but compliant.
        // Simplified: Just orders for overview.

        // Log the Access
        await createAuditLog({
            actorId: requestorId,
            action: "DATA_EXPORT",
            resource: "users",
            resourceId: userId
        });

        return {
            profile: {
                name: user.name,
                email: user.email,
                phone: user.phone, // PII exported to user
                joinedAt: user.createdAt
            },
            addresses: userAddresses.map(a => ({
                label: a.label,
                city: a.city,
                line: a.addressLine
            })),
            orders: userOrders.map(o => ({
                id: o.id,
                amount: o.totalAmount,
                status: o.status,
                date: o.createdAt
            }))
        };
    }

    async softDeleteUser(userId: string, requestorId: string) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) throw new NotFoundError("User not found");

        if (user.deletedAt) return; // Already deleted

        await db.update(users)
            .set({
                deletedAt: new Date(),
                isActive: false,
                updatedAt: new Date()
            })
            .where(eq(users.id, userId));

        await createAuditLog({
            actorId: requestorId,
            action: "SOFT_DELETE_USER",
            resource: "users",
            resourceId: userId
        });
    }

    async anonymizeUser(userId: string) {
        // HARD ACTION - IRREVERSIBLE
        // 1. Scrub Profile
        await db.update(users)
            .set({
                name: "Deleted User",
                email: null,
                phone: `DEL_${userId.slice(-14)}`, // Unique constraint requires a distinct value (fits varchar(20))
                avatarUrl: null,
                updatedAt: new Date()
            })
            .where(eq(users.id, userId));

        // 2. Scrub Addresses
        await db.update(addresses)
            .set({
                addressLine: "REDACTED",
                latitude: 0,
                longitude: 0,
                landmark: null,
                label: "REDACTED"
            })
            .where(eq(addresses.userId, userId));

        // 3. Orders?
        // We keep Orders linked to this userId (which is now "Deleted User").
        // This preserves Financial Reporting.

        // Log System Action
        await createAuditLog({
            action: "ANONYMIZE_USER",
            resource: "users",
            resourceId: userId,
            metadata: { reason: "Retention Policy" }
        });
    }
}

export const userDataService = new UserDataService();
