import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/rbac";
import { db } from "@/db";
import { users } from "@/db/schema";
import { notificationService } from "@/modules/customer/notification.service";
import { success, created } from "@/utils/response";
import { NotFoundError } from "@/utils/errors";

export const adminNotificationsController = new Elysia({
    prefix: "/api/v1/admin/notifications",
})
    .use(requireAuth())
    .use(requireRole("SUPER_ADMIN", "PLATFORM_OPERATOR"))
    .post(
        "/send",
        async ({ body }) => {
            let userId = body.userId?.trim();
            if (!userId && body.phone?.trim()) {
                const [user] = await db
                    .select({ id: users.id })
                    .from(users)
                    .where(eq(users.phone, body.phone.trim()))
                    .limit(1);
                if (!user) throw new NotFoundError("No user with that phone");
                userId = user.id;
            }
            if (!userId) {
                throw new NotFoundError("userId or phone is required");
            }
            await notificationService.send(
                userId,
                body.title,
                body.message,
                body.type ?? "INFO",
                body.metadata
            );
            return created({ success: true, userId });
        },
        {
            body: t.Object({
                userId: t.Optional(t.String()),
                phone: t.Optional(t.String()),
                title: t.String({ minLength: 1 }),
                message: t.String({ minLength: 1 }),
                type: t.Optional(t.String()),
                metadata: t.Optional(t.Record(t.String(), t.Unknown())),
            }),
            detail: { tags: ["Admin - Notifications"], summary: "Send in-app notification to a user" },
        }
    )
    .post(
        "/broadcast",
        async ({ body }) => {
            const activeUsers = await db
                .select({ id: users.id })
                .from(users)
                .where(eq(users.isActive, true))
                .limit(Math.min(body.limit ?? 500, 2000));

            for (const u of activeUsers) {
                await notificationService.send(
                    u.id,
                    body.title,
                    body.message,
                    body.type ?? "INFO"
                );
            }
            return success({ sent: activeUsers.length });
        },
        {
            body: t.Object({
                title: t.String({ minLength: 1 }),
                message: t.String({ minLength: 1 }),
                type: t.Optional(t.String()),
                limit: t.Optional(t.Integer({ minimum: 1, maximum: 2000 })),
            }),
            detail: {
                tags: ["Admin - Notifications"],
                summary: "Broadcast in-app notification to active users (capped)",
            },
        }
    );
