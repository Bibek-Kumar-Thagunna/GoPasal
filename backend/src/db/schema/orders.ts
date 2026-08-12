import {
    pgTable,
    text,
    timestamp,
    varchar,
    integer,
    decimal,
    index,
    pgEnum,
    boolean,
    jsonb,
    real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { stores } from "./stores";
import { productVariants } from "./catalog";
import { addresses } from "./customer";

// Enums
export const orderStatusEnum = pgEnum("order_status", [
    "PENDING_PAYMENT", // Added for Bill Splitting
    "PLACED",
    "ACCEPTED",
    "CONFIRMED",
    "PACKED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "RETURN_INITIATED",
    "RETURNED",
]);

export const splittingStrategyEnum = pgEnum("splitting_strategy", ["NONE", "EQUAL", "ITEMIZED"]);
export const collectionStatusEnum = pgEnum("collection_status", ["NOT_REQUIRED", "PENDING", "COLLECTED", "FAILED"]);

export const paymentMethodEnum = pgEnum("payment_method", [
    "COD",
    "ESEWA",
    "KHALTI",
]);

/** Buyer fulfillment path at checkout (merchant self-delivery, pickup, or platform fleet). */
export const orderFulfillmentTypeEnum = pgEnum("order_fulfillment_type", [
    "MERCHANT_DELIVERY",
    "PICKUP",
    "PLATFORM_LOGISTICS",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
    "PENDING",
    "PAID",
    "FAILED",
    "REFUNDED",
]);

// --- Cart ---

export const cartTypeEnum = pgEnum("cart_type", ["SINGLE", "GROUP"]);
export const cartStatusEnum = pgEnum("cart_status", ["OPEN", "LOCKED", "COMPLETED", "ABANDONED"]);

export const carts = pgTable(
    "carts",
    {
        id: text("id").primaryKey(),
        userId: text("user_id") // Acts as Host ID for Group Carts initially, or we explicitly add hostId
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        storeId: text("store_id")
            .references(() => stores.id, { onDelete: "cascade" })
            .notNull(),
        type: cartTypeEnum("type").default("SINGLE").notNull(),
        status: cartStatusEnum("status").default("OPEN").notNull(),
        shareCode: varchar("share_code", { length: 20 }).unique(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_carts_user").on(table.userId),
        index("idx_carts_share").on(table.shareCode)
    ]
);

export const cartsRelations = relations(carts, ({ one, many }) => ({
    user: one(users, {
        fields: [carts.userId],
        references: [users.id],
    }),
    store: one(stores, {
        fields: [carts.storeId],
        references: [stores.id],
    }),
    items: many(cartItems),
}));

export const cartItems = pgTable(
    "cart_items",
    {
        id: text("id").primaryKey(),
        cartId: text("cart_id")
            .references(() => carts.id, { onDelete: "cascade" })
            .notNull(),
        variantId: text("variant_id")
            .references(() => productVariants.id, { onDelete: "cascade" })
            .notNull(),
        quantity: integer("quantity").notNull(),
        addedBy: text("added_by").references(() => users.id), // Nullable for existing items
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [index("idx_cart_items_cart").on(table.cartId)]
);

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
    cart: one(carts, {
        fields: [cartItems.cartId],
        references: [carts.id],
    }),
    variant: one(productVariants, {
        fields: [cartItems.variantId],
        references: [productVariants.id],
    }),
}));

// --- Orders ---

// Enums moved to top

export const orders = pgTable(
    "orders",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        storeId: text("store_id")
            .references(() => stores.id)
            .notNull(),
        status: orderStatusEnum("status").default("PLACED").notNull(),
        paymentStatus: paymentStatusEnum("payment_status").default("PENDING").notNull(),
        splittingStrategy: splittingStrategyEnum("splitting_strategy").default("NONE").notNull(),
        paymentCollectionStatus: collectionStatusEnum("payment_collection_status").default("NOT_REQUIRED").notNull(),
        totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
        fulfillmentType: orderFulfillmentTypeEnum("fulfillment_type")
            .default("MERCHANT_DELIVERY")
            .notNull(),
        /** Percent at checkout (same semantics as `stores.commission_rate`, e.g. 10 = 10%). */
        commissionRateSnapshot: real("commission_rate_snapshot").default(10).notNull(),
        deliveryAddressId: text("delivery_address_id").references(() => addresses.id),
        paymentMethod: paymentMethodEnum("payment_method")
            .default("COD")
            .notNull(),
        isPriorityDelivery: boolean("is_priority_delivery").default(false),
        isGreenDelivery: boolean("is_green_delivery").default(false),

        notes: text("notes"),
        pricingSnapshot: jsonb("pricing_snapshot"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_orders_user").on(table.userId),
        index("idx_orders_store").on(table.storeId),
    ]
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
    user: one(users, {
        fields: [orders.userId],
        references: [users.id],
    }),
    store: one(stores, {
        fields: [orders.storeId],
        references: [stores.id],
    }),
    deliveryAddress: one(addresses, {
        fields: [orders.deliveryAddressId],
        references: [addresses.id],
    }),
    items: many(orderItems),
    history: many(orderStatusHistory),
}));

export const orderItems = pgTable(
    "order_items",
    {
        id: text("id").primaryKey(),
        orderId: text("order_id")
            .references(() => orders.id, { onDelete: "cascade" })
            .notNull(),
        variantId: text("variant_id")
            .references(() => productVariants.id)
            .notNull(),
        productName: varchar("product_name", { length: 255 }).notNull(),
        quantity: integer("quantity").notNull(),
        priceAtPurchase: decimal("price_at_purchase", {
            precision: 10,
            scale: 2,
        }).notNull(),
        metadata: jsonb("metadata"), // For Flash Sale Reservation IDs
    },
    (table) => [index("idx_order_items_order").on(table.orderId)]
);

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    variant: one(productVariants, {
        fields: [orderItems.variantId],
        references: [productVariants.id],
    }),
}));

export const orderStatusHistory = pgTable(
    "order_status_history",
    {
        id: text("id").primaryKey(),
        orderId: text("order_id")
            .references(() => orders.id, { onDelete: "cascade" })
            .notNull(),
        status: orderStatusEnum("status").notNull(),
        notes: text("notes"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [index("idx_order_history_order").on(table.orderId)]
);

export const orderStatusHistoryRelations = relations(
    orderStatusHistory,
    ({ one }) => ({
        order: one(orders, {
            fields: [orderStatusHistory.orderId],
            references: [orders.id],
        }),
    })
);
