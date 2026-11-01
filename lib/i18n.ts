import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import en from '@/locales/en';
import ro from '@/locales/ro';
import type { AppLocale } from '@/locales/types';

export const i18n = new I18n({ ro, en });
i18n.enableFallback = true;
i18n.defaultLocale = 'ro';

export function deviceLocale(): AppLocale {
  const code = getLocales()[0]?.languageCode?.toLowerCase();
  return code === 'en' ? 'en' : 'ro';
}

export function setI18nLocale(locale: AppLocale) {
  i18n.locale = locale;
}

export function t(key: string, options?: Record<string, string | number>) {
  return i18n.t(key, options);
}

export type { AppLocale };
