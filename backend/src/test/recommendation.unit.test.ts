import { describe, expect, it } from "bun:test";
import { recommendationService } from "@/modules/analytics/recommendation.service";
import { recTypeEnum } from "@/db/schema/recommendations";

describe("Recommendation Engine", () => {
    it("should be defined", () => {
        expect(recommendationService).toBeDefined();
    });

    it("should have correct enum values", () => {
        expect(recTypeEnum.enumValues).toContain("ALSO_BOUGHT");
        expect(recTypeEnum.enumValues).toContain("SIMILAR");
    });

    it("should expose compute methods", async () => {
        // Smoke test the mock jobs
        const res = await recommendationService.computeTrending();
        expect(res.message).toBeDefined();

        const res2 = await recommendationService.computeCollaborative();
        expect(res2.message).toBeDefined();
    });
});
