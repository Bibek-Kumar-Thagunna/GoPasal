import { OrderStatus, UserRole } from "@/types";
import { ForbiddenError, ValidationError } from "@/utils/errors";

type TransitionRule = {
    from: OrderStatus[];
    to: OrderStatus;
    roles: UserRole[];
    /** Restricts the transition to orders created with this fulfillment type. */
    fulfillment?: "PICKUP";
};

export class OrderStateMachine {
    private static rules: TransitionRule[] = [
        // Seller / Staff
        {
            from: ["PLACED"],
            to: "ACCEPTED",
            roles: ["SELLER_OWNER", "SELLER_STAFF", "ADMIN", "SUPER_ADMIN"],
        },
        {
            from: ["ACCEPTED"],
            to: "CONFIRMED",
            roles: ["SELLER_OWNER", "SELLER_STAFF", "ADMIN", "SUPER_ADMIN"],
        },
        {
            from: ["CONFIRMED"],
            to: "PACKED",
            roles: ["SELLER_OWNER", "SELLER_STAFF", "ADMIN", "SUPER_ADMIN"],
        },
        {
            from: ["ACCEPTED"],
            to: "PACKED",
            roles: ["SELLER_OWNER", "SELLER_STAFF", "ADMIN", "SUPER_ADMIN"],
        },
        {
            from: ["PACKED"],
            to: "OUT_FOR_DELIVERY",
            roles: ["SELLER_OWNER", "SELLER_STAFF", "ADMIN", "SUPER_ADMIN"], // Usually Rider, but Seller can mark dispatch
        },
        // Pickup shortcut: a pickup order goes straight from PACKED to DELIVERED.
        {
            from: ["PACKED"],
            to: "DELIVERED",
            roles: ["SELLER_OWNER", "SELLER_STAFF", "ADMIN", "SUPER_ADMIN"],
            fulfillment: "PICKUP",
        },
        // Rider
        {
            from: ["OUT_FOR_DELIVERY"],
            to: "DELIVERED",
            roles: ["RIDER", "ADMIN", "SUPER_ADMIN"],
        },
        // Cancellation (Customer can cancel if PLACED only. System for timeout)
        {
            from: ["PLACED"],
            to: "CANCELLED",
            roles: ["CUSTOMER", "SYSTEM"],
        },
        // Seller/Admin can cancel from PLACED or ACCEPTED
        {
            from: ["PLACED", "ACCEPTED"],
            to: "CANCELLED",
            roles: ["SELLER_OWNER", "SELLER_STAFF", "ADMIN", "SUPER_ADMIN"],
        },
        // Returns
        {
            from: ["DELIVERED"],
            to: "RETURN_INITIATED",
            roles: ["CUSTOMER", "ADMIN", "SUPER_ADMIN"],
        },
        {
            from: ["RETURN_INITIATED"],
            to: "RETURNED",
            roles: ["SELLER_OWNER", "ADMIN", "SUPER_ADMIN"],
        },
    ];

    static validateTransition(
        currentStatus: OrderStatus,
        newStatus: OrderStatus,
        userRoles: UserRole[],
        fulfillmentType?: string | null
    ): void {
        const rule = this.rules.find(
            (r) =>
                r.to === newStatus &&
                r.from.includes(currentStatus) &&
                (!r.fulfillment || r.fulfillment === fulfillmentType)
        );

        if (!rule) {
            throw new ValidationError(
                `Invalid status transition from ${currentStatus} to ${newStatus}`
            );
        }

        const hasRole = userRoles.some((role) => rule.roles.includes(role));
        if (!hasRole) {
            throw new ForbiddenError(
                `Role not authorized to transition to ${newStatus}`
            );
        }
    }
}
