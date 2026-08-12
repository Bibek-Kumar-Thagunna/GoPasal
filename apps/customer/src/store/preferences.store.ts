import { create } from 'zustand';
import { Platform } from 'react-native';

const STORAGE_KEY = 'gp_push_enabled';

function readInitialPushEnabled(): boolean {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  }
  return true;
}

async function getSecureStore() {
  if (Platform.OS === 'web') return null;
  return await import('expo-secure-store');
}

async function persistPushEnabled(enabled: boolean): Promise<void> {
  const value = enabled ? 'true' : 'false';
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, value);
    }
    return;
  }
  const SecureStore = await getSecureStore();
  await SecureStore?.setItemAsync(STORAGE_KEY, value);
}

interface PreferencesState {
  pushEnabled: boolean;
  setPushEnabled: (enabled: boolean) => void;
  hydrate: () => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  pushEnabled: readInitialPushEnabled(),

  setPushEnabled: (enabled) => {
    set({ pushEnabled: enabled });
    void persistPushEnabled(enabled);
  },

  hydrate: async () => {
    if (Platform.OS === 'web') return;
    const SecureStore = await getSecureStore();
    const stored = await SecureStore?.getItemAsync(STORAGE_KEY);
    if (stored === 'true' || stored === 'false') {
      set({ pushEnabled: stored === 'true' });
    }
  },
}));
