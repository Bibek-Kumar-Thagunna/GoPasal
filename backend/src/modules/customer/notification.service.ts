import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateId } from "@/utils";
import { logger } from "@/shared/logger";
import { sendSms } from "@/integrations/sms.service";
import { sendEmail, orderStatusEmailHtml } from "@/integrations/email.service";
import { EventEmitter } from "node:events";

export const notificationEvents = new EventEmitter();

function isDeliverablePhone(phone: string | null | undefined): phone is string {
    if (!phone) return false;
    if (phone.startsWith("google_")) return false;
    if (phone.startsWith("social_")) return false;
    return phone.replace(/\D/g, "").length >= 10;
}

export class NotificationService {
    async send(
        userId: string,
        title: string,
        message: string,
        type: string = "INFO",
        metadata?: Record<string, unknown>
    ) {
        const notificationId = generateId();
        await db.insert(notifications).values({
            id: notificationId,
            userId,
            title,
            message,
            type,
            metadata: metadata ? JSON.stringify(metadata) : null,
        });

        notificationEvents.emit("new", { 
            userId, 
            notification: { 
                id: notificationId, 
                title, 
                message, 
                type, 
                metadata: metadata ? JSON.stringify(metadata) : null, 
                isRead: false, 
                createdAt: new Date().toISOString() 
            } 
        });

        this.sendPush(userId, title, message, metadata).catch(err => 
            logger.error({ err }, "Background Push failed")
        );

        if (type === "OTP" || type === "ORDER_UPDATE") {
            this.sendSmsToUser(userId, message).catch(err => 
                logger.error({ err }, "Background SMS failed")
            );
        }

        if (type === "ORDER_UPDATE" || type === "INVOICE" || type === "WELCOME") {
            this.sendEmailToUser(userId, title, message, metadata).catch(err => 
                logger.error({ err }, "Background Email failed")
            );
        }
    }

    private async sendPush(userId: string, title: string, message: string, metadata?: Record<string, unknown>) {
        const [user] = await db
            .select({ pushToken: users.pushToken })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!user?.pushToken || !user.pushToken.startsWith("ExponentPushToken")) return;

        try {
            const res = await fetch("https://exp.host/--/api/v2/push/send", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Accept-encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    to: user.pushToken,
                    sound: "default",
                    title,
                    body: message,
                    data: metadata,
                    channelId: "default"
                }),
            });
            const data = await res.json();
            if (data.data?.status === "error" || data.errors) {
                logger.error({ userId, response: data }, "Expo push API returned an error");
            } else {
                logger.info({ userId, ticketId: data.data?.id }, "Expo push sent successfully");
            }
        } catch (err) {
            logger.error({ userId, err: String(err) }, "Expo push network request failed");
        }
    }

    private async sendSmsToUser(userId: string, message: string) {
        const [user] = await db
            .select({ phone: users.phone })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!isDeliverablePhone(user?.phone)) return;

        try {
            await sendSms(user.phone, message);
        } catch (err) {
            logger.error({ userId, err: String(err) }, "SMS to user failed");
        }
    }

    private async sendEmailToUser(
        userId: string,
        subject: string,
        body: string,
        metadata?: Record<string, unknown>
    ) {
        const [user] = await db
            .select({ email: users.email })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!user?.email || !user.email.includes("@")) return;

        const orderId =
            typeof metadata?.orderId === "string" ? metadata.orderId : undefined;
        const status =
            typeof metadata?.status === "string" ? metadata.status : body;

        try {
            await sendEmail({
                to: user.email,
                subject: `GoPasal — ${subject}`,
                html: orderId
                    ? orderStatusEmailHtml(orderId, status)
                    : `<p>${body}</p>`,
                text: body,
            });
        } catch (err) {
            logger.error({ userId, err: String(err) }, "Email to user failed");
        }
    }

    async list(userId: string, limit = 20) {
        return await db
            .select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt))
            .limit(limit);
    }

    async markRead(notificationId: string, userId: string) {
        await db
            .update(notifications)
            .set({ isRead: true })
            .where(
                and(eq(notifications.id, notificationId), eq(notifications.userId, userId))
            );
    }

    async delete(notificationId: string, userId: string) {
        await db
            .delete(notifications)
            .where(
                and(eq(notifications.id, notificationId), eq(notifications.userId, userId))
            );
    }

    async deleteAll(userId: string) {
        await db
            .delete(notifications)
            .where(eq(notifications.userId, userId));
    }
}

export const notificationService = new NotificationService();
