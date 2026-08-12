import {
    pgTable,
    text,
    timestamp,
    varchar,
    decimal,
    
    
    jsonb,
    index,
    pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { riders, deliveryTasks } from "./delivery"; // extend existing

// Enums
export const tripStatusEnum = pgEnum("trip_status", ["PLANNED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "FAILED", "CANCELLED"]);
export const depositStatusEnum = pgEnum("deposit_status", ["PENDING", "VERIFIED", "REJECTED"]);

// 1. Trip Tasks (Batching)
export const tripTasks = pgTable(
    "trip_tasks",
    {
        id: text("id").primaryKey(),
        riderId: text("rider_id").references(() => riders.id), // Nullable if planned but not assigned
        status: tripStatusEnum("status").default("PLANNED").notNull(),
        routePlan: jsonb("route_plan"), // Array of stops: { type, taskId, address, lat, lon }
        totalDistance: decimal("total_distance", { precision: 10, scale: 2 }), // In km
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        index("idx_trip_rider").on(table.riderId),
        index("idx_trip_status").on(table.status),
    ]
);

// 2. Rider Deposits (Wallet Management)
export const riderDeposits = pgTable(
    "rider_deposits",
    {
        id: text("id").primaryKey(),
        riderId: text("rider_id").references(() => riders.id).notNull(),
        amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
        status: depositStatusEnum("status").default("PENDING").notNull(),
        referenceCode: varchar("reference_code", { length: 50 }), // Bank ref
        proofUrl: text("proof_url"),
        verifiedBy: text("verified_by"), // Admin User ID
        verifiedAt: timestamp("verified_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        index("idx_deposit_rider").on(table.riderId),
        index("idx_deposit_status").on(table.status),
    ]
);

// 3. Predictive Alerts (Positioning)
export const predictiveAlerts = pgTable(
    "predictive_alerts",
    {
        id: text("id").primaryKey(),
        riderId: text("rider_id").references(() => riders.id).notNull(),
        message: text("message").notNull(),
        targetLocation: jsonb("target_location"), // { lat, lon, name }
        sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
        expiresAt: timestamp("expires_at", { withTimezone: true }),
    },
    (table) => [
        index("idx_alert_rider").on(table.riderId),
    ]
);

// Relations
export const logisticRelations = relations(tripTasks, ({ one, many }) => ({
    rider: one(riders, {
        fields: [tripTasks.riderId],
        references: [riders.id],
    }),
    tasks: many(deliveryTasks), // One Trip -> Many Delivery Tasks
}));

export const depositRelations = relations(riderDeposits, ({ one }) => ({
    rider: one(riders, {
        fields: [riderDeposits.riderId],
        references: [riders.id],
    }),
}));

// Note: deliveryTasks needs 'tripTaskId' FK. 
// Since we can't alter existing schema file easily if it's separate, 
// we assume we will add the column via a migration or assume it exists in `delivery.ts` if we edit it.
// Plan said: "delivery_task.trip_task_id nullable (adds linkage)".
// I will edit `delivery.ts` next to add this field and the rider wallet fields.
