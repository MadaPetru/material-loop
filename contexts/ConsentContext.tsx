import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  canLoadCategory,
  clearConsent,
  loadConsent,
  saveConsent,
  type ConsentCategory,
  type ConsentPreferences,
} from '@/lib/consent';

type ConsentContextValue = {
  ready: boolean;
  preferences: ConsentPreferences | null;
  needsPrompt: boolean;
  customizeOpen: boolean;
  setCustomizeOpen: (open: boolean) => void;
  acceptAll: () => Promise<void>;
  necessaryOnly: () => Promise<void>;
  saveCustom: (prefs: { analytics: boolean; marketing: boolean }) => Promise<void>;
  openPreferences: () => void;
  canLoad: (category: ConsentCategory) => boolean;
  resetConsent: () => Promise<void>;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadConsent()
      .then((prefs) => {
        if (mounted) setPreferences(prefs);
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const acceptAll = useCallback(async () => {
    const next = await saveConsent({ analytics: true, marketing: true });
    setPreferences(next);
    setCustomizeOpen(false);
  }, []);

  const necessaryOnly = useCallback(async () => {
    const next = await saveConsent({ analytics: false, marketing: false });
    setPreferences(next);
    setCustomizeOpen(false);
  }, []);

  const saveCustom = useCallback(async (prefs: { analytics: boolean; marketing: boolean }) => {
    const next = await saveConsent(prefs);
    setPreferences(next);
    setCustomizeOpen(false);
  }, []);

  const openPreferences = useCallback(() => {
    setCustomizeOpen(true);
  }, []);

  const resetConsent = useCallback(async () => {
    await clearConsent();
    setPreferences(null);
    setCustomizeOpen(true);
  }, []);

  const canLoad = useCallback(
    (category: ConsentCategory) => canLoadCategory(preferences, category),
    [preferences],
  );

  const value = useMemo<ConsentContextValue>(
    () => ({
      ready,
      preferences,
      needsPrompt: ready && (!preferences || !preferences.decidedAt || customizeOpen),
      customizeOpen,
      setCustomizeOpen,
      acceptAll,
      necessaryOnly,
      saveCustom,
      openPreferences,
      canLoad,
      resetConsent,
    }),
    [
      ready,
      preferences,
      customizeOpen,
      acceptAll,
      necessaryOnly,
      saveCustom,
      openPreferences,
      canLoad,
      resetConsent,
    ],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider');
  return ctx;
}
