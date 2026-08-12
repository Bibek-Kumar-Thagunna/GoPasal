export const APP = {
    NAME: "GoPasal API",
    VERSION: "1.0.0",
    API_PREFIX: "/api/v1",
} as const;

export const AUTH = {
    ACCESS_TOKEN_EXPIRY: "15m",
    REFRESH_TOKEN_EXPIRY: "7d",
    ACCESS_TOKEN_EXPIRY_MS: 15 * 60 * 1000,
    REFRESH_TOKEN_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000,
    OTP_LENGTH: 6,
    MAX_OTP_ATTEMPTS: 5,
    OTP_COOLDOWN_MS: 60 * 1000,
} as const;

export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;

export const STORE_STATES = [
    "CREATED",
    "PENDING_APPROVAL",
    "ACTIVE",
    "SUSPENDED",
    "TERMINATED",
] as const;

export const DEFAULT_ROLES = [
    "SUPER_ADMIN",
    "PLATFORM_OPERATOR",
    "SELLER_OWNER",
    "SELLER_STAFF",
    "CUSTOMER",
    "DELIVERY_PARTNER",
] as const;
