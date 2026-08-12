import { db, closeConnection } from "./connection";
import {
    roles,
    permissions,
    rolePermissions,
    userRoles,
    stores,
    users,
    categories,
    storeCategories,
    products,
    productVariants,
    inventory,
    subscriptionPlans,
    storeMarketingPlans,
} from "./schema";
import { generateId, hashPassword } from "@/utils";
import { logger } from "@/utils";
import { DEFAULT_ROLES } from "@/config";
import { PLATFORM_PROMO_STORE_ID } from "@/config/commerce";
import { eq } from "drizzle-orm";

const ROLE_DESCRIPTIONS: Record<string, string> = {
    SUPER_ADMIN:
        "Full platform access. Manages stores, users, and global config.",
    PLATFORM_OPERATOR: "DevOps and system monitoring access.",
    SELLER_OWNER: "Owns and manages a store tenant.",
    SELLER_STAFF: "Store employee with scoped permissions.",
    CUSTOMER: "End user who browses and orders products.",
    DELIVERY_PARTNER: "Fulfills delivery tasks.",
};

const DEFAULT_PERMISSIONS = [
    // Users
    {
        name: "users:read",
        resource: "users",
        action: "read",
        description: "View user profiles",
    },
    {
        name: "users:write",
        resource: "users",
        action: "write",
        description: "Create/update users",
    },
    {
        name: "users:delete",
        resource: "users",
        action: "delete",
        description: "Delete users",
    },
    // Stores
    {
        name: "stores:read",
        resource: "stores",
        action: "read",
        description: "View stores",
    },
    {
        name: "stores:write",
        resource: "stores",
        action: "write",
        description: "Create/update stores",
    },
    {
        name: "stores:delete",
        resource: "stores",
        action: "delete",
        description: "Delete stores",
    },
    {
        name: "stores:approve",
        resource: "stores",
        action: "approve",
        description: "Approve/suspend stores",
    },
    // Products
    {
        name: "products:read",
        resource: "products",
        action: "read",
        description: "View products",
    },
    {
        name: "products:write",
        resource: "products",
        action: "write",
        description: "Create/update products",
    },
    {
        name: "products:delete",
        resource: "products",
        action: "delete",
        description: "Delete products",
    },
    // Orders
    {
        name: "orders:read",
        resource: "orders",
        action: "read",
        description: "View orders",
    },
    {
        name: "orders:write",
        resource: "orders",
        action: "write",
        description: "Create/update orders",
    },
    {
        name: "orders:cancel",
        resource: "orders",
        action: "cancel",
        description: "Cancel orders",
    },
    // Delivery
    {
        name: "delivery:read",
        resource: "delivery",
        action: "read",
        description: "View delivery tasks",
    },
    {
        name: "delivery:write",
        resource: "delivery",
        action: "write",
        description: "Manage delivery tasks",
    },
    // RBAC
    {
        name: "roles:read",
        resource: "roles",
        action: "read",
        description: "View roles",
    },
    {
        name: "roles:write",
        resource: "roles",
        action: "write",
        description: "Manage roles",
    },
    {
        name: "permissions:read",
        resource: "permissions",
        action: "read",
        description: "View permissions",
    },
    {
        name: "permissions:write",
        resource: "permissions",
        action: "write",
        description: "Manage permissions",
    },
    // Config
    {
        name: "config:read",
        resource: "config",
        action: "read",
        description: "View platform config",
    },
    {
        name: "config:write",
        resource: "config",
        action: "write",
        description: "Update platform config",
    },
    // Audit
    {
        name: "audit:read",
        resource: "audit",
        action: "read",
        description: "View audit logs",
    },
    // Feature Flags
    {
        name: "features:read",
        resource: "features",
        action: "read",
        description: "View feature flags",
    },
    {
        name: "features:write",
        resource: "features",
        action: "write",
        description: "Manage feature flags",
    },
];

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
    SUPER_ADMIN: DEFAULT_PERMISSIONS.map((p) => p.name),
    PLATFORM_OPERATOR: [
        "users:read",
        "stores:read",
        "config:read",
        "audit:read",
        "features:read",
        "features:write",
    ],
    SELLER_OWNER: [
        "stores:read",
        "stores:write",
        "products:read",
        "products:write",
        "products:delete",
        "orders:read",
        "orders:write",
    ],
    SELLER_STAFF: [
        "products:read",
        "products:write",
        "orders:read",
        "orders:write",
    ],
    CUSTOMER: [
        "stores:read",
        "products:read",
        "orders:read",
        "orders:write",
        "orders:cancel",
    ],
    DELIVERY_PARTNER: ["delivery:read", "delivery:write", "orders:read"],
};

