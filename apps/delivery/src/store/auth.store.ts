import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../services/api';

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
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  sendOtp: async (phone: string) => {
    await apiClient.post('/auth/otp/send', { phone });
  },

  verifyOtp: async (phone: string, otp: string) => {
    set({ isLoading: true });
    try {
      const { data } = await apiClient.post('/auth/otp/verify', { phone, otp });
      await SecureStore.setItemAsync('accessToken', data.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
      set({ user: data.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) return;
      const { data } = await apiClient.get('/auth/me');
      set({ user: data, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },
}));
