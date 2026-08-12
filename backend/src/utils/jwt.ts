import { SignJWT, jwtVerify } from "jose";
import { env } from "@/config";

const ALG = "HS256";

export const accessJwt = {
    sign: async (payload: any) => {
        return new SignJWT(payload)
            .setProtectedHeader({ alg: ALG })
            .setIssuedAt()
            .setExpirationTime("15m")
            .sign(new TextEncoder().encode(env.JWT_ACCESS_SECRET || env.JWT_SECRET));
    },
    verify: async (token: string) => {
        try {
            const { payload } = await jwtVerify(token, new TextEncoder().encode(env.JWT_ACCESS_SECRET || env.JWT_SECRET));
            return payload;
        } catch (e) {
            return null;
        }
    }
};

export const refreshJwt = {
    sign: async (payload: any) => {
        return new SignJWT(payload)
            .setProtectedHeader({ alg: ALG })
            .setIssuedAt()
            .setExpirationTime("7d")
            .sign(new TextEncoder().encode(env.JWT_REFRESH_SECRET || env.JWT_SECRET));
    },
    verify: async (token: string) => {
        try {
            const { payload } = await jwtVerify(token, new TextEncoder().encode(env.JWT_REFRESH_SECRET || env.JWT_SECRET));
            return payload;
        } catch (e) {
            return null;
        }
    }
};
