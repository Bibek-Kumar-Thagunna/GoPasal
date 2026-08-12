"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  adminGoogleLogin,
  adminLogin,
  clearStoredTokens,
  fetchMe,
  getStoredAccessToken,
  logoutServer,
  setStoredTokens,
  type MeProfile,
} from "@/lib/api";
const ADMIN_ROLES = new Set(["SUPER_ADMIN", "PLATFORM_OPERATOR"]);

type AuthContextValue = {
  user: MeProfile | null;
  ready: boolean;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: (idToken: string) => Promise<void>;
  signInOtp: (tokens: {
    accessToken: string;
    refreshToken: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function hydrateFromStoredToken(): Promise<MeProfile | null> {
  if (!getStoredAccessToken()) return null;
  const profile = await fetchMe();
  if (!profile.roles.some((r) => ADMIN_ROLES.has(r))) {
    clearStoredTokens();
    throw new Error("This account is not authorized for admin access");
  }
  return profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await hydrateFromStoredToken();
        if (!cancelled) setUser(profile);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signInEmail = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await adminLogin(email, password);
      setStoredTokens(result.tokens.accessToken, result.tokens.refreshToken);
      const profile = await fetchMe();
      if (!profile.roles.some((r) => ADMIN_ROLES.has(r))) {
        clearStoredTokens();
        throw new Error("This account is not authorized for admin access");
      }
      setUser(profile);
    } finally {
      setLoading(false);
    }
  }, []);

  const signInGoogle = useCallback(async (idToken: string) => {
    setLoading(true);
    try {
      const result = await adminGoogleLogin(idToken);
      setStoredTokens(result.tokens.accessToken, result.tokens.refreshToken);
      const profile = await fetchMe();
      if (!profile.roles.some((r) => ADMIN_ROLES.has(r))) {
        clearStoredTokens();
        throw new Error("This account is not authorized for admin access");
      }
      setUser(profile);
    } finally {
      setLoading(false);
    }
  }, []);

  const signInOtp = useCallback(
    async (tokens: { accessToken: string; refreshToken: string }) => {
      setLoading(true);
      try {
        setStoredTokens(tokens.accessToken, tokens.refreshToken);
        const profile = await fetchMe();
        if (!profile.roles.some((r) => ADMIN_ROLES.has(r))) {
          clearStoredTokens();
          throw new Error("This account is not authorized for admin access");
        }
        setUser(profile);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    await logoutServer();
    clearStoredTokens();
    setUser(null);
  }, []);

  const value = useMemo(
    (): AuthContextValue => ({
      user,
      ready,
      loading,
      signInEmail,
      signInGoogle,
      signInOtp,
      signOut,
    }),
    [user, ready, loading, signInEmail, signInGoogle, signInOtp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
