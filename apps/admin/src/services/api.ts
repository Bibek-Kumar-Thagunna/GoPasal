import axios, { type AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: { code?: string; message?: string } | null;
};

export function unwrapApi<T>(res: AxiosResponse<ApiEnvelope<T>>): T {
  const body = res.data;
  if (!body?.success || body.data === null || body.data === undefined) {
    const msg = body?.error?.message || 'Request failed';
    throw new Error(msg);
  }
  return body.data;
}

apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    /* ignore */
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = await SecureStore.getItemAsync('refreshToken');
        const refreshRes = await axios.post<ApiEnvelope<{ accessToken: string; refreshToken: string }>>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken: refresh }
        );
        const tokens = unwrapApi(refreshRes);
        await SecureStore.setItemAsync('accessToken', tokens.accessToken);
        await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
        original.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return apiClient(original);
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
