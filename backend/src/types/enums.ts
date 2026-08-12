export const UserRole = {
    SUPER_ADMIN: "SUPER_ADMIN",
    ADMIN: "ADMIN", // Added for hierarchy
    PLATFORM_OPERATOR: "PLATFORM_OPERATOR",
    SELLER_OWNER: "SELLER_OWNER",
    SELLER_STAFF: "SELLER_STAFF",
    CUSTOMER: "CUSTOMER",
    DELIVERY_PARTNER: "DELIVERY_PARTNER",
    RIDER: "RIDER", // Alias/Specific role for delivery
    SYSTEM: "SYSTEM",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const OrderStatus = {
    PLACED: "PLACED",
    ACCEPTED: "ACCEPTED",
    CONFIRMED: "CONFIRMED",
    PACKED: "PACKED",
    SHIPPED: "SHIPPED",
    OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
    RETURN_INITIATED: "RETURN_INITIATED",
    RETURNED: "RETURNED",
    PENDING_PAYMENT: "PENDING_PAYMENT", // Added
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const StoreStatus = {
    CREATED: "CREATED",
    PENDING_APPROVAL: "PENDING_APPROVAL",
    ACTIVE: "ACTIVE",
    SUSPENDED: "SUSPENDED",
    TERMINATED: "TERMINATED",
} as const;
export type StoreStatus = (typeof StoreStatus)[keyof typeof StoreStatus];

export const SessionStatus = {
    ACTIVE: "ACTIVE",
    EXPIRED: "EXPIRED",
    REVOKED: "REVOKED",
} as const;
export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

export const AuditAction = {
    CREATE: "CREATE",
    UPDATE: "UPDATE",
    DELETE: "DELETE",
    LOGIN: "LOGIN",
    LOGOUT: "LOGOUT",
    ROLE_ASSIGN: "ROLE_ASSIGN",
    ROLE_REVOKE: "ROLE_REVOKE",
    PERMISSION_CHANGE: "PERMISSION_CHANGE",
    STORE_STATE_CHANGE: "STORE_STATE_CHANGE",
    CONFIG_CHANGE: "CONFIG_CHANGE",
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const FeatureFlagScope = {
    GLOBAL: "GLOBAL",
    TENANT: "TENANT",
} as const;
export type FeatureFlagScope =
    (typeof FeatureFlagScope)[keyof typeof FeatureFlagScope];
