import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/rbac";
import { adminService } from "./admin.service";
import { success } from "@/utils/response";

export const adminGovernanceController = new Elysia({ prefix: "/api/v1/admin/governance" })
    .use(requireAuth())
    .use(requireRole("SUPER_ADMIN", "PLATFORM_OPERATOR")) // platform staff

    // Seller Management
    .post(
        "/sellers/:storeId/approve",
        async ({ params, auth }) => {
            const result = await adminService.approveSeller(params.storeId, auth.userId);
            return success(result);
        },
        {
            params: t.Object({ storeId: t.String() }),
            detail: { tags: ["Admin - Governance"], summary: "Approve Seller" }
        }
    )
    .post(
        "/sellers/:storeId/suspend",
        async ({ params, body, auth }) => {
            const result = await adminService.suspendSeller(params.storeId, body.reason, auth.userId);
            return success(result);
        },
        {
            params: t.Object({ storeId: t.String() }),
            body: t.Object({ reason: t.String() }),
            detail: { tags: ["Admin - Governance"], summary: "Suspend Seller" }
        }
    )
    .post(
        "/sellers/:storeId/reject",
        async ({ params, body, auth }) => {
            const result = await adminService.rejectSeller(
                params.storeId,
                body.reason,
                auth.userId
            );
            return success(result);
        },
        {
            params: t.Object({ storeId: t.String() }),
            body: t.Object({ reason: t.String({ minLength: 3 }) }),
            detail: { tags: ["Admin - Governance"], summary: "Reject seller KYC application" },
        }
    )
    .post(
        "/sellers/:storeId/resend-setup",
        async ({ params, auth }) => {
            const result = await adminService.resendSellerToSetup(
                params.storeId,
                auth.userId
            );
            return success(result);
        },
        {
            params: t.Object({ storeId: t.String() }),
            detail: {
                tags: ["Admin - Governance"],
                summary: "Clear onboarding completion so seller sees setup wizard again",
            },
        }
    )
    .get(
        "/settlements",
        async ({ query }) => {
            const page = query.page ? parseInt(query.page, 10) : 1;
            const limit = query.limit ? parseInt(query.limit, 10) : 20;
            const result = await adminService.listSettlements(
                page,
                limit,
                query.storeId
            );
            return success(result);
        },
        {
            query: t.Object({
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
                storeId: t.Optional(t.String()),
            }),
            detail: { tags: ["Admin - Governance"], summary: "List settlement batches" },
        }
    )

    // Financial Actions
    .post(
        "/refunds",
        async ({ body, auth }) => {
            const result = await adminService.triggerRefund(body.orderId, body.amount, body.reason, auth.userId);
            return success(result);
        },
        {
            body: t.Object({
                orderId: t.String(),
                amount: t.String(),
                reason: t.String()
            }),
            detail: { tags: ["Admin - Governance"], summary: "Force Refund" }
        }
    )
    .post(
        "/settlements/generate",
        async ({ body, auth }) => {
            const result = await adminService.triggerSettlement(
                body.storeId,
                new Date(body.periodStart),
                new Date(body.periodEnd),
                auth.userId
            );
            return success(result);
        },
        {
            body: t.Object({
                storeId: t.String(),
                periodStart: t.String(), // ISO Date
                periodEnd: t.String()   // ISO Date
            }),
            detail: { tags: ["Admin - Governance"], summary: "Trigger Settlement Cycle" }
        }
    )
    .post(
        "/settlements/:id/payout",
        async ({ params, body, auth }) => {
            // Payouts might be SUPER_ADMIN only. Ideally strict check here.
            // For now, we rely on the service logging and standard ADMIN role.
            const result = await adminService.executePayout(params.id, body.transactionRef, auth.userId);
            return success(result);
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({ transactionRef: t.String() }),
            detail: { tags: ["Admin - Governance"], summary: "Execute Payout" }
        }
    )
    .get(
        "/webhooks",
        async ({ query }) => {
            const page = query.page ? parseInt(query.page, 10) : 1;
            const limit = query.limit ? parseInt(query.limit, 10) : 25;
            const result = await adminService.listWebhookEvents(page, limit, query.status);
            return success(result);
        },
        {
            query: t.Object({
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
                status: t.Optional(t.String()),
            }),
            detail: { tags: ["Admin - Governance"], summary: "List payment webhook events" },
        }
    )
    .get(
        "/cod-records",
        async ({ query }) => {
            const page = query.page ? parseInt(query.page, 10) : 1;
            const limit = query.limit ? parseInt(query.limit, 10) : 25;
            const result = await adminService.listCodRecords(page, limit);
            return success(result);
        },
        {
            query: t.Object({
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
            }),
            detail: { tags: ["Admin - Governance"], summary: "COD collection records for reconciliation" },
        }
    );
