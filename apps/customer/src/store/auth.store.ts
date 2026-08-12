import { create } from 'zustand';
import type { User } from '../types';
import { getAccessToken, removeTokens, setTokens } from '../services/token-storage';
import { apiClient } from '../services/api-client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {}
    await removeTokens();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    const token = await getAccessToken();
    
    if (!token) {
      try {
        const deviceId = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        const { data } = await apiClient.post('/auth/guest', { deviceId });
        const guestUser = data?.data?.user || data?.user;
        const tokens = data?.data?.tokens || data?.tokens;
        if (tokens) {
          await setTokens(tokens.accessToken, tokens.refreshToken);
        }
        set({ user: guestUser, isAuthenticated: false, isLoading: false });
      } catch {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
      return;
    }

    try {
      const { data } = await apiClient.get('/auth/me');
      const user = data?.data || data?.user || data;
      if (user?.id) {
        if (user.phone && user.phone.startsWith('guest_')) {
          // Keep token for cart functionality, but UI treats as unauthenticated
          set({ user, isAuthenticated: false, isLoading: false });
        } else {
          set({ user, isAuthenticated: true, isLoading: false });
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      await removeTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
