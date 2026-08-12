import { db } from "@/db";
import {
    roles,
    permissions,
    rolePermissions,
    userRoles,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
    generateId,
    NotFoundError,
    ConflictError,
    
} from "@/utils";
import { createAuditLog } from "@/shared";

export class RbacService {
    // --- Roles ---

    async listRoles() {
        return db.select().from(roles);
    }

    async getRoleById(id: string) {
        const [role] = await db.select().from(roles).where(eq(roles.id, id));
        if (!role) throw new NotFoundError("Role");
        return role;
    }

    async createRole(name: string, description?: string, actorId?: string) {
        const existing = await db
            .select()
            .from(roles)
            .where(eq(roles.name, name));
        if (existing.length > 0) throw new ConflictError("Role already exists");

        const id = generateId();
        const [role] = await db
            .insert(roles)
            .values({ id, name, description })
            .returning();

        await createAuditLog({
            actorId,
            action: "CREATE",
            resource: "roles",
            resourceId: id,
            afterState: { name, description },
        });

        return role;
    }

    async updateRole(
        id: string,
        data: { name?: string; description?: string },
        actorId?: string
    ) {
        const existing = await this.getRoleById(id);

        const [updated] = await db
            .update(roles)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(roles.id, id))
            .returning();

        await createAuditLog({
            actorId,
            action: "UPDATE",
            resource: "roles",
            resourceId: id,
            beforeState: existing,
            afterState: updated,
        });

        return updated;
    }

    async deleteRole(id: string, actorId?: string) {
        const existing = await this.getRoleById(id);

        await db.delete(roles).where(eq(roles.id, id));

        await createAuditLog({
            actorId,
            action: "DELETE",
            resource: "roles",
            resourceId: id,
            beforeState: existing,
        });
    }

    // --- Permissions ---

    async listPermissions() {
        return db.select().from(permissions);
    }

    async getPermissionById(id: string) {
        const [perm] = await db
            .select()
            .from(permissions)
            .where(eq(permissions.id, id));
        if (!perm) throw new NotFoundError("Permission");
        return perm;
    }

    async createPermission(
        data: { name: string; resource: string; action: string; description?: string },
        actorId?: string
    ) {
        const existing = await db
            .select()
            .from(permissions)
            .where(eq(permissions.name, data.name));
        if (existing.length > 0) throw new ConflictError("Permission already exists");

        const id = generateId();
        const [perm] = await db
            .insert(permissions)
            .values({ id, ...data })
            .returning();

        await createAuditLog({
            actorId,
            action: "CREATE",
            resource: "permissions",
            resourceId: id,
            afterState: data,
        });

        return perm;
    }

    // --- Role-Permission Assignments ---

    async getRolePermissions(roleId: string) {
        await this.getRoleById(roleId);

        return db
            .select({
                id: permissions.id,
                name: permissions.name,
                resource: permissions.resource,
                action: permissions.action,
                description: permissions.description,
            })
            .from(rolePermissions)
            .innerJoin(
                permissions,
                eq(rolePermissions.permissionId, permissions.id)
            )
            .where(eq(rolePermissions.roleId, roleId));
    }

    async assignPermissionToRole(
        roleId: string,
        permissionId: string,
        actorId?: string
    ) {
        await this.getRoleById(roleId);
        await this.getPermissionById(permissionId);

        const existing = await db
            .select()
            .from(rolePermissions)
            .where(
                and(
                    eq(rolePermissions.roleId, roleId),
                    eq(rolePermissions.permissionId, permissionId)
                )
            );

        if (existing.length > 0) return;

        await db
            .insert(rolePermissions)
            .values({ roleId, permissionId });

        await createAuditLog({
            actorId,
            action: "PERMISSION_CHANGE",
            resource: "role_permissions",
            metadata: { roleId, permissionId, operation: "assign" },
        });
    }

    async removePermissionFromRole(
        roleId: string,
        permissionId: string,
        actorId?: string
    ) {
        await db
            .delete(rolePermissions)
            .where(
                and(
                    eq(rolePermissions.roleId, roleId),
                    eq(rolePermissions.permissionId, permissionId)
                )
            );

        await createAuditLog({
            actorId,
            action: "PERMISSION_CHANGE",
            resource: "role_permissions",
            metadata: { roleId, permissionId, operation: "remove" },
        });
    }

    // --- User-Role Assignments ---

    async getUserRoles(userId: string) {
        return db
            .select({
                roleId: roles.id,
                roleName: roles.name,
                tenantId: userRoles.tenantId,
            })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, userId));
    }

    async assignRoleToUser(
        userId: string,
        roleId: string,
        tenantId?: string,
        actorId?: string
    ) {
        await this.getRoleById(roleId);

        const existing = await db
            .select()
            .from(userRoles)
            .where(
                and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId))
            );

        if (existing.length > 0) return;

        await db.insert(userRoles).values({ userId, roleId, tenantId });

        await createAuditLog({
            actorId,
            action: "ROLE_ASSIGN",
            resource: "user_roles",
            metadata: { userId, roleId, tenantId },
        });
    }

    async removeRoleFromUser(
        userId: string,
        roleId: string,
        actorId?: string
    ) {
        await db
            .delete(userRoles)
            .where(
                and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId))
            );

        await createAuditLog({
            actorId,
            action: "ROLE_REVOKE",
            resource: "user_roles",
            metadata: { userId, roleId },
        });
    }
}
