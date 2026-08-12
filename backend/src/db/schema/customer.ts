import {
    pgTable,
    text,
    timestamp,
    varchar,
    boolean,
    real,
    index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const addresses = pgTable(
    "addresses",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        label: varchar("label", { length: 50 }).notNull(), // e.g. "Home", "Work"
        contactName: varchar("contact_name", { length: 255 }), // For guest checkout & recipient tracking
        contactPhone: varchar("contact_phone", { length: 20 }), // For guest checkout & recipient tracking
        buildingName: varchar("building_name", { length: 255 }), // Blinkit-style advanced collection
        floor: varchar("floor", { length: 50 }), // Blinkit-style advanced collection
        addressLine: text("address_line").notNull(),
        city: varchar("city", { length: 100 }).notNull(),
        landmark: varchar("landmark", { length: 255 }),
        latitude: real("latitude").notNull(),
        longitude: real("longitude").notNull(),
        isDefault: boolean("is_default").default(false).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_addresses_user").on(table.userId),
        index("idx_addresses_coords").on(table.latitude, table.longitude),
    ]
);
