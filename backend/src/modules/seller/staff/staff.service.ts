import { db } from "@/db";
import { storeStaff, storeStaffRoles, users, roles, userRoles } from "@/db/schema";
import type { StaffRoleKind } from "@/db/schema/staff";
import { eq, and, desc } from "drizzle-orm";
import { generateId, NotFoundError, ConflictError, ValidationError } from "@/utils";

const STAFF_ROLE_VALUES = ["MANAGER", "CASHIER", "PACKER", "DRIVER"] as const;

function normalizeRoles(roles: StaffRoleKind[]): StaffRoleKind[] {
    const seen = new Set<StaffRoleKind>();
    for (const r of roles) {
        if (STAFF_ROLE_VALUES.includes(r as (typeof STAFF_ROLE_VALUES)[number])) {
            seen.add(r);
        }
    }
    return Array.from(seen);
}

export class StaffService {
    async inviteStaff(
        storeId: string,
        phone: string,
        rolesInput: StaffRoleKind[],
        invitedBy: string
    ) {
        const rolesList = normalizeRoles(rolesInput);
        if (rolesList.length === 0) {
            throw new ValidationError("Select at least one role");
        }

        const [user] = await db.select().from(users).where(eq(users.phone, phone));
        if (!user) throw new NotFoundError("User not registered with this phone");

        const [existing] = await db
            .select()
            .from(storeStaff)
            .where(and(eq(storeStaff.storeId, storeId), eq(storeStaff.userId, user.id)));

        if (existing) throw new ConflictError("User is already staff");

        const staffId = generateId();

        await db.transaction(async (tx) => {
            await tx.insert(storeStaff).values({
                id: staffId,
                storeId,
                userId: user.id,
                status: "ACTIVE",
                invitedBy,
            });

            await tx.insert(storeStaffRoles).values(
                rolesList.map((role) => ({
                    id: generateId(),
                    storeStaffId: staffId,
                    role,
                }))
            );
        });

        const [staffRole] = await db.select().from(roles).where(eq(roles.name, "SELLER_STAFF"));
        if (staffRole) {
            await db
                .insert(userRoles)
                .values({
                    userId: user.id,
                    roleId: staffRole.id,
                    tenantId: storeId,
                })
                .onConflictDoUpdate({
                    target: [userRoles.userId, userRoles.roleId],
                    set: { tenantId: storeId },
                });
        }

        return { success: true, staffId };
    }

    async listStaff(storeId: string) {
        return await db.query.storeStaff.findMany({
            where: eq(storeStaff.storeId, storeId),
            with: { user: true, roles: true },
            orderBy: desc(storeStaff.createdAt),
        });
    }

    async setStaffRoles(storeId: string, staffRowId: string, rolesInput: StaffRoleKind[]) {
        const rolesList = normalizeRoles(rolesInput);
        if (rolesList.length === 0) {
            throw new ValidationError("Select at least one role");
        }

        const [row] = await db
            .select()
            .from(storeStaff)
            .where(
                and(eq(storeStaff.id, staffRowId), eq(storeStaff.storeId, storeId))
            )
            .limit(1);

        if (!row) throw new NotFoundError("Staff not found");

        await db.transaction(async (tx) => {
            await tx.delete(storeStaffRoles).where(eq(storeStaffRoles.storeStaffId, staffRowId));
            await tx.insert(storeStaffRoles).values(
                rolesList.map((role) => ({
                    id: generateId(),
                    storeStaffId: staffRowId,
                    role,
                }))
            );
        });

        return { success: true };
    }

    async removeStaff(storeId: string, staffId: string) {
        const res = await db
            .delete(storeStaff)
            .where(and(eq(storeStaff.id, staffId), eq(storeStaff.storeId, storeId)))
            .returning({ id: storeStaff.id });
        if (res.length === 0) throw new NotFoundError("Staff not found");
        return { success: true };
    }
}

export const staffService = new StaffService();
