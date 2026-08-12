import { create } from 'zustand';
import { Platform } from 'react-native';

export type Language = 'en' | 'ne';

const STORAGE_KEY = 'gp_language';

function isValidLanguage(value: string | null | undefined): value is Language {
  return value === 'en' || value === 'ne';
}

function readInitialLanguage(): Language {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isValidLanguage(stored)) return stored;
  }
  return 'en';
}

async function getSecureStore() {
  if (Platform.OS === 'web') return null;
  return await import('expo-secure-store');
}

async function persistLanguage(lang: Language): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, lang);
    }
    return;
  }
  const SecureStore = await getSecureStore();
  await SecureStore?.setItemAsync(STORAGE_KEY, lang);
}

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  hydrate: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: readInitialLanguage(),

  setLanguage: (lang) => {
    set({ language: lang });
    void persistLanguage(lang);
  },

  hydrate: async () => {
    if (Platform.OS === 'web') return;
    const SecureStore = await getSecureStore();
    const stored = await SecureStore?.getItemAsync(STORAGE_KEY);
    if (isValidLanguage(stored)) {
      set({ language: stored });
    }
  },
}));
