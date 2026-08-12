import {describe, expect, it, spyOn, beforeAll, mock, afterAll} from "bun:test";
import { GamificationService } from "@/modules/gamification/gamification.service";
import { db } from "@/db";

describe("Gamification Engine", () => {

    afterAll(() => {
        mock.restore();
    });
    let service: GamificationService;

    beforeAll(() => {
        service = new GamificationService();
    });

    it("should aggregate real delivery data into tiers", async () => {
        const base = new Date("2026-02-15T00:00:00.000Z");
        const within = (minsAgo: number) =>
            new Date(base.getTime() - minsAgo * 60000).toISOString();

        const mockRiders = [{ id: "r_diamond" }, { id: "r_bronze" }];
        const mockTasks: Record<string, any[]> = {
            r_diamond: [
                // 260 delivered on time (within 60 min of pickup)
                ...Array.from({ length: 260 }, () => ({
                    status: "DELIVERED",
                    deliveredAt: within(30),
                    pickedUpAt: within(75),
                    createdAt: base,
                })),
            ],
            r_bronze: [
                { status: "DELIVERED", deliveredAt: within(30), pickedUpAt: within(75), createdAt: base },
                { status: "FAILED", deliveredAt: null, pickedUpAt: null, createdAt: base },
            ],
        };

        const selectSpy = spyOn(db, "select").mockImplementation((() => {
            let call = 0;
            return {
                from: () => ({
                    where: () => {
                        call++;
                        // First select: riders (ONLINE), second: delivery tasks
                        return call === 1 ? Promise.resolve(mockRiders) : Promise.resolve([]);
                    },
                }),
            };
        }) as any);

        const riderOrder = ["r_diamond", "r_bronze"];
        let taskCall = 0;

        // Mock transaction to execute callback with a tx that returns tasks per rider,
        // in the order riders are processed.
        spyOn(db, "transaction").mockImplementation(async (cb: any) => {
            const tx = {
                select: () => ({
                    from: () => ({
                        where: () => {
                            const riderId = riderOrder[taskCall++] ?? null;
                            return Promise.resolve(riderId ? mockTasks[riderId] ?? [] : []);
                        },
                    }),
                }),
                insert: () => ({ values: () => Promise.resolve() }),
                update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
                delete: () => ({ where: () => Promise.resolve() }),
            };
            await cb(tx);
            return {} as any;
        });

        const results = await service.calculateMonthlyTiers("2026-02");

        const diamond = results.find((r) => r.riderId === "r_diamond");
        const bronze = results.find((r) => r.riderId === "r_bronze");

        // Diamond: 260 orders, 0% cancellation, 100% on-time.
        expect(diamond?.tier).toBe("DIAMOND");
        // Bronze: 1 delivered of 2 assigned -> 50% cancellation.
        expect(bronze?.tier).toBe("BRONZE");

        selectSpy.mockRestore();
    });

    it("should block instant payout for non-Diamond", async () => {
        spyOn(db, "select").mockReturnValue({
            from: () => ({
                where: () => Promise.resolve([{ id: "r_gold", tier: "GOLD" }]),
            }),
        } as any);

        const result = await service.checkInstantPayoutEligibility("r_gold", 500);
        expect(result.allowed).toBe(false);
    });

    it("should allow instant payout for Diamond", async () => {
        spyOn(db, "select").mockReturnValue({
            from: () => ({
                where: () => Promise.resolve([{ id: "r_dia", tier: "DIAMOND" }]),
            }),
        } as any);

        const result = await service.checkInstantPayoutEligibility("r_dia", 500);
        expect(result.allowed).toBe(true);
    });
});
