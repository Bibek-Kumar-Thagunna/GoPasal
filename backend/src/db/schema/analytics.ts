import { pgTable, text, decimal, pgEnum, timestamp, jsonb, index, date, unique } from "drizzle-orm/pg-core";

export const metricTypeEnum = pgEnum("metric_type", ["SALES", "RETENTION", "INVENTORY"]);

export const analyticsMetrics = pgTable("analytics_metrics", {
    id: text("id").primaryKey(),
    date: date("date").notNull(), // The day being measured
    type: metricTypeEnum("type").default("SALES").notNull(),
    metric: text("metric").notNull(), // 'gross_revenue', 'total_orders', 'aov', 'dau'
    value: decimal("value", { precision: 12, scale: 2 }).notNull(),
    dimensions: jsonb("dimensions"), // { storeId: "...", region: "..." }
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
    index("idx_analytics_date").on(table.date),
    index("idx_analytics_metric").on(table.metric),
    unique("unq_metric_date_dim").on(table.date, table.metric, table.dimensions) // Prevent double aggregating same dimension
]);
