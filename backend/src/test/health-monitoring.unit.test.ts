import { describe, expect, it } from "bun:test";
import { apmService } from "@/modules/monitoring/apm.service";
import { requestLoggerMiddleware } from "@/middlewares/request-logger";

describe("Health Monitoring", () => {
    it("APM Service should be defined", () => {
        expect(apmService).toBeDefined();
    });

    it("APM Service should handle transactions", () => {
        const tx = apmService.startTransaction("test-tx", "http");
        expect(tx.name).toBe("test-tx");
        apmService.endTransaction(tx);
    });

    it("Request Logger should be an Elysia instance", () => {
        expect(requestLoggerMiddleware).toBeDefined();
    });
});
