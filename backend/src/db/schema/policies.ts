import {
    pgTable,
    text,
    timestamp,
    varchar,
    boolean,
    index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const policies = pgTable(
    "policies",
    {
        id: text("id").primaryKey(),
        category: varchar("category", { length: 50 }).notNull(), // TERMS, PRIVACY, REFUND, SELLER_AGREEMENT
        title: varchar("title", { length: 255 }).notNull(),
        content: text("content").notNull(), // Markdown or HTML
        version: varchar("version", { length: 20 }).notNull(), // 1.0.0
        effectiveDate: timestamp("effective_date", { withTimezone: true }).notNull(),
        isActive: boolean("is_active").default(true).notNull(),
        createdBy: text("created_by").references(() => users.id),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_policies_category").on(table.category),
        index("idx_policies_active").on(table.isActive),
    ]
);

export const userConsents = pgTable(
    "user_consents",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        policyId: text("policy_id")
            .references(() => policies.id)
            .notNull(),
        consentedAt: timestamp("consented_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        ipAddress: varchar("ip_address", { length: 45 }),
        userAgent: text("user_agent"),
    },
    (table) => [
        index("idx_consents_user").on(table.userId),
        index("idx_consents_policy").on(table.policyId),
    ]
);

export const userConsentsRelations = relations(userConsents, ({ one }) => ({
    user: one(users, {
        fields: [userConsents.userId],
        references: [users.id],
    }),
    policy: one(policies, {
        fields: [userConsents.policyId],
        references: [policies.id],
    }),
}));
