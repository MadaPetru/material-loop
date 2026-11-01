import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { deviceLocale, i18n, setI18nLocale, t, type AppLocale } from '@/lib/i18n';

const STORAGE_KEY = 'materialloop.locale';

type LocaleContextValue = {
  locale: AppLocale;
  ready: boolean;
  setLocale: (locale: AppLocale) => Promise<void>;
  t: typeof t;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>('ro');
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const next: AppLocale = saved === 'en' || saved === 'ro' ? saved : deviceLocale();
        setI18nLocale(next);
        if (mounted) setLocaleState(next);
      } catch {
        const next = deviceLocale();
        setI18nLocale(next);
        if (mounted) setLocaleState(next);
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setLocale = useCallback(async (next: AppLocale) => {
    setI18nLocale(next);
    setLocaleState(next);
    setTick((n) => n + 1);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      ready,
      setLocale,
      t: (key, options) => {
        void tick;
        void locale;
        return i18n.t(key, options);
      },
    }),
    [locale, ready, setLocale, tick]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
