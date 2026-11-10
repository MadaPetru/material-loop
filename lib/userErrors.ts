import { i18n } from '@/lib/i18n';

/** Map technical / API errors to clear localized user copy. */

export function userCopy() {
  return {
    unknown: i18n.t('errors.unknown'),
    saveListingFailed: i18n.t('errors.genericRetry'),
    invalidCity: i18n.locale === 'en' ? 'Pick a valid locality from the list.' : 'Alege o localitate validă din listă.',
    googleInterrupted: i18n.t('errors.googleInterrupted'),
    deleteConfirmTitle: i18n.locale === 'en' ? 'Delete listing?' : 'Ștergi anunțul?',
    deleteConfirmBody:
      i18n.locale === 'en'
        ? 'The listing will be hidden from search. You can post another anytime.'
        : 'Anunțul va fi ascuns din căutare. Poți publica altul oricând.',
  };
}

const PATTERNS: Array<{ test: RegExp; key: string }> = [
  { test: /invalid login credentials|email sau parol|wrong email or password|greșită/i, key: 'errors.badCredentials' },
  { test: /email.*already|already.*registered|user already|Există deja|already exists/i, key: 'errors.emailExists' },
  { test: /password.*(weak|short|at least|least 6)|Minim 6|at least 6/i, key: 'errors.weakPassword' },
  { test: /network|fetch failed|failed to fetch|timeout|conexiune/i, key: 'errors.network' },
  {
    test: /EMAIL_CONFIRM_REQUIRED|email not confirmed|confirm.*(email|signup)|Verifică emailul/i,
    key: 'errors.emailConfirm',
  },
  { test: /redirect url|redirect_uri|oauth.*cancel|access_denied|întrerupt|cancelled/i, key: 'errors.googleInterrupted' },
  { test: /EXPO_PUBLIC_SUPABASE|necesită Supabase|vezi README|nu este configurat|isn't available/i, key: 'errors.googleUnavailable' },
  { test: /row.level.security|permission denied|violates|permisiunea/i, key: 'errors.permission' },
  { test: /rate.?limit|too many requests|Prea multe/i, key: 'errors.rateLimit' },
];

export function toUserError(error: unknown, fallback?: string): string {
  const translated = (key: string) => String(i18n.t(key));
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : fallback ?? translated('errors.unknown');

  for (const { test, key } of PATTERNS) {
    if (test.test(raw)) return translated(key);
  }

  if (raw.length <= 140 && !/stack|at Object\.|supabase\.co|jwt/i.test(raw)) {
    return raw;
  }

  return translated('errors.genericRetry');
}

/** @deprecated use userCopy() */
export const USER_COPY = {
  get unknown() {
    return i18n.t('errors.unknown');
  },
  get googleInterrupted() {
    return i18n.t('errors.googleInterrupted');
  },
};
