type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
    requestId?: string;
    tenantId?: string;
    actorId?: string;
    [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, context?: LogContext) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...context,
    };
    return JSON.stringify(entry);
}

export const logger = {
    debug(message: string, context?: LogContext) {
        if (process.env.NODE_ENV === "development") {
            console.debug(formatLog("debug", message, context));
        }
    },

    info(message: string, context?: LogContext) {
        console.info(formatLog("info", message, context));
    },

    warn(message: string, context?: LogContext) {
        console.warn(formatLog("warn", message, context));
    },

    error(message: string, context?: LogContext) {
        console.error(formatLog("error", message, context));
    },
};
