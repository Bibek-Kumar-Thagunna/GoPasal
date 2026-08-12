import { Elysia } from "elysia";
import { env } from "@/config";

export const securityHeaders = new Elysia({ name: "security-headers" })
    .onBeforeHandle({ as: "global" }, ({ set }) => {
        set.headers["X-Content-Type-Options"] = "nosniff";
        set.headers["X-Frame-Options"] = "DENY";
        set.headers["X-XSS-Protection"] = "0"; // Modern browsers: rely on CSP instead
        set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        set.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";

        if (env.NODE_ENV === "production") {
            set.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
            set.headers["Content-Security-Policy"] = "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; font-src 'self' data: https:; connect-src 'self' https:; img-src 'self' data: https: blob:;";
        }
    });
