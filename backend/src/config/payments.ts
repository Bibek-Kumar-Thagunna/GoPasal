import { env } from "@/config/env";

export type OnlinePaymentProvider = "KHALTI" | "ESEWA";

export function isKhaltiEnabled(): boolean {
    return Boolean(env.KHALTI_SECRET_KEY?.trim());
}

export function isEsewaLiveEnabled(): boolean {
    return Boolean(
        env.ESEWA_MERCHANT_ID?.trim() && env.ESEWA_SECRET_KEY?.trim()
    );
}

export function isEsewaEnabled(): boolean {
    return env.ESEWA_MOCK_ENABLED || isEsewaLiveEnabled();
}

export function getEsewaReturnUrl(orderId: string): string {
    const base = env.PUBLIC_WEB_URL.replace(/\/$/, "");
    const path = env.PAYMENT_RETURN_PATH.startsWith("/")
        ? env.PAYMENT_RETURN_PATH
        : `/${env.PAYMENT_RETURN_PATH}`;
    const url = new URL(`${base}${path}`);
    url.searchParams.set("orderId", orderId);
    url.searchParams.set("provider", "ESEWA");
    return url.toString();
}

export function getPublicApiUrl(): string {
    return env.PUBLIC_API_URL.replace(/\/$/, "");
}

export function isSkyPayEnabled(): boolean {
    if (env.SKYPAY_ENABLED) return true;
    return Boolean(
        env.SKYPAY_MOCK_ENABLED ||
            (env.SKYPAY_API_KEY?.trim() && env.SKYPAY_API_SECRET?.trim())
    );
}

export function getPaymentCapabilities() {
    const skyPay = isSkyPayEnabled();
    const devOnline =
        env.NODE_ENV === "development" &&
        (env.ESEWA_MOCK_ENABLED || env.SKYPAY_MOCK_ENABLED);
    return {
        cod: true,
        khalti: skyPay || isKhaltiEnabled() || devOnline,
        esewa: skyPay || isEsewaEnabled() || devOnline,
        fonepay: skyPay,
        skypay: skyPay,
        aggregator: skyPay ? "SKYPAY" : "DIRECT",
        minOnlineAmountPaisa: 1000,
    };
}

export function getBillingReturnUrl(
    billingIntentId: string,
    purpose: "SUBSCRIPTION" | "STORE_MARKETING",
    channel: string
): string {
    const base = env.PUBLIC_WEB_URL.replace(/\/$/, "");
    const path = env.PAYMENT_RETURN_PATH.startsWith("/")
        ? env.PAYMENT_RETURN_PATH
        : `/${env.PAYMENT_RETURN_PATH}`;
    const url = new URL(`${base}${path}`);
    url.searchParams.set("billingIntentId", billingIntentId);
    url.searchParams.set("purpose", purpose);
    url.searchParams.set(
        "provider",
        channel === "ESEWA" ? "ESEWA" : "KHALTI"
    );
    return url.toString();
}

export function getKhaltiReturnUrl(orderId: string): string {
    const base = env.PUBLIC_WEB_URL.replace(/\/$/, "");
    const path = env.PAYMENT_RETURN_PATH.startsWith("/")
        ? env.PAYMENT_RETURN_PATH
        : `/${env.PAYMENT_RETURN_PATH}`;
    const url = new URL(`${base}${path}`);
    url.searchParams.set("orderId", orderId);
    url.searchParams.set("provider", "KHALTI");
    return url.toString();
}

export function getWebsiteUrl(): string {
    return env.PUBLIC_WEB_URL.replace(/\/$/, "");
}

export function amountToPaisa(amountNpr: number): number {
    return Math.round(amountNpr * 100);
}
