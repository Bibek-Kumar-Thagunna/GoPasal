import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/config/env";

type LaunchPayload = {
    orderId: string;
    userId: string;
    exp: number;
};

function signPayload(encoded: string): string {
    return createHmac("sha256", env.JWT_SECRET).update(encoded).digest("base64url");
}

export function createPaymentLaunchToken(orderId: string, userId: string, ttlSeconds = 900): string {
    const payload: LaunchPayload = {
        orderId,
        userId,
        exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${encoded}.${signPayload(encoded)}`;
}

export function verifyPaymentLaunchToken(
    token: string,
    orderId: string
): { userId: string } | null {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;

    const expected = signPayload(encoded);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    let payload: LaunchPayload;
    try {
        payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as LaunchPayload;
    } catch {
        return null;
    }

    if (payload.orderId !== orderId) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return { userId: payload.userId };
}
