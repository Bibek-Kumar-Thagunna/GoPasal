import {
    pgTable,
    text,
    timestamp,
    varchar,
    jsonb,
    index,
} from "drizzle-orm/pg-core";

export const policyViolations = pgTable(
    "policy_violations",
    {
        id: text("id").primaryKey(),
        actorId: text("actor_id").notNull(),
        policyType: varchar("policy_type", { length: 50 }).notNull(), // PRODUCT, ORDER, REFUND
        reason: text("reason").notNull(),
        resource: varchar("resource", { length: 50 }), // products, orders
        resourceId: text("resource_id"),
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_policy_actor").on(table.actorId),
        index("idx_policy_type").on(table.policyType),
        index("idx_policy_created").on(table.createdAt),
    ]
);
