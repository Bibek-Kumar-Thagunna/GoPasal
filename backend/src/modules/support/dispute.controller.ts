import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/rbac";
import { disputeService } from "./dispute.service";
import { success, created } from "@/utils/response";

// Public / User facing
export const disputeController = new Elysia({ prefix: "/api/v1/disputes" })
    .use(requireAuth())
    .post(
        "/",
        async ({ body, auth }) => {
            const result = await disputeService.createDispute(body.orderId, auth.userId, body.reason);
            return created(result);
        },
        {
            body: t.Object({
                orderId: t.String(),
                reason: t.String({ minLength: 5 }),
            }),
            detail: { tags: ["Support"], summary: "Report a dispute" }
        }
    )
    .post(
        "/:id/messages",
        async ({ params, body, auth }) => {
            // Need to fetch user role to pass it.
            // Simplified: We assume auth.roles contains the primary role or we fetch profile.
            // ideally auth middleware provides this.
            // For now, hardcode "USER" or fetch from service if needed.
            // Let's pass "UNKNOWN" and let service/audit figure it out, OR assume CUSTOMER/SELLER based on ID check.
            // Better: Pass "USER" generic or extend auth type.
            const roles = auth.roles ?? [];
            const role = roles.includes("SUPER_ADMIN") || roles.includes("PLATFORM_OPERATOR")
                ? "ADMIN"
                : roles.some((r) => r.startsWith("SELLER"))
                  ? "SELLER"
                  : "USER";
            const result = await disputeService.addMessage(params.id, auth.userId, role, body.message);
            return created(result);
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({ message: t.String() }),
            detail: { tags: ["Support"], summary: "Add message to dispute" }
        }
    )
    .get(
        "/:id/messages",
        async ({ params }) => {
            const result = await disputeService.getDisputeMessages(params.id);
            return success(result);
        },
        {
            params: t.Object({ id: t.String() }),
            detail: { tags: ["Support"], summary: "Get dispute messages" }
        }
    );

// Admin facing
export const adminDisputeController = new Elysia({ prefix: "/api/v1/admin/disputes" })
    .use(requireAuth())
    .use(requireRole("SUPER_ADMIN", "PLATFORM_OPERATOR"))
    .get(
        "/",
        async ({ query }) => {
            const result = await disputeService.listDisputes(query.status as any);
            return success(result);
        },
        {
            query: t.Object({
                status: t.Optional(t.String()),
            }),
            detail: { tags: ["Admin - Support"], summary: "List disputes" }
        }
    )
    .put(
        "/:id/resolve",
        async ({ params, body, auth }) => {
            const result = await disputeService.resolveDispute(
                params.id,
                auth.userId,
                {
                    action: body.action,
                    refundAmount: body.refundAmount,
                    notes: body.notes
                }
            );
            return success(result);
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({
                action: t.Union([
                    t.Literal("REFUND"),
                    t.Literal("RELEASE"),
                    t.Literal("REJECT"),
                ]),
                refundAmount: t.Optional(t.String()),
                notes: t.Optional(t.String()),
            }),
            detail: { tags: ["Admin - Support"], summary: "Resolve dispute with action" }
        }
    )
    .get(
        "/:id/messages",
        async ({ params }) => {
            const result = await disputeService.getDisputeMessages(params.id);
            return success(result);
        },
        {
            params: t.Object({ id: t.String() }),
            detail: { tags: ["Admin - Support"], summary: "Get dispute thread" },
        }
    )
    .post(
        "/:id/messages",
        async ({ params, body, auth }) => {
            const result = await disputeService.addMessage(
                params.id,
                auth.userId,
                "ADMIN",
                body.message
            );
            return created(result);
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({ message: t.String({ minLength: 1 }) }),
            detail: { tags: ["Admin - Support"], summary: "Reply on dispute thread" },
        }
    );
