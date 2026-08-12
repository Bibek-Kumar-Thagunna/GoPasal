import { Elysia } from "elysia";
import { logger } from "@/shared/logger";

export const requestLoggerMiddleware = new Elysia({ name: "request-logger" })
    .derive(({ request }) => {
        void request;
        return {
            startTime: Date.now()
        };
    })
    .onAfterHandle(({ request, set, startTime }) => {
        const duration = Date.now() - startTime;
        const { method, url } = request;
        const status = set.status;
        const requestId = request.headers.get("x-request-id") || "unknown";

        logger.info({
            reqId: requestId,
            method,
            url: new URL(url).pathname,
            status,
            duration: `${duration}ms`
        }, "HTTP Request");
    });
