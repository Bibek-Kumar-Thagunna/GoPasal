import { AUTH } from "@/config/app";

export async function hashPassword(password: string): Promise<string> {
    return Bun.password.hash(password, { algorithm: "argon2id" });
}

export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return Bun.password.verify(password, hash);
}

export function generateOTP(length: number = AUTH.OTP_LENGTH): string {
    const digits = "0123456789";
    let otp = "";
    const randomBytes = crypto.getRandomValues(new Uint8Array(length));
    for (let i = 0; i < length; i++) {
        otp += digits[randomBytes[i] % 10];
    }
    return otp;
}

export function generateId(length: number = 21): string {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const randomBytes = crypto.getRandomValues(new Uint8Array(length));
    let id = "";
    for (let i = 0; i < length; i++) {
        id += chars[randomBytes[i] % chars.length];
    }
    return id;
}

export function generateIdempotencyKey(): string {
    return crypto.randomUUID();
}
