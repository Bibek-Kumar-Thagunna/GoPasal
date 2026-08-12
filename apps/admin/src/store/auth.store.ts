import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import apiClient, { unwrapApi, type ApiEnvelope } from '../services/api';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'PLATFORM_OPERATOR']);

export function isAdminPanelRole(roles?: string[]): boolean {
  return roles?.some((r) => ADMIN_ROLES.has(r)) ?? false;
}

interface User {
  id: string;
  name: string | null;
  phone: string;
  email?: string | null;
  roles?: string[];
}

type MeProfile = {
  id: string;
  phone: string;
  name: string | null;
  email?: string | null;
  roles: string[];
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  sendAdminOtp: (phone: string) => Promise<void>;
  verifyAdminOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

async function persistTokens(tokens: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> {
  await SecureStore.setItemAsync('accessToken', tokens.accessToken);
  await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
}

async function loadMe(): Promise<User> {
  const res = await apiClient.get<ApiEnvelope<MeProfile>>('/auth/me');
  const profile = unwrapApi(res);
  return {
    id: profile.id,
    phone: profile.phone,
    name: profile.name,
    email: profile.email,
    roles: profile.roles,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  loginWithEmailPassword: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.post<
        ApiEnvelope<{
          user: { id: string; email: string | null; phone: string; name: string | null };
          tokens: { accessToken: string; refreshToken: string };
        }>
      >('/admin/auth/login', { email, password });
      const body = unwrapApi(res);
      await persistTokens(body.tokens);
      const user = await loadMe();
      if (!isAdminPanelRole(user.roles)) {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        throw new Error('This account is not authorized for admin access');
      }
      set({ user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  sendAdminOtp: async (phone: string) => {
    const res = await apiClient.post('/admin/auth/otp/send', { phone });
    unwrapApi(res);
  },

  verifyAdminOtp: async (phone: string, otp: string) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.post<
        ApiEnvelope<{
          user: { id: string; email: string | null; phone: string; name: string | null };
          tokens: { accessToken: string; refreshToken: string };
        }>
      >('/admin/auth/otp/verify', { phone, otp });
      const body = unwrapApi(res);
      await persistTokens(body.tokens);
      const user = await loadMe();
      if (!isAdminPanelRole(user.roles)) {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        throw new Error('This account is not authorized for admin access');
      }
      set({ user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        await apiClient.post('/auth/logout').catch(() => undefined);
      }
    } finally {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({ user: null, isAuthenticated: false });
    }
  },

  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        set({ user: null, isAuthenticated: false });
        return;
      }
      const user = await loadMe();
      if (!isAdminPanelRole(user.roles)) {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        set({ user: null, isAuthenticated: false });
        return;
      }
      set({ user, isAuthenticated: true });
    } catch {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({ user: null, isAuthenticated: false });
    }
  },
}));
