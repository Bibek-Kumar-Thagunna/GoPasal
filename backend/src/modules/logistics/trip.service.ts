import { db, type DbTransaction } from "@/db";
import { tripTasks, deliveryTasks, riders, predictiveAlerts } from "@/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { generateId } from "@/utils";
import { isWithinRadius } from "@/utils/geo";
import { notificationService } from "@/modules/customer/notification.service";

class TripService {
    async createTrip(taskIds: string[], riderId: string) {
        return db.transaction(async (tx: DbTransaction) => {
            // 1. Get Tasks Info
            const tasks = await tx.select().from(deliveryTasks).where(inArray(deliveryTasks.id, taskIds));

            // 2. Create Route Plan (Simple: Just list tasks in order for MVP)
            // Real logic: TSP Solver
            const routePlan = tasks.map(t => ({
                taskId: t.id,
                type: "DELIVERY", // Simplified: we assume pickup->dropoff per task or mixed
            }));

            // 3. Create Trip
            const tripId = generateId();
            await tx.insert(tripTasks).values({
                id: tripId,
                riderId,
                status: "ASSIGNED",
                routePlan: routePlan
            });

            // 4. Link Tasks
            await tx.update(deliveryTasks)
                .set({ tripTaskId: tripId, riderId, status: "ASSIGNED" })
                .where(inArray(deliveryTasks.id, taskIds));

            return tripId;
        });
    }

    async listTrips() {
        return db.select()
            .from(tripTasks)
            .orderBy(desc(tripTasks.createdAt));
    }
}

class PredictiveService {
    async generateHeatmapAndAlert() {
        // 1. Find Hot Zones (Mock: Orders created in last hour grouped by location?)
        // Since we don't have Geohash column, we simulate by listing active stores
        // In real app, we query Order History.

        // Mock: Find Riders with status "ONLINE" (Idle)
        const idleRiders = await db.select().from(riders).where(eq(riders.status, "ONLINE"));

        for (const rider of idleRiders) {
            if (rider.currentLat && rider.currentLon) {
                // Check if near a "Hot Zone" (e.g. Thamel: 27.715, 85.31)
                // Hardcoded example for MVP
                const thamelLat = 27.715;
                const thamelLon = 85.31;

                if (isWithinRadius(rider.currentLat, rider.currentLon, thamelLat, thamelLon, 5)) {
                    // Only alert if not notified recently (skipped for MVP simplicity)
                    await this.sendAlert(rider.id, "High Demand in Thamel! Head there for tasks.");
                }
            }
        }
    }

    async getAlerts(limit = 50) {
        return db.select()
            .from(predictiveAlerts)
            .orderBy(desc(predictiveAlerts.sentAt))
            .limit(limit);
    }

    async sendAlert(riderId: string, message: string) {
        // Log to DB
        await db.insert(predictiveAlerts).values({
            id: generateId(),
            riderId,
            message,
            targetLocation: { lat: 27.715, lon: 85.31, name: "Thamel" }
        });

        // Push Notification
        const [rider] = await db.select().from(riders).where(eq(riders.id, riderId));
        if (rider) {
            // Need User ID to send Push
            await notificationService.send(rider.userId, "Demand Alert", message, "SYSTEM");
        }
    }
}

export const tripService = new TripService();
export const predictiveService = new PredictiveService();
