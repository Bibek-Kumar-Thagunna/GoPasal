import { db, type DbTransaction } from "@/db";
import { riderPerformanceMonthly, riderLeaderboards, sellerBadges } from "@/db/schema/gamification";
import { riders, deliveryTasks } from "@/db/schema/delivery";
import { riderTiers } from "@/db/schema/enterprise";
import { orders, orderStatusHistory } from "@/db/schema/orders";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { generateId } from "@/utils";
import { AppError } from "@/utils/errors";

/** A delivery is "on time" when it is completed within this many minutes of pickup. */
const ON_TIME_WINDOW_MINUTES = 60;

type RiderTier = "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";

function tierForMetrics(p: {
    completedOrders: number;
    acceptanceRate: number;
    cancellationRate: number;
    avgRating: number;
    safetyFlags: number;
}): RiderTier {
    const safetyOk = p.safetyFlags === 0;

    // Note: avgRating is not a gate yet — rider reviews are not collected in
    // the current schema. Once reviews exist, add the rating thresholds back
    // (>= 4.7 for DIAMOND, >= 4.5 for GOLD).
    if (p.completedOrders >= 250 && p.acceptanceRate >= 95 && p.cancellationRate <= 2 && safetyOk) {
        return "DIAMOND";
    }
    if (p.completedOrders >= 150 && p.acceptanceRate >= 90 && p.cancellationRate <= 3 && safetyOk) {
        return "GOLD";
    }
    if (p.completedOrders >= 80 && p.acceptanceRate >= 85 && p.cancellationRate <= 5) {
        return "SILVER";
    }
    return "BRONZE";
}

export class GamificationService {
    /**
     * Compute monthly rider tiers from real delivery data.
     *
     * Aggregations (all scoped to `yearMonth`):
     * - completedOrders: tasks delivered in the month
     * - cancellationRate: (FAILED + CANCELLED) / assigned tasks
     * - onTimeRate: delivered within ON_TIME_WINDOW_MINUTES of pickup
     * - acceptanceRate: derived as 100 - cancellationRate (the platform does not
     *   yet record explicit accept/decline events per offered task)
     * - avgRating / safetyFlags: not collected for riders yet (schema has no
     *   rider reviews / telemetry) — recorded as 0 and excluded from tier logic
     *   until those data sources exist.
     */
    async calculateMonthlyTiers(yearMonth: string) {
        const [start, end] = this.monthBounds(yearMonth);
        const activeRiders = await db
            .select({ id: riders.id })
            .from(riders)
            .where(eq(riders.status, "ONLINE"));

        const results: { riderId: string; tier: string }[] = [];

        await db.transaction(async (tx: DbTransaction) => {
            for (const rider of activeRiders) {
                const rows = await tx
                    .select({ status: deliveryTasks.status, deliveredAt: deliveryTasks.deliveredAt, pickedUpAt: deliveryTasks.pickedUpAt })
                    .from(deliveryTasks)
                    .where(and(
                        eq(deliveryTasks.riderId, rider.id),
                        gte(deliveryTasks.createdAt, start),
                        lte(deliveryTasks.createdAt, end)
                    ));

                const assigned = rows.length;
                const delivered = rows.filter((r) => r.status === "DELIVERED");
                const failedOrCancelled = rows.filter((r) =>
                    r.status === "FAILED" || r.status === "CANCELLED"
                );

                const completedOrders = delivered.length;
                const cancellationRate =
                    assigned === 0 ? 0 : Math.round((failedOrCancelled.length / assigned) * 10000) / 100;
                const acceptanceRate =
                    assigned === 0 ? 100 : Math.max(0, Math.round((100 - cancellationRate) * 100) / 100);
                const onTimeRate =
                    delivered.length === 0
                        ? 0
                        : Math.round(
                              (delivered.filter((r) => {
                                  if (!r.deliveredAt || !r.pickedUpAt) return false;
                                  const mins =
                                      (new Date(r.deliveredAt).getTime() -
                                          new Date(r.pickedUpAt).getTime()) /
                                      60000;
                                  return mins <= ON_TIME_WINDOW_MINUTES;
                              }).length /
                                  delivered.length) *
                                  10000
                          ) / 100;

                const metrics = {
                    completedOrders,
                    acceptanceRate,
                    cancellationRate,
                    avgRating: 0, // rider reviews not yet collected
                    safetyFlags: 0, // telemetry not yet collected
                };
                const tier = tierForMetrics(metrics);

                await tx.insert(riderPerformanceMonthly).values({
                    id: `perf_${generateId()}`,
                    riderId: rider.id,
                    yearMonth,
                    completedOrders,
                    acceptanceRate: String(acceptanceRate),
                    cancellationRate: String(cancellationRate),
                    avgRating: "0",
                    onTimeRate: String(onTimeRate),
                    safetyFlags: 0,
                });

                await tx.update(riders).set({ tier }).where(eq(riders.id, rider.id));

                const existing = await tx
                    .select()
                    .from(riderTiers)
                    .where(eq(riderTiers.riderId, rider.id));
                if (existing.length > 0) {
                    await tx
                        .update(riderTiers)
                        .set({
                            tier,
                            monthlyOrders: completedOrders,
                            rating: 0,
                            updatedAt: new Date(),
                        })
                        .where(eq(riderTiers.riderId, rider.id));
                } else {
                    await tx.insert(riderTiers).values({
                        id: `rt_${generateId()}`,
                        riderId: rider.id,
                        tier,
                        monthlyOrders: completedOrders,
                        rating: 0,
                    });
                }

                results.push({ riderId: rider.id, tier });
            }
        });

        return results;
    }

