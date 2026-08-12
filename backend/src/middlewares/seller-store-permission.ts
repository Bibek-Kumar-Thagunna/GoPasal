import { Elysia } from "elysia";
import { storeService } from "@/modules/seller/store/store.service";
import { sellerPermissionService } from "@/modules/seller/permissions/seller-permission.service";
import type { SellerPermission } from "@/modules/seller/permissions/seller-permission.types";
import type { AuthContext } from "@/types";
import { ForbiddenError } from "@/utils/errors";

export function enforceSellerTenantMembership() {
    return new Elysia().derive(
        { as: "scoped" },
        async (context: any): Promise<{}> => {
            const auth = context.auth as AuthContext | undefined;
            const tenantId = context.tenantId as string | undefined;
            if (!auth?.userId || !tenantId) {
                return {};
            }
            await storeService.assertUserCanAccessStore(auth.userId, tenantId);
            return {};
        }
    );
}

/** Chain after `requireAuth` + `requireTenant()`. Enforces active membership and store-scoped permission. */
export function requireSellerPermission(permission: SellerPermission) {
    return new Elysia().derive(
        { as: "scoped" },
        async (context: any): Promise<{}> => {
            const auth = context.auth as AuthContext | undefined;
            const tenantId = context.tenantId as string | undefined;
            if (!auth?.userId || !tenantId) {
                return {};
            }
            await storeService.assertUserCanAccessStore(auth.userId, tenantId);
            await sellerPermissionService.assertStorePermission(
                auth.userId,
                tenantId,
                permission
            );
            return {};
        }
    );
}

export function requireSellerPrincipal() {
    return new Elysia().derive(
        { as: "scoped" },
        (context: any): {} => {
            const auth = context.auth as AuthContext | undefined;
            if (!auth?.userId) {
                return {};
            }
            const roles = auth.roles ?? [];
            const ok =
                roles.includes("SELLER_OWNER") || roles.includes("SELLER_STAFF");
            if (!ok) {
                throw new ForbiddenError("Access denied");
            }
            return {};
        }
    );
}
