import {
    pgTable,
    text,
    timestamp,
    decimal,
    index,
    pgEnum,
    jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { stores } from "./stores";

export const billingPayerTypeEnum = pgEnum("billing_payer_type", ["CUSTOMER", "STORE"]);
export const billingPurposeEnum = pgEnum("billing_purpose", [
    "SUBSCRIPTION",
    "STORE_MARKETING",
]);
export const billingIntentStatusEnum = pgEnum("billing_intent_status", [
    "PENDING",
    "PAID",
    "FAILED",
    "CANCELLED",
]);

export const billingIntents = pgTable(
    "billing_intents",
    {
        id: text("id").primaryKey(),
        payerUserId: text("payer_user_id")
            .references(() => users.id)
            .notNull(),
        payerType: billingPayerTypeEnum("payer_type").notNull(),
        storeId: text("store_id").references(() => stores.id),
        purpose: billingPurposeEnum("purpose").notNull(),
        referenceId: text("reference_id").notNull(),
        amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
        channel: text("channel"),
        status: billingIntentStatusEnum("status").default("PENDING").notNull(),
        provider: text("provider"),
        providerRef: text("provider_ref"),
        idempotencyKey: text("idempotency_key"),
        metadata: jsonb("metadata"),
        paidAt: timestamp("paid_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_billing_intents_payer").on(table.payerUserId),
        index("idx_billing_intents_store").on(table.storeId),
        index("idx_billing_intents_status").on(table.status),
        index("idx_billing_intents_idem").on(table.idempotencyKey),
    ]
);
