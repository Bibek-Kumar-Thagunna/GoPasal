import { describe, expect, it, spyOn, beforeAll } from "bun:test";
import { DeliveryService } from "@/modules/delivery/delivery.service";
import { db } from "@/db";

// Mock Data
const mockGasRider = { id: "r2", userId: "u2", status: "ONLINE", isEV: false, isVerified: true };
const mockEVRider = { id: "r1", userId: "u1", status: "ONLINE", isEV: true, isVerified: true };

const now = new Date();
const twentyMinsAgo = new Date(now.getTime() - 20 * 60 * 1000);

const mockTasks = [
    { taskId: "t1", orderId: "o1", isGreenDelivery: true, createdAt: now },       // Fresh Green
    { taskId: "t2", orderId: "o2", isGreenDelivery: true, createdAt: twentyMinsAgo }, // Old Green
    { taskId: "t3", orderId: "o3", isGreenDelivery: false, createdAt: now }       // Standard
];

describe("Green Delivery Logic", () => {
    let service: DeliveryService;

    beforeAll(() => {
        service = new DeliveryService();
    });

    it("should hide fresh green orders from Gas riders", async () => {
        // We need to mock the implementation of db.select to handle the two different calls
        // 1. Rider lookup
        // 2. Task lookup

        let callCount = 0;
        const selectSpy = spyOn(db, 'select').mockImplementation((..._args: any[]) => {
            callCount++;
            return {
                from: (_table: any) => {
                    return {
                        where: () => Promise.resolve([mockGasRider]), // Rider Lookup
                        innerJoin: () => ({
                            innerJoin: () => ({
                                leftJoin: () => ({
                                    where: () => ({
                                        orderBy: () => Promise.resolve(mockTasks) // Task Lookup
                                    })
                                })
                            })
                        })
                    }
                }
            } as any;
        });

        const tasks = await service.findAvailableTasks("u2"); // Gas Rider

        // Expect t1 hidden (Green/Fresh)
        // Expect t2 visible (Green/Old)
        // Expect t3 visible (Standard)
        const ids = tasks.map((t: any) => t.taskId);
        expect(ids).not.toContain("t1");
        expect(ids).toContain("t2");
        expect(ids).toContain("t3");

        selectSpy.mockRestore();
    });

    it("should show fresh green orders to EV riders", async () => {
        const selectSpy = spyOn(db, 'select').mockImplementation((..._args: any[]) => {
            return {
                from: (_table: any) => {
                    return {
                        where: () => Promise.resolve([mockEVRider]), // EV Rider
                        innerJoin: () => ({
                            innerJoin: () => ({
                                leftJoin: () => ({
                                    where: () => ({
                                        orderBy: () => Promise.resolve(mockTasks)
                                    })
                                })
                            })
                        })
                    }
                }
            } as any;
        });

        const tasks = await service.findAvailableTasks("u1"); // EV Rider

        // All should be visible
        const ids = tasks.map((t: any) => t.taskId);
        expect(ids).toContain("t1");
        expect(ids).toContain("t2");
        expect(ids).toContain("t3");

        selectSpy.mockRestore();
    });
});
