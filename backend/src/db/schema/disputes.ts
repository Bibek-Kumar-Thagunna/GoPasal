import {
    pgTable,
    text,
    timestamp,
    varchar,
    pgEnum,
    index,
    jsonb,
    
    boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { orders } from "./orders";

export const disputeStatusEnum = pgEnum("dispute_status", [
    "OPEN",
    "RESOLVED",
    "REJECTED",
]);

export const disputeTypeEnum = pgEnum("dispute_type", [
    "WRONG_ITEM",
    "MISSING_ITEM",
    "DAMAGED",
    "LATE_DELIVERY",
    "COD_DISPUTE",
    "OTHER",
]);

export const disputes = pgTable(
    "disputes",
    {
        id: text("id").primaryKey(),
        orderId: text("order_id")
            .references(() => orders.id)
            .notNull(),
        reporterId: text("reporter_id")
            .references(() => users.id)
            .notNull(),
        type: disputeTypeEnum("type").default("OTHER").notNull(),
        reason: text("reason").notNull(),
        status: disputeStatusEnum("status").default("OPEN").notNull(),
        priority: varchar("priority", { length: 20 }).default("MEDIUM").notNull(), // LOW, MEDIUM, HIGH, URRENT
        evidenceUrls: jsonb("evidence_urls").$type<string[]>(), // Photos/Videos
        resolution: jsonb("resolution"), // Structured resolution details { action: "REFUND" | "RELEASE" | "REJECT", refundAmount?: string, notes?: string }
        resolvedBy: text("resolved_by").references(() => users.id),
        resolvedAt: timestamp("resolved_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_disputes_order").on(table.orderId),
        index("idx_disputes_status").on(table.status),
        index("idx_disputes_reporter").on(table.reporterId),
    ]
);

export const disputeMessages = pgTable(
    "dispute_messages",
    {
        id: text("id").primaryKey(),
        disputeId: text("dispute_id")
            .references(() => disputes.id)
            .notNull(),
        senderId: text("sender_id")
            .references(() => users.id)
            .notNull(),
        senderRole: varchar("sender_role", { length: 50 }).notNull(), // CUSTOMER, SELLER, ADMIN
        message: text("message").notNull(),
        attachments: jsonb("attachments").$type<string[]>(),
        isInternal: boolean("is_internal").default(false), // Admin-only notes
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_dispute_messages_dispute").on(table.disputeId),
        index("idx_dispute_messages_sender").on(table.senderId),
    ]
);

export const disputeRelations = relations(disputes, ({ one, many }) => ({
    order: one(orders, {
        fields: [disputes.orderId],
        references: [orders.id],
    }),
    reporter: one(users, {
        fields: [disputes.reporterId],
        references: [users.id],
    }),
    messages: many(disputeMessages),
}));

export const disputeMessageRelations = relations(disputeMessages, ({ one }) => ({
    dispute: one(disputes, {
        fields: [disputeMessages.disputeId],
        references: [disputes.id],
    }),
    sender: one(users, {
        fields: [disputeMessages.senderId],
        references: [users.id],
    }),
}));
