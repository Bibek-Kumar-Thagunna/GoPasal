import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const storage = {
  getItemAsync: async (key: string) => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null; // Handle SSR / incognito issues
      }
    }
    return SecureStore.getItemAsync(key);
  },
  setItemAsync: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        // Handle SSR / incognito issues
      }
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  deleteItemAsync: async (key: string) => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};
