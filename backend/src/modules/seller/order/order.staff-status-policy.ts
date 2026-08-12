import type { StaffRoleKind } from "@/db/schema/staff";
import type { OrderRowStatus } from "./order.workflow";

const STATUS_REQUIRES_ANY_STAFF_ROLE: Partial<
    Record<OrderRowStatus, StaffRoleKind[]>
> = {
    ACCEPTED: ["MANAGER", "CASHIER"],
    CONFIRMED: ["MANAGER", "CASHIER"],
    PACKED: ["MANAGER", "PACKER", "CASHIER"],
    SHIPPED: ["MANAGER", "PACKER", "CASHIER"],
    OUT_FOR_DELIVERY: ["MANAGER", "DRIVER", "PACKER"],
    DELIVERED: ["MANAGER", "DRIVER", "CASHIER"],
    CANCELLED: ["MANAGER", "CASHIER"],
};

export function staffMayApplyOrderStatus(
    nextStatus: OrderRowStatus,
    staffRoles: StaffRoleKind[],
    isStoreOwner: boolean
): boolean {
    if (isStoreOwner) {
        return true;
    }
    const allowed = STATUS_REQUIRES_ANY_STAFF_ROLE[nextStatus];
    if (!allowed || allowed.length === 0) {
        return false;
    }
    return staffRoles.some((r) => allowed.includes(r));
}
