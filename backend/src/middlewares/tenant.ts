import { Elysia } from "elysia";
import { TenantError } from "@/utils/errors";
import type { AuthContext } from "@/types";

/** Per-route tenant guard. Do not set a static plugin `name` — Elysia dedupes named plugins app-wide. */
export function requireTenant() {
    return new Elysia().derive(
        { as: "scoped" },
        (context: any): { tenantId: string } => {
            const auth = context.auth as AuthContext | undefined;
            if (!auth) {
                throw new TenantError("Authentication required");
            }

            if (!auth.tenantId) {
                throw new TenantError("Tenant context required");
            }

            return { tenantId: auth.tenantId };
        }
    );
}

export function enforceTenantIsolation(
    resourceTenantId: string | null,
    authContext: AuthContext
): void {
    if (authContext.roles.includes("SUPER_ADMIN")) return;
    if (authContext.roles.includes("PLATFORM_OPERATOR")) return;

    if (!authContext.tenantId || authContext.tenantId !== resourceTenantId) {
        throw new TenantError("Cross-tenant access denied");
    }
}
