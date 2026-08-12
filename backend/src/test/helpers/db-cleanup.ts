import { db } from "@/db";
import { sql } from "drizzle-orm";

/**
 * Clean up test database by truncating all tables
 * This ensures test isolation and prevents tests from interfering with each other
 */
export async function cleanupTestDatabase() {
    try {
        // Truncate all tables in the correct order (respecting foreign keys)
        await db.execute(sql`
            TRUNCATE TABLE 
                dispute_messages,
                disputes,
                policy_violations,
                audit_logs,
                sponsored_targets,
                ad_spend_daily,
                sponsored_campaigns,
                pos_order_mappings,
                pos_product_mappings,
                pos_integrations,
                order_items,
                orders,
                refunds,
                payments,
                escrow,
                settlements,
                settlement_items,
                ledger_entries,
                ledger_accounts,
                delivery_tasks,
                riders,
                inventory,
                product_variants,
                products,
                categories,
                stores,
                addresses,
                users
            CASCADE
        `);
    } catch (error) {
        console.error("Error cleaning up test database:", error);
        throw error;
    }
}

/**
 * Setup test database - can be called before each test suite
 */
export async function setupTestDatabase() {
    await cleanupTestDatabase();
}
