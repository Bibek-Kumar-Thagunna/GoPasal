import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { CURRENCY_SYMBOL } from './index';

const resolveLocalhost = (url: string) => {
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
  // Only process if it's a dev environment and trying to access localhost
  if (__DEV__ && url.includes('localhost')) {
    // 1. Try to get the host IP address from Expo's dev server
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return url.replace('localhost', ip);
    }
    // 2. Fallback for Android Emulator
    if (Platform.OS === 'android') {
      return url.replace('localhost', '10.0.2.2');
    }
  }
  return url;
};

export const env = {
  apiBaseUrl: resolveLocalhost(process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1'),
  assetsBaseUrl: resolveLocalhost(process.env.EXPO_PUBLIC_ASSETS_BASE_URL || 'http://localhost:3000/assets'),
  defaultRegion: process.env.EXPO_PUBLIC_REGION_DEFAULT || 'Kathmandu',
  currency: 'Rs',
  currencySymbol: CURRENCY_SYMBOL,

  // Social sign-in is only shown once real OAuth credentials are configured.
  // Until then, phone OTP is the single supported login path.
  googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
  appleAuthEnabled: process.env.EXPO_PUBLIC_APPLE_AUTH === '1',
} as const;

export const isSocialLoginEnabled = !!env.googleClientId || env.appleAuthEnabled;
