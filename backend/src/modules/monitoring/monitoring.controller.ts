import { Elysia } from "elysia";
import { requireAuth } from "@/middlewares";
import { requireRole } from "@/middlewares/rbac";
import { success } from "@/utils/response";
import { apmService } from "./apm.service";

export const monitoringController = new Elysia({ prefix: "/api/v1/monitoring" })
    .use(requireAuth())
    .use(requireRole("SUPER_ADMIN"))
    .get(
        "/health",
        async () => {
            const metrics = apmService.getHealth();
            return success(metrics);
        },
        {
            detail: { tags: ["Monitoring"], summary: "Basic APM metrics" },
        }
    )
    .get(
        "/errors",
        async () => {
            const errors = apmService.getErrors();
            return success(errors);
        },
        {
            detail: { tags: ["Monitoring"], summary: "Recent errors" },
        }
    );
