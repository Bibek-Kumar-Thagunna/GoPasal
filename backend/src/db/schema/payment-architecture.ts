import {
    pgTable,
    text,
    timestamp,
    varchar,
    decimal,
    index,
    pgEnum,
    jsonb,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders } from "./orders";
import { payments } from "./payments";
import { stores } from "./stores";

export const paymentProviderEnum = pgEnum("payment_provider_id", [
    "SKYPAY",
    "KHALTI_DIRECT",
    "ESEWA_DIRECT",
    "COD_INTERNAL",
    "FONEPAY_DIRECT",
    "KHALTI",
    "ESEWA",
]);

export const paymentChannelEnum = pgEnum("payment_channel", [
    "COD",
    "ESEWA",
    "KHALTI",
    "FONEPAY_QR",
    "CARD",
    "WALLET",
]);

export const paymentAttemptStatusEnum = pgEnum("payment_attempt_status", [
    "INITIATED",
    "PENDING",
    "PROCESSING",
    "PAID",
    "FAILED",
    "CANCELLED",
    "EXPIRED",
    "REFUNDED",
]);

export const webhookEventStatusEnum = pgEnum("webhook_event_status", [
    "RECEIVED",
    "PROCESSING",
    "PROCESSED",
    "FAILED",
    "IGNORED",
]);

export const paymentAttempts = pgTable(
    "payment_attempts",
    {
        id: text("id").primaryKey(),
        paymentId: text("payment_id")
            .references(() => payments.id)
            .notNull(),
        orderId: text("order_id")
            .references(() => orders.id)
            .notNull(),
        provider: paymentProviderEnum("provider").notNull(),
        channel: paymentChannelEnum("channel").notNull(),
        amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
        status: paymentAttemptStatusEnum("status").default("INITIATED").notNull(),
        providerRef: text("provider_ref"),
        idempotencyKey: text("idempotency_key").notNull(),
        returnUrl: text("return_url"),
        metadata: jsonb("metadata"),
        expiresAt: timestamp("expires_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        index("idx_payment_attempts_order").on(table.orderId),
        index("idx_payment_attempts_payment").on(table.paymentId),
        index("idx_payment_attempts_status").on(table.status),
        uniqueIndex("uidx_payment_attempts_idem").on(table.idempotencyKey),
    ]
);

export const webhookEvents = pgTable(
    "webhook_events",
    {
        id: text("id").primaryKey(),
        provider: paymentProviderEnum("provider").notNull(),
        externalEventId: text("external_event_id").notNull(),
        paymentId: text("payment_id"),
        orderId: text("order_id"),
        payload: jsonb("payload").notNull(),
        signature: text("signature"),
        status: webhookEventStatusEnum("status").default("RECEIVED").notNull(),
        errorMessage: text("error_message"),
        processedAt: timestamp("processed_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("uidx_webhook_provider_event").on(table.provider, table.externalEventId),
        index("idx_webhook_events_status").on(table.status),
    ]
);

export const sellerPayoutRequests = pgTable(
    "seller_payout_requests",
    {
        id: text("id").primaryKey(),
        storeId: text("store_id")
            .references(() => stores.id)
            .notNull(),
        amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
        status: varchar("status", { length: 32 }).default("PENDING").notNull(),
        bankAccountRef: text("bank_account_ref"),
        settlementId: text("settlement_id"),
        requestedBy: text("requested_by"),
        approvedBy: text("approved_by"),
        rejectedReason: text("rejected_reason"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        index("idx_payout_requests_store").on(table.storeId),
        index("idx_payout_requests_status").on(table.status),
    ]
);

export const paymentAuditLogs = pgTable(
    "payment_audit_logs",
    {
        id: text("id").primaryKey(),
        actorType: varchar("actor_type", { length: 32 }).notNull(),
        actorId: text("actor_id"),
        action: varchar("action", { length: 64 }).notNull(),
        orderId: text("order_id"),
        paymentId: text("payment_id"),
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        index("idx_payment_audit_order").on(table.orderId),
        index("idx_payment_audit_action").on(table.action),
    ]
);

export const paymentAttemptsRelations = relations(paymentAttempts, ({ one }) => ({
    payment: one(payments, {
        fields: [paymentAttempts.paymentId],
        references: [payments.id],
    }),
    order: one(orders, {
        fields: [paymentAttempts.orderId],
        references: [orders.id],
    }),
}));
