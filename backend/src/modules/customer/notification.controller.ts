import { Elysia } from "elysia";
import { notificationService, notificationEvents } from "./notification.service";
import { requireAuth } from "../../middlewares/auth";
import { success } from "@/utils/response";

export const notificationController = new Elysia({ prefix: "/api/v1/notifications" })
    .use(requireAuth())
    .get("/", async ({ auth }) => {
        const result = await notificationService.list(auth!.userId);
        return success(result);
    })
    .get("/stream", ({ auth, request }) => {
        let pingInterval: NodeJS.Timeout;
        let listener: (data: any) => void;

        const stream = new ReadableStream({
            start(controller) {
                // Send initial payload to flush headers immediately
                controller.enqueue(new TextEncoder().encode("data: connected\n\n"));

                // Keep-alive ping every 30 seconds
                pingInterval = setInterval(() => {
                    controller.enqueue(new TextEncoder().encode("data: ping\n\n"));
                }, 30000);

                listener = (data: any) => {
                    if (data.userId === auth!.userId) {
                        const payload = `data: ${JSON.stringify(data.notification)}\n\n`;
                        controller.enqueue(new TextEncoder().encode(payload));
                    }
                };
                notificationEvents.on("new", listener);
            },
            cancel() {
                clearInterval(pingInterval);
                if (listener) notificationEvents.off("new", listener);
            }
        });
        
        request.signal.addEventListener("abort", () => {
            clearInterval(pingInterval);
            if (listener) notificationEvents.off("new", listener);
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no',
            }
        });
    })
    .patch("/:id/read", async ({ auth, params: { id } }) => {
        await notificationService.markRead(id, auth!.userId);
        return success({ message: "Notification marked as read" });
    })
    .delete("/:id", async ({ auth, params: { id } }) => {
        await notificationService.delete(id, auth!.userId);
        return success({ message: "Notification deleted" });
    })
    .delete("/", async ({ auth }) => {
        await notificationService.deleteAll(auth!.userId);
        return success({ message: "All notifications deleted" });
    });
