import { useLanguageStore, type Language } from '../store/language.store';
import { translations, type TranslationKey } from './translations';

export type { TranslationKey };
export type { Language };

type Vars = Record<string, string | number>;

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key];
    return value === undefined ? match : String(value);
  });
}

export function translate(language: Language, key: TranslationKey, vars?: Vars): string {
  const fromLang = translations[language]?.[key];
  const template = fromLang ?? translations.en[key] ?? key;
  return interpolate(template, vars);
}

export interface UseTranslationResult {
  t: (key: TranslationKey, vars?: Vars) => string;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export function useTranslation(): UseTranslationResult {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  const t = (key: TranslationKey, vars?: Vars): string => translate(language, key, vars);

  return { t, language, setLanguage };
}
