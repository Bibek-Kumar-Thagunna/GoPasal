import { describe, expect, it } from "bun:test";
import { analyticsService } from "@/modules/analytics/analytics.service";
import { metricTypeEnum } from "@/db/schema/analytics";

describe("Analytics Engine", () => {
    it("should be defined", () => {
        expect(analyticsService).toBeDefined();
    });

    it("should have correct enums", () => {
        expect(metricTypeEnum.enumValues).toContain("SALES");
        expect(metricTypeEnum.enumValues).toContain("RETENTION");
    });

    it("should allow computing metrics", async () => {
        // Runs the mock aggregation logic
        const res = await analyticsService.computeDailyMetrics(new Date());
        expect(res.message).toBe("Daily metrics computed");
        expect(res.date).toBeDefined();
    });
});
