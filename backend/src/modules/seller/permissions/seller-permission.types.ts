export const SELLER_PERMISSIONS = [
    "products.view",
    "products.manage",
    "orders.view",
    "orders.manage",
    "analytics.view",
    "store.operations",
    "pos.configure",
    "staff.manage",
    "announcements.view",
    "announcements.manage",
    "reviews.manage",
    "promotions.manage",
] as const;

export type SellerPermission = (typeof SELLER_PERMISSIONS)[number];
