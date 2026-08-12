import pino from "pino";

export const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            ignore: "pid,hostname",
        },
    },
});

export const requestLogger = (ctx: any) => {
    const start = Date.now();
    return {
        afterHandle: () => {
            const duration = Date.now() - start;
            logger.info({
                method: ctx.request.method,
                url: ctx.request.url,
                status: ctx.set.status,
                duration: `${duration}ms`,
                requestId: ctx.request.headers.get("x-request-id"),
            });
        },
    };
};
