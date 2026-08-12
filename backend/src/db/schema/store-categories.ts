import {
    pgTable,
    text,
    timestamp,
    varchar,
    boolean,
    jsonb,
    index,
} from "drizzle-orm/pg-core";

export const storeCategories = pgTable(
    "store_categories",
    {
        id: text("id").primaryKey(),
        name: varchar("name", { length: 100 }).notNull(),
        slug: varchar("slug", { length: 100 }).unique().notNull(),
        description: text("description"),
        icon: varchar("icon", { length: 50 }), // Icon identifier for UI
        requiredProductFields: jsonb("required_product_fields").$type<{
            fields: Array<{
                key: string;
                label: string;
                type: "text" | "number" | "select" | "multiselect" | "boolean" | "json";
                required: boolean;
                options?: string[];
                placeholder?: string;
            }>;
        }>(),
        orderStatusFlow: jsonb("order_status_flow").$type<{
            statuses: Array<{
                key: string;
                label: string;
                description: string;
            }>;
        }>(),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_store_categories_slug").on(table.slug),
    ]
);
