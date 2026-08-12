import { Platform } from 'react-native';
import { STORAGE_KEYS } from '../constants';

let memoryToken: string | null = null;
let memoryRefreshToken: string | null = null;

async function getSecureStore() {
  if (Platform.OS === 'web') return null;
  return await import('expo-secure-store');
}

export async function getAccessToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;

  if (Platform.OS === 'web') {
    return typeof window !== 'undefined'
      ? localStorage.getItem(STORAGE_KEYS.accessToken)
      : null;
  }

  const SecureStore = await getSecureStore();
  return SecureStore?.getItemAsync(STORAGE_KEYS.accessToken) ?? null;
}

export function getAccessTokenSync(): string | null {
  return memoryToken;
}

export async function getRefreshToken(): Promise<string | null> {
  if (memoryRefreshToken) return memoryRefreshToken;

  if (Platform.OS === 'web') {
    return typeof window !== 'undefined'
      ? localStorage.getItem(STORAGE_KEYS.refreshToken)
      : null;
  }

  const SecureStore = await getSecureStore();
  return SecureStore?.getItemAsync(STORAGE_KEYS.refreshToken) ?? null;
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  memoryToken = accessToken;
  memoryRefreshToken = refreshToken;

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
      localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
    }
    return;
  }

  const SecureStore = await getSecureStore();
  await SecureStore?.setItemAsync(STORAGE_KEYS.accessToken, accessToken);
  await SecureStore?.setItemAsync(STORAGE_KEYS.refreshToken, refreshToken);
}

export async function removeTokens(): Promise<void> {
  memoryToken = null;
  memoryRefreshToken = null;

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.accessToken);
      localStorage.removeItem(STORAGE_KEYS.refreshToken);
    }
    return;
  }

  const SecureStore = await getSecureStore();
  await SecureStore?.deleteItemAsync(STORAGE_KEYS.accessToken);
  await SecureStore?.deleteItemAsync(STORAGE_KEYS.refreshToken);
}
