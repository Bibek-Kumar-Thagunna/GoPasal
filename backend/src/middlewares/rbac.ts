import { Elysia } from "elysia";
import { ForbiddenError } from "@/utils/errors";
import { db } from "@/db";
import { userRoles, rolePermissions, permissions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { UserRole, AuthContext } from "@/types";

export function requireRole(...allowedRoles: UserRole[]) {
    return new Elysia({ name: `rbac-role-${allowedRoles.join("-")}` }).derive(
        { as: "scoped" },
        (context: any) => {
            const auth = context.auth as AuthContext | undefined;
            if (!auth) {
                throw new ForbiddenError("Authentication required");
            }

            const hasRole = auth.roles.some((role) =>
                allowedRoles.includes(role as UserRole)
            );

            if (!hasRole) {
                throw new ForbiddenError(
                    `Requires one of: ${allowedRoles.join(", ")}`
                );
            }

            return {};
        }
    );
}

export async function checkPermission(
    userId: string,
    permissionName: string
): Promise<boolean> {
    const result = await db
        .select({ permName: permissions.name })
        .from(userRoles)
        .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
        .innerJoin(
            permissions,
            eq(rolePermissions.permissionId, permissions.id)
        )
        .where(
            and(
                eq(userRoles.userId, userId),
                eq(permissions.name, permissionName)
            )
        )
        .limit(1);

    return result.length > 0;
}

export function requirePermission(permissionName: string) {
    return new Elysia({ name: `rbac-perm-${permissionName}` }).derive(
        { as: "scoped" },
        async (context: any) => {
            const auth = context.auth as AuthContext | undefined;
            if (!auth) {
                throw new ForbiddenError("Authentication required");
            }

            if (auth.roles.includes("SUPER_ADMIN")) {
                return {};
            }

            const allowed = await checkPermission(auth.userId, permissionName);
            if (!allowed) {
                throw new ForbiddenError(`Missing permission: ${permissionName}`);
            }

            return {};
        }
    );
}
