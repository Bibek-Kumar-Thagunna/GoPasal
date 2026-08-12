import { Elysia } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/rbac";
import { retentionService } from "./retention.service";
import { userDataService } from "./user-data.service";
import { success } from "@/utils/response";

// User facing (Privacy)
export const privacyController = new Elysia({ prefix: "/api/v1/privacy" })
    .use(requireAuth())
    .get(
        "/export",
        async ({ auth }) => {
            const data = await userDataService.exportUserData(auth.userId, auth.userId);
            return success(data);
        },
        {
            detail: { tags: ["Privacy"], summary: "Export personal data" }
        }
    )
    .delete(
        "/account",
        async ({ auth }) => {
            await userDataService.softDeleteUser(auth.userId, auth.userId);
            return success({ message: "Account scheduled for deletion" });
        },
        {
            detail: { tags: ["Privacy"], summary: "Request account deletion" }
        }
    );

// Admin facing (Compliance Ops)
export const complianceController = new Elysia({ prefix: "/api/v1/admin/compliance" })
    .use(requireAuth())
    .use(requireRole("SUPER_ADMIN")) // Only Super Admin
    .post(
        "/run-jobs",
        async ({ auth: _auth }) => {
            const results = await retentionService.runAllJobs();
            return success(results);
        },
        {
            detail: { tags: ["Admin - Compliance"], summary: "Trigger retention jobs manually" }
        }
    );