async function seed() {
    logger.info("Seeding database...");

    try {
        // 1. Seed Roles
        const roleMap: Record<string, string> = {};
        for (const roleName of DEFAULT_ROLES) {
            const id = generateId();
            const existing = await db
                .select()
                .from(roles)
                .where(eq(roles.name, roleName));
            if (existing.length === 0) {
                await db.insert(roles).values({
                    id,
                    name: roleName,
                    description: ROLE_DESCRIPTIONS[roleName] || "",
                });
                roleMap[roleName] = id;
                logger.info(`Created role: ${roleName}`);
            } else {
                roleMap[roleName] = existing[0].id;
                logger.info(`Role already exists: ${roleName}`);
            }
        }

        // 2. Seed Permissions
        const permMap: Record<string, string> = {};
        for (const perm of DEFAULT_PERMISSIONS) {
            const id = generateId();
            const existing = await db
                .select()
                .from(permissions)
                .where(eq(permissions.name, perm.name));
            if (existing.length === 0) {
                await db.insert(permissions).values({ id, ...perm });
                permMap[perm.name] = id;
                logger.info(`Created permission: ${perm.name}`);
            } else {
                permMap[perm.name] = existing[0].id;
            }
        }

        // 3. Seed Role-Permissions
        for (const [roleName, permNames] of Object.entries(ROLE_PERMISSION_MAP)) {
            const roleId = roleMap[roleName];
            if (!roleId) continue;

            for (const permName of permNames) {
                const permId = permMap[permName];
                if (!permId) continue;

                const existing = await db
                    .select()
                    .from(rolePermissions)
                    .where(eq(rolePermissions.roleId, roleId));

                const alreadyAssigned = existing.some(
                    (rp) => rp.permissionId === permId
                );
                if (!alreadyAssigned) {
                    await db
                        .insert(rolePermissions)
                        .values({ roleId, permissionId: permId });
                }
            }
            logger.info(`Assigned ${permNames.length} permissions to ${roleName}`);
        }

        const customerMembershipPlans = [
            {
                id: "subplan_gopasal_plus",
                name: "GoPasal Plus",
                slug: "gopasal-plus",
                benefits: {
                    freeDelivery: {
                        mode: "above_subtotal_threshold" as const,
                        threshold: 499,
                    },
                    loyaltyEarnMultiplier: 1.15,
                },
                price: "199.00",
                durationDays: 30,
                deliveryFreeThreshold: "499.00",
                isPriorityDelivery: false,
                isActive: true,
            },
            {
                id: "subplan_gopasal_gold",
                name: "GoPasal Gold",
                slug: "gopasal-gold",
                benefits: {
                    freeDelivery: { mode: "always" as const },
                    loyaltyEarnMultiplier: 1.35,
                    platformFeeWaivePercent: 0,
                },
                price: "499.00",
                durationDays: 30,
                deliveryFreeThreshold: "0",
                isPriorityDelivery: true,
                isActive: true,
            },
        ];

        for (const row of customerMembershipPlans) {
            const [existing] = await db
                .select()
                .from(subscriptionPlans)
                .where(eq(subscriptionPlans.slug, row.slug));
            if (!existing) {
                await db.insert(subscriptionPlans).values(row);
                logger.info(`Created customer membership plan: ${row.name}`);
            }
        }

        const storeMarketingPlanSeeds = [
            {
                id: "smp_boost_lite",
                name: "Boost Lite",
                slug: "boost-lite",
                description: "Lower marketplace take on each order and a small search boost.",
                monthlyPrice: "999.00",
                benefits: {
                    commissionDiscountBps: 25,
                    searchBoostMultiplier: 1.05,
                    monthlyPromotionalBoostCredits: 3,
                },
                isActive: true,
            },
            {
                id: "smp_boost_pro",
                name: "Boost Pro",
                slug: "boost-pro",
                description: "Stronger placement signal, more promo credits, analytics flag.",
                monthlyPrice: "2499.00",
                benefits: {
                    commissionDiscountBps: 75,
                    searchBoostMultiplier: 1.12,
                    monthlyFeaturedListingSlots: 2,
                    monthlyPromotionalBoostCredits: 10,
                    analyticsPro: true,
                },
                isActive: true,
            },
        ];

        for (const row of storeMarketingPlanSeeds) {
            const [existing] = await db
                .select()
                .from(storeMarketingPlans)
                .where(eq(storeMarketingPlans.slug, row.slug));
            if (!existing) {
                await db.insert(storeMarketingPlans).values(row);
                logger.info(`Created store marketing plan: ${row.name}`);
            }
        }

        // --- Seed Catalog ---
        logger.info("Seeding catalog...");

        // 4. Create Seller User
        const sellerEmail = "seller@gopasal.com";
        let [seller] = await db
            .select()
            .from(users)
            .where(eq(users.email, sellerEmail));

        if (!seller) {
            const hashedPassword = await hashPassword("pass1234");
            const id = generateId();
            [seller] = await db
                .insert(users)
                .values({
                    id,
                    email: sellerEmail,
                    phone: "9800000001",
                    passwordHash: hashedPassword,
                    isPhoneVerified: true,
                })
                .returning();
            logger.info("Created seller user");

            // Assign ROLE
            if (roleMap["SELLER_OWNER"]) {
                await db.insert(userRoles).values({
                    userId: seller.id,
                    roleId: roleMap["SELLER_OWNER"],
                });
            }
        }

        const adminEmail = "admin@gopasal.com";
        const adminPhone = "9800000099";
        let [adminUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, adminEmail));

        if (!adminUser) {
            const hashedAdminPassword = await hashPassword("pass1234");
            const adminId = generateId();
            [adminUser] = await db
                .insert(users)
                .values({
                    id: adminId,
                    email: adminEmail,
                    phone: adminPhone,
                    passwordHash: hashedAdminPassword,
                    name: "GoPasal Super Admin",
                    isPhoneVerified: true,
                })
                .returning();
            logger.info("Created platform super admin (dev credentials in seed script comments)");

            if (roleMap["SUPER_ADMIN"]) {
                await db.insert(userRoles).values({
                    userId: adminUser.id,
                    roleId: roleMap["SUPER_ADMIN"],
                });
            }
        }

        let [platformPromoStore] = await db
            .select()
            .from(stores)
            .where(eq(stores.id, PLATFORM_PROMO_STORE_ID));

        if (!platformPromoStore) {
            await db.insert(stores).values({
                id: PLATFORM_PROMO_STORE_ID,
                ownerId: adminUser!.id,
                name: "GoPasal Platform Promos",
                slug: "gopasal-platform-promos",
                description:
                    "Virtual store for marketplace-wide coupons (beginner vouchers, referrals).",
                status: "ACTIVE",
                latitude: 27.7,
                longitude: 85.3,
                address: "Platform virtual",
            });
            logger.info("Created platform promo store for acquisition coupons");
        }

        // 5. Create Stores
        const storesData = [
            {
                name: "KFC",
                slug: "kfc-express",
                description: "Finger Lickin' Good",
                address: "Durbar Marg, Kathmandu",
                status: "ACTIVE" as const,
                shopType: "RESTAURANT",
                storeCategoryId: "restaurant",
                logo: "https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?w=200&h=200&fit=crop", // placeholder logo
                coverImage: "https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?q=80&w=800&auto=format&fit=crop",
            },
            {
                name: "City Mart",
                slug: "city-mart",
                description: "Fresh daily groceries",
                address: "Baneshwor, Kathmandu",
                status: "ACTIVE" as const,
                shopType: "GROCERY",
                storeCategoryId: "grocery",
                logo: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop",
                coverImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&fit=crop",
            },
            {
                name: "Sunrise Bakery",
                slug: "sunrise-bakery",
                description: "Freshly baked goods everyday",
                address: "Thamel, Kathmandu",
                status: "ACTIVE" as const,
                shopType: "RESTAURANT",
                storeCategoryId: "restaurant",
                logo: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop",
                coverImage: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&fit=crop",
            }
        ];

        const storeMap = new Map<string, string>();
        for (const s of storesData) {
            let [dbStore] = await db.select().from(stores).where(eq(stores.slug, s.slug));
            if (!dbStore) {
                [dbStore] = await db.insert(stores).values({
                    id: generateId(),
                    ownerId: seller.id,
                    ...s,
                    latitude: 27.7,
                    longitude: 85.3,
                }).returning();
                logger.info(`Created store: ${s.name}`);
            } else if (!dbStore.storeCategoryId && s.storeCategoryId) {
                await db
                    .update(stores)
                    .set({ storeCategoryId: s.storeCategoryId, shopType: s.shopType })
                    .where(eq(stores.id, dbStore.id));
                logger.info(`Backfilled store category for: ${s.name}`);
            }
            storeMap.set(s.name, dbStore.id);
        }

        // 6. Create Store Categories (seller onboarding / shop types)
        const storeCategoryData = [
            {
                id: "grocery",
                name: "Grocery Store",
                slug: "grocery",
                icon: "cart-outline",
                description: "Fresh produce, packaged foods, daily essentials",
            },
            {
                id: "photo-print",
                name: "Photo & Print",
                slug: "photo-print",
                icon: "images-outline",
                description: "Photo printing, ID & passport photos, lamination, large-format, custom prints",
            },
            {
                id: "restaurant",
                name: "Restaurant / Kitchen",
                slug: "restaurant",
                icon: "restaurant-outline",
                description: "Ready meals, cloud kitchen, dine-in service",
            },
            {
                id: "apparel",
                name: "Fashion",
                slug: "apparel",
                icon: "shirt-outline",
                description: "Clothing, footwear, accessories, jewelry",
            },
            {
                id: "electronics",
                name: "Electronics & Tech",
                slug: "electronics",
                icon: "phone-portrait-outline",
                description: "Phones, laptops, gadgets, accessories",
            },
            {
                id: "health-beauty",
                name: "Health & Beauty",
                slug: "health-beauty",
                icon: "heart-outline",
                description: "Cosmetics, skincare, pharmacy, wellness",
            },
            {
                id: "service",
                name: "Service Business",
                slug: "service",
                icon: "construct-outline",
                description: "Laundry, repair, salon, professional services",
            },
        ];

        for (const cat of storeCategoryData) {
            let [dbStoreCat] = await db
                .select()
                .from(storeCategories)
                .where(eq(storeCategories.id, cat.id));
            if (!dbStoreCat) {
                [dbStoreCat] = await db
                    .insert(storeCategories)
                    .values({
                        ...cat,
                        isActive: true,
                    })
                    .returning();
                logger.info(`Created store category: ${cat.name}`);
            } else {
                await db.update(storeCategories).set({ name: cat.name }).where(eq(storeCategories.id, cat.id));
                logger.info(`Updated store category: ${cat.name}`);
            }
        }

        // 7. Create Product Categories
        const categoryData = [
            { name: "Groceries", image: "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=200&fit=crop" },
            { name: "Restaurants", image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&fit=crop" },
            { name: "Snacks", image: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=200&fit=crop" },
            { name: "Beverage", image: "https://images.unsplash.com/photo-1581006571556-9efceb3baab2?w=200&fit=crop" },
            { name: "Bakery", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&fit=crop" },
        ];
        const categoryMap = new Map<string, string>();

        for (const cat of categoryData) {
            const slug = cat.name.toLowerCase();
            let [dbCat] = await db.select().from(categories).where(eq(categories.slug, slug));
            if (!dbCat) {
                [dbCat] = await db.insert(categories).values({
                    id: generateId(),
                    name: cat.name,
                    slug,
                    image: cat.image,
                    isActive: true,
                }).returning();
                logger.info(`Created category: ${cat.name}`);
            }
            categoryMap.set(cat.name, dbCat.id);
        }

        // 8. Create Products
        const productsData = [
            {
                name: "Pepperoni Pizza",
                slug: "pepperoni-pizza",
                price: "10.99",
                category: "Restaurants",
                store: "KFC",
                image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&fit=crop",
            },
            {
                name: "Grilled Chicken",
                slug: "grilled-chicken",
                price: "8.49",
                category: "Restaurants",
                store: "KFC",
                image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800&fit=crop",
            },
            {
                name: "Fresh Bread",
                slug: "fresh-bread",
                price: "12.99",
                category: "Bakery",
                store: "Sunrise Bakery",
                image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&fit=crop",
            },
            {
                name: "Chicken Biryani",
                slug: "chicken-biryani",
                price: "9.49",
                category: "Restaurants",
                store: "City Mart",
                image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&fit=crop",
            },
            {
                name: "Sweet Corn",
                slug: "sweet-corn",
                price: "3.49",
                category: "Groceries",
                store: "City Mart",
                image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&fit=crop",
            },
            {
                name: "Samosa",
                slug: "samosa",
                price: "2.99",
                category: "Snacks",
                store: "Sunrise Bakery",
                image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&fit=crop",
            },
        ];

        for (const prod of productsData) {
            let [p] = await db.select().from(products).where(eq(products.slug, prod.slug));

            if (!p) {
                const catId = categoryMap.get(prod.category)!;
                const storeId = storeMap.get(prod.store)!;
                const id = generateId();
                [p] = await db
                    .insert(products)
                    .values({
                        id,
                        storeId: storeId,
                        categoryId: catId,
                        name: prod.name,
                        slug: prod.slug,
                        basePrice: prod.price,
                        images: [prod.image], // Assumes images is a jsonb/array column
                        isActive: true,
                    })
                    .returning();

                // Create Variant
                const [variant] = await db.insert(productVariants).values({
                    id: generateId(),
                    productId: p.id,
                    name: "Standard",
                    sku: `${prod.slug.toUpperCase()}-STD`,
                    priceOffset: "0",
                }).returning();

                // Create Inventory
                await db.insert(inventory).values({
                    id: generateId(),
                    variantId: variant.id,
                    quantity: 100,
                });

                logger.info(`Created product: ${prod.name}`);
            }
        }

        logger.info("Database seeding completed");
    } catch (err) {
        logger.error("Seeding failed", { error: (err as Error).message });
        process.exit(1);
    } finally {
        await closeConnection();
    }
}

seed();
