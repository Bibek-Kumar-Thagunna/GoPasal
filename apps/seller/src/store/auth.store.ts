import { create } from 'zustand';
import { storage } from '../utils/storage';
import apiClient from '../services/api';
import { syncSellerTenantToken } from '../utils/seller-session';
import { clearRegistrationFlowPersistence, useRegistrationFlowStore } from './registration-flow.store';

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  roles?: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** False until checkAuth/login finishes tenant token sync. */
  sessionReady: boolean;
  // OTP flow (customer login)
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  // Email flow (seller)
  loginWithEmail: (email: string, password: string) => Promise<void>;
  // Seller registration: step 1 — validate + send OTP (no user created)
  validateAndSendOtp: (data: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  confirmRegistrationOtp: (phone: string, otp: string) => Promise<void>;
  // Seller registration: final step — complete registration with all data
  completeRegistration: (data: {
    name: string; email: string; phone: string; password: string; otp: string;
    category?: string; businessName?: string; businessAddress?: string; panVat?: string;
    businessRegDoc?: string; storeLicense?: string; storePhotos?: string[];
  }) => Promise<void>;
  // Common
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  /** Switch seller JWT tenant (branch). Refetch workspace after. */
  switchSellerStore: (storeId: string) => Promise<void>;
}

async function persistTokensAndSyncTenant(
  tokens: { accessToken: string; refreshToken: string }
): Promise<{ hasStore: boolean; tenantSynced: boolean }> {
  await storage.setItemAsync('accessToken', tokens.accessToken);
  await storage.setItemAsync('refreshToken', tokens.refreshToken);
  return syncSellerTenantToken();
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  sessionReady: false,

  sendOtp: async (phone: string) => {
    await apiClient.post('/auth/otp/send', { phone });
  },

  verifyOtp: async (phone: string, otp: string) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post('/auth/otp/verify', { phone, otp });
      const payload = response.data.data;
      await storage.setItemAsync('accessToken', payload.tokens.accessToken);
      await storage.setItemAsync('refreshToken', payload.tokens.refreshToken);
      set({ user: payload.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithEmail: async (email: string, password: string) => {
    set({ isLoading: true, sessionReady: false });
    try {
      const response = await apiClient.post('/seller/auth/login', { email, password });
      const payload = response.data.data;
      const sync = await persistTokensAndSyncTenant(payload.tokens);
      if (sync.hasStore && !sync.tenantSynced) {
        await storage.deleteItemAsync('accessToken');
        await storage.deleteItemAsync('refreshToken');
        throw new Error('Could not activate store session. Log in again or contact support.');
      }
      set({ user: payload.user, isAuthenticated: true, sessionReady: true });
    } finally {
      set({ isLoading: false });
    }
  },

  validateAndSendOtp: async (data) => {
    set({ isLoading: true });
    try {
      await storage.deleteItemAsync('registrationToken');
      await apiClient.post('/seller/auth/register', data);
    } finally {
      set({ isLoading: false });
    }
  },

  confirmRegistrationOtp: async (phone: string, otp: string) => {
    set({ isLoading: true });
    try {
      const { data } = await apiClient.post('/seller/auth/register/confirm-otp', { phone, otp });
      const token = data?.data?.registrationToken as string | undefined;
      if (!token) {
        throw new Error('OTP verified but no upload session was returned. Try again.');
      }
      await storage.setItemAsync('registrationToken', token);
    } finally {
      set({ isLoading: false });
    }
  },

  completeRegistration: async (data) => {
    set({ isLoading: true, sessionReady: false });
    try {
      const response = await apiClient.post('/seller/auth/complete-registration', data);
      const payload = response.data.data;
      const sync = await persistTokensAndSyncTenant(payload.tokens);
      if (sync.hasStore && !sync.tenantSynced) {
        await storage.deleteItemAsync('accessToken');
        await storage.deleteItemAsync('refreshToken');
        throw new Error('Could not activate store session. Log in again or contact support.');
      }
      await storage.deleteItemAsync('registrationToken');
      clearRegistrationFlowPersistence();
      useRegistrationFlowStore.getState().reset();
      set({ user: payload.user, isAuthenticated: true, sessionReady: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await storage.deleteItemAsync('accessToken');
    await storage.deleteItemAsync('refreshToken');
    await storage.deleteItemAsync('registrationToken');
    clearRegistrationFlowPersistence();
    useRegistrationFlowStore.getState().reset();
    set({ user: null, isAuthenticated: false, sessionReady: true });
  },

  checkAuth: async () => {
    set({ sessionReady: false });
    try {
      const token = await storage.getItemAsync('accessToken');
      if (!token) {
        set({ sessionReady: true, isAuthenticated: false });
        return;
      }
      const sync = await syncSellerTenantToken();
      if (sync.hasStore && !sync.tenantSynced) {
        await storage.deleteItemAsync('accessToken');
        await storage.deleteItemAsync('refreshToken');
        set({ user: null, isAuthenticated: false, sessionReady: true });
        return;
      }
      const { data } = await apiClient.get('/seller/stores/me');
      const payload = data.data as {
        store?: { id?: string; name?: string; phone?: string; email?: string } | null;
        hasStore?: boolean;
      };
      const store = payload?.store;
      set({
        user: store
          ? {
              id: store.id ?? '',
              name: store.name ?? 'Seller',
              phone: store.phone ?? '',
              email: store.email,
            }
          : null,
        isAuthenticated: true,
        sessionReady: true,
      });
    } catch {
      await storage.deleteItemAsync('accessToken');
      await storage.deleteItemAsync('refreshToken');
      set({ user: null, isAuthenticated: false, sessionReady: true });
    }
  },

  switchSellerStore: async (storeId: string) => {
    set({ isLoading: true, sessionReady: false });
    try {
      const { data } = await apiClient.post('/seller/auth/switch-store', { storeId });
      const tokens = data?.data?.tokens as { accessToken?: string; refreshToken?: string } | undefined;
      if (tokens?.accessToken) {
        await storage.setItemAsync('accessToken', tokens.accessToken);
      }
      if (tokens?.refreshToken) {
        await storage.setItemAsync('refreshToken', tokens.refreshToken);
      }
    } finally {
      set({ isLoading: false, sessionReady: true });
    }
  },
}));
