import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.string().default("3000"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    REDIS_URL: z.string().optional(), // Optional for dev, required for prod ideally
    JWT_SECRET: z.string().min(8, "JWT_SECRET must be at least 8 chars"),
    JWT_ACCESS_SECRET: z.string().default("access-secret-123"),
    JWT_REFRESH_SECRET: z.string().default("refresh-secret-123"),
    OTP_EXPIRY_SECONDS: z.coerce.number().default(300),
    /** Seller sign-up OTP: validated during onboarding (default 30m / 1800s). */
    SELLER_REGISTRATION_OTP_EXPIRY_SECONDS: z.coerce.number().default(1800),

    // Feature Flags
    ENABLE_ANALYTICS: z.string().transform((v) => v === "true").default("true"),

    // Storage (Video Stories) - Optional for now
    ALLOWED_ORIGINS: z.string().default("*"),
    RATE_LIMIT_MAX: z.coerce.number().default(1000),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 mins
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().optional(),
    S3_ACCESS_KEY: z.string().optional(),
    S3_SECRET_KEY: z.string().optional(),

    // Payments (Khalti / eSewa)
    KHALTI_SECRET_KEY: z.string().optional(),
    KHALTI_BASE_URL: z.string().default("https://dev.khalti.com/api/v2"),
    ESEWA_MERCHANT_ID: z.string().optional(),
    ESEWA_SECRET_KEY: z.string().optional(),
    ESEWA_BASE_URL: z.string().default("https://rc-epay.esewa.com.np"),
    ESEWA_MOCK_ENABLED: z
        .string()
        .transform((v) => v === "true")
        .default("false"),
    /** Customer web base URL used for Khalti return_url (must be HTTPS in production). */
    PUBLIC_WEB_URL: z.string().default("http://localhost:8081"),
    /** Public API base (eSewa launch redirect, webhooks). */
    PUBLIC_API_URL: z.string().default("http://localhost:3000"),
    PAYMENT_RETURN_PATH: z.string().default("/payment/return"),

    // SkyPay assisted aggregator (primary when enabled)
    SKYPAY_API_KEY: z.string().optional(),
    SKYPAY_API_SECRET: z.string().optional(),
    SKYPAY_MERCHANT_ID: z.string().optional(),
    SKYPAY_BASE_URL: z.string().default("https://api.skypay.example/v1"),
    SKYPAY_WEBHOOK_SECRET: z.string().optional(),
    SKYPAY_MOCK_ENABLED: z
        .string()
        .transform((v) => v === "true")
        .default("false"),
    SKYPAY_ENABLED: z
        .string()
        .transform((v) => v === "true")
        .default("false"),

    // Google OAuth (admin + customer social login)
    GOOGLE_CLIENT_ID: z.string().optional(),

    // SMS (UniMatrix & Sparrow SMS)
    UNIMTX_ACCESS_KEY_ID: z.string().optional(),
    UNIMTX_ACCESS_KEY_SECRET: z.string().optional(),
    SPARROW_SMS_TOKEN: z.string().optional(),
    SPARROW_SMS_FROM: z.string().default("GoPasal"),

    // Email (Resend)
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default("GoPasal <noreply@gopasal.com>"),

    // AI / search embeddings (OpenAI-compatible embeddings endpoint)
    OPENAI_API_KEY: z.string().optional(),
});

// Parse and validate
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error("❌ Invalid environment variables:", _env.error.format());
    throw new Error("Invalid environment variables");
}

const envData = _env.data;

// ─── Production hardening: fail fast on unsafe defaults ────────────────
const isProduction = envData.NODE_ENV === "production";

const WEAK_SECRETS = [
    "access-secret-123",
    "refresh-secret-123",
    "change-me-access-secret-min-32-chars",
    "change-me-refresh-secret-min-32-chars",
    "dev-access-secret-change-in-production-32chars",
    "dev-jwt-secret-very-secure-32-chars",
];

const accessSecret = envData.JWT_ACCESS_SECRET;
const refreshSecret = envData.JWT_REFRESH_SECRET;

if (isProduction) {
    const weak =
        WEAK_SECRETS.includes(accessSecret) ||
        WEAK_SECRETS.includes(refreshSecret);

    if (weak || accessSecret.length < 32 || refreshSecret.length < 32) {
        throw new Error(
            "❌ Production requires strong JWT_ACCESS_SECRET and JWT_REFRESH_SECRET " +
                "(>= 32 chars, not the bundled defaults). Generate with: openssl rand -hex 32"
        );
    }

    if (envData.ALLOWED_ORIGINS === "*" || !envData.ALLOWED_ORIGINS.trim()) {
        throw new Error(
            "❌ Production requires ALLOWED_ORIGINS to be an explicit comma-separated allow-list (e.g. https://app.gopasal.com). Wildcard CORS is forbidden."
        );
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        throw new Error(
            "❌ Production requires JWT_SECRET (>= 32 chars). Generate with: openssl rand -hex 32"
        );
    }

    // Mock payment paths must never run in production.
    if (envData.ESEWA_MOCK_ENABLED) {
        throw new Error("❌ ESEWA_MOCK_ENABLED=true is forbidden in production.");
    }
    if (envData.SKYPAY_MOCK_ENABLED) {
        throw new Error("❌ SKYPAY_MOCK_ENABLED=true is forbidden in production.");
    }

    // Payment providers without credentials fail loudly instead of silently
    // serving sandbox/mock behavior.
    if (envData.SKYPAY_ENABLED && !envData.SKYPAY_API_KEY) {
        throw new Error("❌ SKYPAY_ENABLED=true requires SKYPAY_API_KEY.");
    }
    if (envData.KHALTI_BASE_URL.includes("dev.") && !envData.KHALTI_SECRET_KEY) {
        throw new Error(
            "❌ Production must use the live Khalti endpoint (KHALTI_BASE_URL) with KHALTI_SECRET_KEY set."
        );
    }
    if (!envData.REDIS_URL) {
        throw new Error(
            "❌ Production requires REDIS_URL (used for flash-sale reservations and rate limiting)."
        );
    }
}

export const env = envData;
