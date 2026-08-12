import {
    pgTable,
    text,
    timestamp,
    varchar,
    jsonb,
    index,
} from "drizzle-orm/pg-core";

export const auditLogs = pgTable(
    "audit_logs",
    {
        id: text("id").primaryKey(),
        actorId: text("actor_id"),
        actorRole: varchar("actor_role", { length: 50 }),
        tenantId: text("tenant_id"),
        action: varchar("action", { length: 100 }).notNull(),
        resource: varchar("resource", { length: 100 }).notNull(),
        resourceId: text("resource_id"),
        beforeState: jsonb("before_state"),
        afterState: jsonb("after_state"),
        metadata: jsonb("metadata"),
        ipAddress: varchar("ip_address", { length: 45 }),
        requestId: text("request_id"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_audit_actor").on(table.actorId),
        index("idx_audit_tenant").on(table.tenantId),
        index("idx_audit_action").on(table.action),
        index("idx_audit_resource").on(table.resource),
        index("idx_audit_created").on(table.createdAt),
    ]
);
