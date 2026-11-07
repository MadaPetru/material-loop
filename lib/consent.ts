import AsyncStorage from '@react-native-async-storage/async-storage';

export const CONSENT_STORAGE_KEY = 'materialloop.cookie-consent.v1';

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing';

export type ConsentPreferences = {
  version: 1;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
};

export const DEFAULT_CONSENT: ConsentPreferences = {
  version: 1,
  necessary: true,
  analytics: false,
  marketing: false,
  decidedAt: '',
};

export function canLoadCategory(
  prefs: ConsentPreferences | null,
  category: ConsentCategory,
): boolean {
  if (category === 'necessary') return true;
  if (!prefs?.decidedAt) return false;
  return Boolean(prefs[category]);
}

export async function loadConsent(): Promise<ConsentPreferences | null> {
  try {
    const raw = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentPreferences;
    if (parsed?.version !== 1 || !parsed.decidedAt) return null;
    return {
      version: 1,
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      decidedAt: parsed.decidedAt,
    };
  } catch {
    return null;
  }
}

export async function saveConsent(
  prefs: Omit<ConsentPreferences, 'version' | 'necessary' | 'decidedAt'> & {
    analytics: boolean;
    marketing: boolean;
  },
): Promise<ConsentPreferences> {
  const next: ConsentPreferences = {
    version: 1,
    necessary: true,
    analytics: prefs.analytics,
    marketing: prefs.marketing,
    decidedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function clearConsent(): Promise<void> {
  await AsyncStorage.removeItem(CONSENT_STORAGE_KEY);
}
