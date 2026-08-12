import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/rbac";
import { GamificationService } from "./gamification.service";
import { db } from "@/db";
import { riderLeaderboards } from "@/db/schema/gamification";
import { riders } from "@/db/schema/delivery";
import { eq, desc } from "drizzle-orm";
import { NotFoundError } from "@/utils/errors";

const gamificationService = new GamificationService();

export const gamificationController = new Elysia({ prefix: "/gamification" })
    .use(requireAuth())

    // --- Admin Triggers (In Prod: Cron Jobs) ---
    .group("/admin", (app) => app
        .use(requireRole("SUPER_ADMIN"))
        .post("/compute-tiers", async ({ body }) => {
            return await gamificationService.calculateMonthlyTiers(body.yearMonth);
        }, {
            body: t.Object({ yearMonth: t.String() })
        })
        .post("/compute-leaderboard", async ({ body }) => {
            return await gamificationService.computeLeaderboard(body.yearMonth);
        }, {
            body: t.Object({ yearMonth: t.String() })
        })
        .post("/assign-badges", async () => {
            return { assigned: await gamificationService.assignSellerBadges() };
        })
    )

    // --- Public/Rider/Seller APIs ---

    .get("/rider/:id/tier", async ({ params }) => {
        const [rider] = await db
            .select({ id: riders.id, tier: riders.tier })
            .from(riders)
            .where(eq(riders.id, params.id));
        if (!rider) throw new NotFoundError("Rider not found");
        return { riderId: rider.id, tier: rider.tier ?? "BRONZE" };
    })

    .get("/rider/check-payout/:id", async ({ params, query }) => {
        const amount = Number(query.amount || 0);
        return await gamificationService.checkInstantPayoutEligibility(params.id, amount);
    })

    .get("/leaderboard", async ({ query }) => {
        const yearMonth = (query.yearMonth as string | undefined) ??
            new Date().toISOString().slice(0, 7);
        const entries = await db
            .select()
            .from(riderLeaderboards)
            .where(eq(riderLeaderboards.yearMonth, yearMonth))
            .orderBy(desc(riderLeaderboards.rank))
            .limit(50);
        return { yearMonth, entries };
    });