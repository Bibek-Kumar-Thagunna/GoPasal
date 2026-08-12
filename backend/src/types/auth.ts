import type { UserRole } from "./enums";

export interface JWTPayload {
    sub: string;
    roles: UserRole[];
    tenantId: string | null;
    sessionId: string;
    type: "access" | "refresh" | "registration";
}

export interface AuthContext {
    userId: string;
    roles: UserRole[];
    tenantId: string | null;
    sessionId: string;
}

export interface OTPSendRequest {
    phone: string;
}

export interface OTPVerifyRequest {
    phone: string;
    otp: string;
    deviceId?: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}
