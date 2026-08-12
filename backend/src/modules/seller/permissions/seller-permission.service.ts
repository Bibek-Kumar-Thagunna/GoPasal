import { db } from "@/db";
import { stores, storeStaff, storeStaffRoles } from "@/db/schema";
import type { StaffRoleKind } from "@/db/schema/staff";
import { eq, and } from "drizzle-orm";
import { ForbiddenError } from "@/utils/errors";
import type { SellerPermission } from "./seller-permission.types";
import { SELLER_PERMISSIONS } from "./seller-permission.types";

const ALL_PERMS = [...SELLER_PERMISSIONS] as SellerPermission[];

const ROLE_MATRIX: Record<StaffRoleKind, SellerPermission[]> = {
    MANAGER: ALL_PERMS,
    CASHIER: [
        "orders.view",
        "orders.manage",
        "products.view",
        "announcements.view",
    ],
    PACKER: [
        "orders.view",
        "orders.manage",
        "products.view",
        "announcements.view",
        "analytics.view",
    ],
    DRIVER: [
        "orders.view",
        "orders.manage",
        "announcements.view",
        "analytics.view",
    ],
};

function unionRolePermissions(roles: StaffRoleKind[]): Set<SellerPermission> {
    const out = new Set<SellerPermission>();
    for (const role of roles) {
        for (const p of ROLE_MATRIX[role] ?? []) {
            out.add(p);
        }
    }
    return out;
}

export class SellerPermissionService {
    async getMembershipContext(
        userId: string,
        storeId: string
    ): Promise<{ isOwner: boolean; staffRoles: StaffRoleKind[] }> {
        if (!storeId?.trim()) {
            throw new ForbiddenError("Store context required");
        }
        const [store] = await db
            .select({ id: stores.id, ownerId: stores.ownerId })
            .from(stores)
            .where(eq(stores.id, storeId))
            .limit(1);

        if (!store) {
            throw new ForbiddenError("Access denied");
        }

        if (store.ownerId === userId) {
            return { isOwner: true, staffRoles: [] };
        }

        const rows = await db
            .select({ role: storeStaffRoles.role })
            .from(storeStaff)
            .innerJoin(
                storeStaffRoles,
                eq(storeStaffRoles.storeStaffId, storeStaff.id)
            )
            .where(
                and(
                    eq(storeStaff.storeId, storeId),
                    eq(storeStaff.userId, userId),
                    eq(storeStaff.status, "ACTIVE")
                )
            );

        const staffRoles = rows.map((r) => r.role as StaffRoleKind);
        return { isOwner: false, staffRoles };
    }

    async assertActiveMembership(userId: string, storeId: string): Promise<void> {
        const ctx = await this.getMembershipContext(userId, storeId);
        if (!ctx.isOwner && ctx.staffRoles.length === 0) {
            throw new ForbiddenError("Access denied");
        }
    }

    async listEffectivePermissions(
        userId: string,
        storeId: string
    ): Promise<SellerPermission[]> {
        const ctx = await this.getMembershipContext(userId, storeId);
        if (ctx.isOwner) {
            return [...ALL_PERMS];
        }
        if (ctx.staffRoles.length === 0) {
            return [];
        }
        return Array.from(unionRolePermissions(ctx.staffRoles)).sort();
    }

    async assertStorePermission(
        userId: string,
        storeId: string,
        permission: SellerPermission
    ): Promise<void> {
        const ctx = await this.getMembershipContext(userId, storeId);
        if (ctx.isOwner) {
            return;
        }
        if (ctx.staffRoles.length === 0) {
            throw new ForbiddenError("Access denied");
        }
        const allowed = unionRolePermissions(ctx.staffRoles);
        if (!allowed.has(permission)) {
            throw new ForbiddenError("Access denied");
        }
    }
}

export const sellerPermissionService = new SellerPermissionService();