    /**
     * Recompute the leaderboard for a month, replacing the previous snapshot.
     * Score = completedOrders + onTimeRate * 0.5 - cancellationRate * 10.
     */
    async computeLeaderboard(yearMonth: string) {
        const performances = await db
            .select()
            .from(riderPerformanceMonthly)
            .where(eq(riderPerformanceMonthly.yearMonth, yearMonth));

        const scored = performances.map((p) => {
            const score =
                p.completedOrders +
                Number(p.onTimeRate || 0) * 0.5 -
                Number(p.cancellationRate) * 10;
            return { ...p, score: Math.max(0, score) };
        });

        scored.sort((a, b) => b.score - a.score);

        await db.transaction(async (tx: DbTransaction) => {
            // Replace the month's snapshot (idempotent re-runs).
            await tx
                .delete(riderLeaderboards)
                .where(eq(riderLeaderboards.yearMonth, yearMonth));

            for (let i = 0; i < scored.length; i++) {
                const entry = scored[i];
                await tx.insert(riderLeaderboards).values({
                    id: `lb_${generateId()}`,
                    riderId: entry.riderId,
                    yearMonth,
                    score: entry.score.toFixed(2),
                    rank: i + 1,
                    city: "Global",
                });
            }
        });

        return scored.slice(0, 10);
    }

    // --- Benefits ---

    async checkInstantPayoutEligibility(riderId: string, amount: number) {
        const [rider] = await db.select().from(riders).where(eq(riders.id, riderId));
        if (!rider) throw new AppError("Rider not found", 404);

        if (rider.tier !== "DIAMOND") {
            return { allowed: false, reason: "Requires DIAMOND tier" };
        }

        if (amount > 5000) {
            return { allowed: false, reason: "Amount exceeds instant payout cap (NPR 5,000)" };
        }

        return { allowed: true };
    }

    // --- Seller Badges ---

    /**
     * Assign badges from real order metrics:
     * - FASTEST_PACKER: the store with the lowest average time from ACCEPTED → PACKED
     *   in the current month (needs >= 5 orders to qualify).
     */
    async assignSellerBadges() {
        const [start] = this.monthBounds(new Date().toISOString().slice(0, 7));

        const historyRows = await db
            .select({
                orderId: orderStatusHistory.orderId,
                storeId: orders.storeId,
                status: orderStatusHistory.status,
                createdAt: orderStatusHistory.createdAt,
            })
            .from(orderStatusHistory)
            .innerJoin(orders, eq(orderStatusHistory.orderId, orders.id))
            .where(
                and(
                    gte(orderStatusHistory.createdAt, start),
                    inArray(orderStatusHistory.status, ["ACCEPTED", "PACKED"])
                )
            );

        const byStore = new Map<
            string,
            { acceptedAt: Map<string, number>; packedAt: Map<string, number> }
        >();

        for (const row of historyRows) {
            const store = byStore.get(row.storeId) ?? {
                acceptedAt: new Map(),
                packedAt: new Map(),
            };
            if (row.status === "ACCEPTED") {
                store.acceptedAt.set(row.orderId, new Date(row.createdAt).getTime());
            } else if (row.status === "PACKED") {
                store.packedAt.set(row.orderId, new Date(row.createdAt).getTime());
            }
            byStore.set(row.storeId, store);
        }

        let fastest: { storeId: string; avgMinutes: number; orders: number } | null = null;

        for (const [storeId, times] of byStore) {
            const minutes: number[] = [];
            for (const [orderId, accepted] of times.acceptedAt) {
                const packed = times.packedAt.get(orderId);
                if (packed && packed >= accepted) {
                    minutes.push((packed - accepted) / 60000);
                }
            }
            if (minutes.length >= 5) {
                const avg = minutes.reduce((a, b) => a + b, 0) / minutes.length;
                if (!fastest || avg < fastest.avgMinutes) {
                    fastest = { storeId, avgMinutes: avg, orders: minutes.length };
                }
            }
        }

        if (!fastest) return 0;

        await db.insert(sellerBadges).values({
            id: `bdg_${generateId()}`,
            storeId: fastest.storeId,
            badgeType: "FASTEST_PACKER",
            window: "MONTHLY",
            scoreSnapshot: fastest.avgMinutes.toFixed(1),
        });

        return 1;
    }

    private monthBounds(yearMonth: string): [Date, Date] {
        const [year, month] = yearMonth.split("-").map(Number);
        const start = new Date(Date.UTC(year, month - 1, 1));
        const end = new Date(Date.UTC(year, month, 1));
        return [start, end];
    }
}
