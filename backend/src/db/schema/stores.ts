import {
    pgTable,
    text,
    timestamp,
    varchar,
    index,
    jsonb,
    real,
    boolean,
    pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { products } from "./catalog";
import { orders, carts } from "./orders";

export const verificationStepEnum = pgEnum("verification_step", [
    "PENDING_INFO",
    "PENDING_DOCS",
    "PENDING_REVIEW",
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED",
]);

export const stores = pgTable(
    "stores",
    {
        id: text("id").primaryKey(),
        ownerId: text("owner_id")
            .references(() => users.id)
            .notNull(),
        /** When set, this store is a branch of another store owned by the same user. */
        parentStoreId: text("parent_store_id"),
        name: varchar("name", { length: 255 }).notNull(),
        slug: varchar("slug", { length: 255 }).unique().notNull(),
        description: text("description"),
        shopType: varchar("shop_type", { length: 50 }).default("GROCERY").notNull(),
        storeCategoryId: text("store_category_id"), // FK to store_categories
        /** MERCHANT_SELF (default), PLATFORM, PICKUP_ONLY, HYBRID — see fulfillment module. */
        deliveryType: varchar("delivery_type", { length: 50 }).default("MERCHANT_SELF").notNull(),
        status: varchar("status", { length: 50 }).default("PENDING").notNull(),
        adminNotes: text("admin_notes"),
        commissionRate: real("commission_rate").default(10.0),
        phone: varchar("phone", { length: 20 }),
        email: varchar("email", { length: 255 }),
        address: text("address"),
        latitude: real("latitude"),
        longitude: real("longitude"),
        deliveryRadius: real("delivery_radius"),
        logoUrl: text("logo_url"),
        bannerUrl: text("banner_url"),
        metadata: jsonb("metadata"),
        operatingHours: jsonb("operating_hours"),

        // Quick toggles
        isOpen: boolean("is_open").default(true).notNull(),
        isBusyMode: boolean("is_busy_mode").default(false).notNull(),
        busyModeEtaMinutes: real("busy_mode_eta_minutes"),

        // KYC Verification
        kycDocumentUrl: text("kyc_document_url"),
        kycStatus: varchar("kyc_status", { length: 50 }).default("PENDING"),
        kycBusinessName: varchar("kyc_business_name", { length: 255 }),
        kycPanVat: varchar("kyc_pan_vat", { length: 50 }),
        kycAddress: text("kyc_address"),
        kycStoreLicenseUrl: text("kyc_store_license_url"),
        kycStorePhotos: jsonb("kyc_store_photos").$type<string[]>(),
        verificationStep: verificationStepEnum("verification_step").default("PENDING_INFO"),
        verificationSubmittedAt: timestamp("verification_submitted_at", { withTimezone: true }),
        verificationReviewedAt: timestamp("verification_reviewed_at", { withTimezone: true }),

        // Enterprise
        masterMerchantId: text("master_merchant_id"),
        branchZone: varchar("branch_zone", { length: 50 }),

        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_stores_parent").on(table.parentStoreId),
        index("idx_stores_owner").on(table.ownerId),
        index("idx_stores_status").on(table.status),
        index("idx_stores_slug").on(table.slug),
        index("idx_stores_master").on(table.masterMerchantId),
        index("idx_stores_category").on(table.storeCategoryId),
        index("idx_stores_verification").on(table.verificationStep),
    ]
);

export const storesRelations = relations(stores, ({ one, many }) => ({
    owner: one(users, {
        fields: [stores.ownerId],
        references: [users.id],
    }),
    products: many(products),
    orders: many(orders),
    carts: many(carts),
}));
