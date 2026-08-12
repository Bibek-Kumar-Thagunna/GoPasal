import { db } from "@/db";
import { analyticsMetrics } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { generateId } from "@/utils";
// Removed date-fns to avoid dependency issues in this environment
// Simple date formatter
const formatDate = (d: Date) => d.toISOString().split('T')[0];

export class AnalyticsService {

    // 1. Get Dashboard Data (Time Series)
    async getDashboardData(startDate: Date, endDate: Date, metric: string = "gross_revenue") {
        // Query pre-aggregated table
        const metrics = await db.select().from(analyticsMetrics)
            .where(and(
                gte(analyticsMetrics.date, formatDate(startDate)),
                lte(analyticsMetrics.date, formatDate(endDate)),
                eq(analyticsMetrics.metric, metric)
            ))
            .orderBy(analyticsMetrics.date);

        return metrics;
    }

    // 2. Compute Daily Metrics (Nightly Job)
    async computeDailyMetrics(targetDate: Date = new Date()) {
        const dateStr = formatDate(targetDate);

        // A) Sales: Gross Revenue & Order Count
        // In real impl: Aggregate orders where status=DELIVERED and date matches
        // For MVP: We mock the aggregation result or do a simple query

        /*
        const salesAgg = await db.select({
            total: sql<number>`sum(total_amount)`,
            count: sql<number>`count(*)`
        })
        .from(orders)
        .where(and(
            eq(orders.status, "DELIVERED"),
            gte(orders.createdAt, startOfDay(targetDate)),
            lte(orders.createdAt, endOfDay(targetDate))
        ));
        */

        // Inserting Mock/Calculated Data for demonstration of pipeline
        await this.storeMetric(dateStr, "SALES", "gross_revenue", 150000); // Mocked
        await this.storeMetric(dateStr, "SALES", "total_orders", 125); // Mocked
        await this.storeMetric(dateStr, "SALES", "aov", 1200); // Mocked

        // B) Retention: DAU
        // In real impl: Count distinct users with activity logs
        await this.storeMetric(dateStr, "RETENTION", "dau", 450); // Mocked

        return { message: "Daily metrics computed", date: dateStr };
    }

    private async storeMetric(date: string, type: "SALES" | "RETENTION" | "INVENTORY", metric: string, value: number, dimensions: any = {}) {
        const id = generateId();
        // Upsert logic (if Drizzle supports onConflictDoUpdate easily, else check exists)
        // Simplified insert (might fail if unique constraint hit, should handle update)

        const [existing] = await db.select().from(analyticsMetrics).where(and(
            eq(analyticsMetrics.date, date),
            eq(analyticsMetrics.metric, metric)
            // dimensions check ignored for MVP simplicity
        ));

        if (existing) {
            await db.update(analyticsMetrics)
                .set({ value: String(value), updatedAt: new Date() } as any) // Type hack for updatedAt if not in schema usually
                .where(eq(analyticsMetrics.id, existing.id));
        } else {
            await db.insert(analyticsMetrics).values({
                id,
                date,
                type,
                metric,
                value: String(value),
                dimensions
            });
        }
    }
}

export const analyticsService = new AnalyticsService();
