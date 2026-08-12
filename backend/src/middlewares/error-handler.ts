import { Elysia } from "elysia";
import { AppError } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { error as errorResponse } from "@/utils/response";
import { env } from "@/config";

export const errorHandler = new Elysia({ name: "error-handler" }).onError(
    { as: "global" },
    ({ error, code, set }) => {
        if (error instanceof AppError) {
            set.status = error.statusCode as any;
            logger.warn(error.message, {
                code: error.code,
                statusCode: String(error.statusCode),
            });
            return errorResponse(error.code, error.message, (error as any).details);
        }

        if (code === "VALIDATION") {
            set.status = 422;
            return errorResponse("VALIDATION_ERROR", "Validation failed");
        }

        if (code === "NOT_FOUND") {
            set.status = 404;
            return errorResponse("NOT_FOUND", "Route not found");
        }

        const err = error as Error;
        const cause = (err as Error & { cause?: { message?: string; code?: string } }).cause;
        logger.error("Unhandled error", {
            error: err?.message || "Unknown error",
            ...(cause && { causeMessage: cause.message, causeCode: cause.code }),
            ...(env.NODE_ENV !== "production" && { stack: err?.stack }),
        });

        set.status = 500;
        const devDetails =
            env.NODE_ENV !== "production" && cause?.message
                ? { database: cause.message, code: cause.code }
                : undefined;
        return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", devDetails);
    }
);
