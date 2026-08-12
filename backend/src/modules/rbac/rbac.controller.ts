import { Elysia, t } from "elysia";
import { requireAuth, requireRole } from "@/middlewares";
import { RbacService } from "./rbac.service";
import { success, created } from "@/utils";

const rbacService = new RbacService();

export const rbacController = new Elysia({ prefix: "/api/v1/rbac" })
    .use(requireAuth())
    .use(requireRole("SUPER_ADMIN", "PLATFORM_OPERATOR"))

    // --- Roles ---
    .get(
        "/roles",
        async () => {
            const result = await rbacService.listRoles();
            return success(result);
        },
        {
            detail: { tags: ["RBAC"], summary: "List all roles" },
        }
    )
    .get(
        "/roles/:id",
        async ({ params }) => {
            const result = await rbacService.getRoleById(params.id);
            return success(result);
        },
        {
            params: t.Object({ id: t.String() }),
            detail: { tags: ["RBAC"], summary: "Get role by ID" },
        }
    )
    .post(
        "/roles",
        async ({ body, auth, set }) => {
            const result = await rbacService.createRole(
                body.name,
                body.description,
                auth.userId
            );
            set.status = 201;
            return created(result);
        },
        {
            body: t.Object({
                name: t.String({ minLength: 2, maxLength: 100 }),
                description: t.Optional(t.String()),
            }),
            detail: { tags: ["RBAC"], summary: "Create a new role" },
        }
    )
    .put(
        "/roles/:id",
        async ({ params, body, auth }) => {
            const result = await rbacService.updateRole(params.id, body, auth.userId);
            return success(result);
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({
                name: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
                description: t.Optional(t.String()),
            }),
            detail: { tags: ["RBAC"], summary: "Update a role" },
        }
    )
    .delete(
        "/roles/:id",
        async ({ params, auth }) => {
            await rbacService.deleteRole(params.id, auth.userId);
            return success({ message: "Role deleted" });
        },
        {
            params: t.Object({ id: t.String() }),
            detail: { tags: ["RBAC"], summary: "Delete a role" },
        }
    )

    // --- Permissions ---
    .get(
        "/permissions",
        async () => {
            const result = await rbacService.listPermissions();
            return success(result);
        },
        {
            detail: { tags: ["RBAC"], summary: "List all permissions" },
        }
    )
    .post(
        "/permissions",
        async ({ body, auth, set }) => {
            const result = await rbacService.createPermission(body, auth.userId);
            set.status = 201;
            return created(result);
        },
        {
            body: t.Object({
                name: t.String({ minLength: 2, maxLength: 100 }),
                resource: t.String({ minLength: 2, maxLength: 100 }),
                action: t.String({ minLength: 2, maxLength: 50 }),
                description: t.Optional(t.String()),
            }),
            detail: { tags: ["RBAC"], summary: "Create a new permission" },
        }
    )

    // --- Role-Permission Assignments ---
    .get(
        "/roles/:id/permissions",
        async ({ params }) => {
            const result = await rbacService.getRolePermissions(params.id);
            return success(result);
        },
        {
            params: t.Object({ id: t.String() }),
            detail: { tags: ["RBAC"], summary: "Get permissions for a role" },
        }
    )
    .post(
        "/roles/:id/permissions",
        async ({ params, body, auth, set }) => {
            await rbacService.assignPermissionToRole(
                params.id,
                body.permissionId,
                auth.userId
            );
            set.status = 201;
            return created({ message: "Permission assigned to role" });
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({
                permissionId: t.String(),
            }),
            detail: { tags: ["RBAC"], summary: "Assign permission to role" },
        }
    )
    .delete(
        "/roles/:id/permissions/:permissionId",
        async ({ params, auth }) => {
            await rbacService.removePermissionFromRole(
                params.id,
                params.permissionId,
                auth.userId
            );
            return success({ message: "Permission removed from role" });
        },
        {
            params: t.Object({
                id: t.String(),
                permissionId: t.String(),
            }),
            detail: { tags: ["RBAC"], summary: "Remove permission from role" },
        }
    )

    // --- User-Role Assignments ---
    .get(
        "/users/:userId/roles",
        async ({ params }) => {
            const result = await rbacService.getUserRoles(params.userId);
            return success(result);
        },
        {
            params: t.Object({ userId: t.String() }),
            detail: { tags: ["RBAC"], summary: "Get roles for a user" },
        }
    )
    .post(
        "/users/:userId/roles",
        async ({ params, body, auth, set }) => {
            await rbacService.assignRoleToUser(
                params.userId,
                body.roleId,
                body.tenantId,
                auth.userId
            );
            set.status = 201;
            return created({ message: "Role assigned to user" });
        },
        {
            params: t.Object({ userId: t.String() }),
            body: t.Object({
                roleId: t.String(),
                tenantId: t.Optional(t.String()),
            }),
            detail: { tags: ["RBAC"], summary: "Assign role to user" },
        }
    )
    .delete(
        "/users/:userId/roles/:roleId",
        async ({ params, auth }) => {
            await rbacService.removeRoleFromUser(
                params.userId,
                params.roleId,
                auth.userId
            );
            return success({ message: "Role removed from user" });
        },
        {
            params: t.Object({
                userId: t.String(),
                roleId: t.String(),
            }),
            detail: { tags: ["RBAC"], summary: "Remove role from user" },
        }
    );
