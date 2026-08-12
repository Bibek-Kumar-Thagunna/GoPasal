import axios from 'axios';
import { storage } from '../utils/storage';

import { Platform } from 'react-native';

const getApiBaseUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    if (host.includes('gopasal.com')) {
      return 'https://api.gopasal.com/api/v1';
    }
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `${protocol}//${host}:3000/api/v1`;
    }
  }
  return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request & handle FormData content-type
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await storage.getItemAsync('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData && config.headers) {
      if (typeof (config.headers as any).delete === 'function') {
        (config.headers as any).delete('Content-Type');
        (config.headers as any).delete('content-type');
      }
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  } catch {}
  return config;
});

// In-flight refresh token mutex & queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error || !token) {
      reject(error || new Error('Token refresh failed'));
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

// Auto-refresh on 401 with mutex
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          if (original.headers) {
            original.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refresh = await storage.getItemAsync('refreshToken');
        if (!refresh) {
          await storage.deleteItemAsync('accessToken');
          await storage.deleteItemAsync('refreshToken');
          processQueue(error, null);
          return Promise.reject(error);
        }

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: refresh,
        });
        const newAccessToken = data.data?.accessToken || data.accessToken;
        const newRefreshToken = data.data?.refreshToken || data.refreshToken;

        await storage.setItemAsync('accessToken', newAccessToken);
        if (newRefreshToken) {
          await storage.setItemAsync('refreshToken', newRefreshToken);
        }

        processQueue(null, newAccessToken);

        if (original.headers) {
          original.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(original);
      } catch (refreshError) {
        await storage.deleteItemAsync('accessToken');
        await storage.deleteItemAsync('refreshToken');
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
