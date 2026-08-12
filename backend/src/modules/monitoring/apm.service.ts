import { logger } from "@/shared/logger";

export class ApmService {
    private errorLog: Array<{ at: string; error: string }> = [];

    startTransaction(name: string, type: string) {
        // In real APM (e.g. Sentry/Datadog), we would return a transaction object
        // logger.debug({ transaction: name, type }, "APM: Transaction Started");
        return { name, type, startTime: Date.now() };
    }

    endTransaction(transaction: any) {
        const duration = Date.now() - (transaction.startTime ?? Date.now());
        if (duration > 100) {
            logger.warn(
                { name: transaction.name, durationMs: duration },
                "APM: Slow transaction"
            );
        }
    }

    startSpan(name: string) {
        return { name, startTime: Date.now() };
    }

    endSpan(span: any) {
        const duration = Date.now() - (span.startTime ?? Date.now());
        if (duration > 100) {
            logger.warn({ name: span.name, durationMs: duration }, "APM: Slow span");
        }
    }

    captureError(error: any) {
        this.errorLog.push({
            at: new Date().toISOString(),
            error: error instanceof Error ? error.message : String(error),
        });
        logger.error({ err: error }, "APM: Error Captured");
    }

    getHealth() {
        return {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
        };
    }

    getErrors(limit = 50) {
        const capped = Math.min(Math.max(limit, 1), 500);
        return this.errorLog.slice(-capped);
    }
}

export const apmService = new ApmService();
