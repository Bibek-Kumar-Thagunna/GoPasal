import { ForbiddenError, ValidationError } from "@/utils/errors";
import { UserRole } from "@/types";

export type DeliveryTaskStatus =
    | "PENDING"
    | "ASSIGNED"
    | "PICKED_UP"
    | "DELIVERED"
    | "FAILED"
    | "CANCELLED"
    | "RETURN_INITIATED"
    | "RETURNED_TO_SELLER";

type TransitionRule = {
    from: DeliveryTaskStatus[];
    to: DeliveryTaskStatus;
    roles: UserRole[];
};

export class DeliveryStateMachine {
    private static rules: TransitionRule[] = [
        // Rider Flow
        {
            from: ["PENDING"],
            to: "ASSIGNED",
            roles: ["RIDER", "ADMIN", "SUPER_ADMIN"], // Rider accepts task
        },
        {
            from: ["ASSIGNED"],
            to: "PICKED_UP",
            roles: ["RIDER", "ADMIN", "SUPER_ADMIN"], // Rider picks up from Seller
        },
        {
            from: ["PICKED_UP"],
            to: "DELIVERED",
            roles: ["RIDER", "ADMIN", "SUPER_ADMIN"], // Rider delivers to Customer
        },
        // Exceptions
        {
            from: ["ASSIGNED", "PICKED_UP"],
            to: "FAILED",
            roles: ["RIDER", "ADMIN", "SUPER_ADMIN"], // Customer unreachable
        },
        {
            from: ["PENDING", "ASSIGNED"],
            to: "CANCELLED",
            roles: ["ADMIN", "SUPER_ADMIN"], // Admin overrides
        },
        // Returns
        {
            from: ["FAILED", "DELIVERED"],
            to: "RETURN_INITIATED",
            roles: ["ADMIN", "SUPER_ADMIN", "SELLER_OWNER"],
        },
        {
            from: ["RETURN_INITIATED"],
            to: "RETURNED_TO_SELLER",
            roles: ["RIDER", "ADMIN", "SUPER_ADMIN", "SELLER_OWNER"],
        }
    ];

    static validateTransition(
        currentStatus: DeliveryTaskStatus,
        newStatus: DeliveryTaskStatus,
        userRoles: UserRole[]
    ): void {
        const rule = this.rules.find(
            (r) =>
                r.to === newStatus &&
                r.from.includes(currentStatus)
        );

        if (!rule) {
            throw new ValidationError(
                `Invalid delivery status transition from ${currentStatus} to ${newStatus}`
            );
        }

        const hasRole = userRoles.some((role) => rule.roles.includes(role));
        if (!hasRole) {
            throw new ForbiddenError(
                `Role not authorized to transition delivery task to ${newStatus}`
            );
        }
    }
}
