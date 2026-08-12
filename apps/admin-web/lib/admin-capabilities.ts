"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth";

/** Role gates for destructive or marketplace-critical operations in the admin shell. */
export function useAdminCapabilities() {
  const { user } = useAuth();

  return useMemo(() => {
    const roles = user?.roles ?? [];
    const isSuperAdmin = roles.includes("SUPER_ADMIN");
    const isPlatformOperator = roles.includes("PLATFORM_OPERATOR");
    const isStaffAdmin = isSuperAdmin || isPlatformOperator;

    return {
      roles,
      isStaffAdmin,
      isSuperAdmin,
      isPlatformOperator,
      /** Approvals, suspensions, and take-rate edits */
      canGovernSellers: isSuperAdmin,
      /** Suspend storefront vs disable customer login — super admin only */
      canSuspendUserAccounts: isSuperAdmin,
      /** Listing activation toggles — operators may moderate catalogue */
      canDeactivateCatalogRows: isStaffAdmin,
      canModerateReviews: isStaffAdmin,
      canManageCoupons: isStaffAdmin,
      canResolveDisputes: isStaffAdmin,
      /** Treasury: manual refunds (`/admin/governance/refunds`) */
      canProcessRefunds: isStaffAdmin,
      /** Trigger settlement batches for a shop + period */
      canGenerateSettlements: isStaffAdmin,
      /** Execute payout against a settlement (high risk) */
      canExecutePayouts: isSuperAdmin,
      /** System configs API is SUPER_ADMIN-only */
      canManageSystemConfig: isSuperAdmin,
    };
  }, [user?.roles]);
}
