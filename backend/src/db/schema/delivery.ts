import {
    pgTable,
    text,
    timestamp,
    varchar,
    boolean,
    real,
    decimal,
    index,
    pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { orders } from "./orders";

// Enums
export const riderStatusEnum = pgEnum("rider_status", [
    "OFFLINE",
    "ONLINE",
    "BUSY",
]);

export const taskStatusEnum = pgEnum("delivery_task_status", [
    "PENDING",              // Waiting for rider
    "ASSIGNED",             // Rider accepted
    "PICKED_UP",            // Rider has package
    "DELIVERED",            // Completed
    "FAILED",               // Issue
    "CANCELLED",            // Order cancelled
    "RETURN_INITIATED",     // Return started
    "RETURNED_TO_SELLER",   // Item returned
]);

// --- Riders ---

export const riders = pgTable(
    "riders",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        vehicleType: varchar("vehicle_type", { length: 50 }).notNull(), // bike, scooter
        licensePlate: varchar("license_plate", { length: 50 }).notNull(),
        status: riderStatusEnum("status").default("OFFLINE").notNull(),
        isVerified: boolean("is_verified").default(false).notNull(),
        currentLat: real("current_lat"),
        currentLon: real("current_lon"),
        lastLocationUpdate: timestamp("last_location_update", { withTimezone: true }),

        // Earnings & Tier
        totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0"),
        pendingSettlement: decimal("pending_settlement", { precision: 10, scale: 2 }).default("0"),
        walletBalance: decimal("wallet_balance", { precision: 10, scale: 2 }).default("0"), // Pre-paid wallet for COD
        tier: varchar("tier", { length: 20 }).default("BRONZE"), // Linked to riderTiers
        earnings: decimal("earnings", { precision: 10, scale: 2 }).default("0"), // Current payable
        isEV: boolean("is_ev").default(false),

        // Intelligent Logistics Fields
        codCashInHand: decimal("cod_cash_in_hand", { precision: 10, scale: 2 }).default("0"),
        maxWalletLimit: decimal("max_wallet_limit", { precision: 10, scale: 2 }).default("5000"), // Default 5k Limit

        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_riders_user").on(table.userId),
        index("idx_riders_status").on(table.status),
        index("idx_riders_location").on(table.currentLat, table.currentLon), // For geo-queries
    ]
);

export const ridersRelations = relations(riders, ({ one, many }) => ({
    user: one(users, {
        fields: [riders.userId],
        references: [users.id],
    }),
    tasks: many(deliveryTasks),
}));

// --- Delivery Tasks ---

export const deliveryTasks = pgTable(
    "delivery_tasks",
    {
        id: text("id").primaryKey(),
        orderId: text("order_id")
            .references(() => orders.id)
            .notNull(),
        riderId: text("rider_id").references(() => riders.id), // Nullable initially
        tripTaskId: text("trip_task_id"), // Linked Trip (Batching)
        status: taskStatusEnum("status").default("PENDING").notNull(),

        // Timestamps
        acceptedAt: timestamp("accepted_at", { withTimezone: true }),
        pickedUpAt: timestamp("picked_up_at", { withTimezone: true }),
        deliveredAt: timestamp("delivered_at", { withTimezone: true }),

        // POD Details
        podImageUrl: text("pod_image_url"),
        podNotes: text("pod_notes"),

        // COD Details
        codCollected: boolean("cod_collected").default(false),
        codAmount: decimal("cod_amount", { precision: 10, scale: 2 }),
        codCollectedAt: timestamp("cod_collected_at", { withTimezone: true }),

        // Fee Details
        deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }),
        platformFee: decimal("platform_fee", { precision: 10, scale: 2 }),
        riderEarnings: decimal("rider_earnings", { precision: 10, scale: 2 }),

        failureReason: text("failure_reason"),

        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_delivery_order").on(table.orderId),
        index("idx_delivery_rider").on(table.riderId),
        index("idx_delivery_status").on(table.status),
    ]
);

export const deliveryTasksRelations = relations(deliveryTasks, ({ one }) => ({
    order: one(orders, {
        fields: [deliveryTasks.orderId],
        references: [orders.id],
    }),
    rider: one(riders, {
        fields: [deliveryTasks.riderId],
        references: [riders.id],
    }),
}));
