import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { APP_SCHEME } from '@/lib/config';
import { getSupabase } from '@/lib/supabase';

/** Completes popup/tab auth on web when using openAuthSessionAsync. */
WebBrowser.maybeCompleteAuthSession();

/**
 * Redirect after Google OAuth.
 * Web → current origin `/login` (PKCE + detectSessionInUrl).
 * Native → app scheme (or Expo Go exp://) via makeRedirectUri.
 */
export function getOAuthRedirectTo() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/login`;
  }
  return makeRedirectUri({
    scheme: APP_SCHEME,
    path: 'login',
  });
}

function parseAuthParams(url: string): Record<string, string> {
  const parsed = new URL(url);
  const out: Record<string, string> = {};
  parsed.searchParams.forEach((value, key) => {
    out[key] = value;
  });
  const hash = parsed.hash?.replace(/^#/, '');
  if (hash) {
    const hashParams = new URLSearchParams(hash);
    hashParams.forEach((value, key) => {
      out[key] = value;
    });
  }
  return out;
}

export async function createSessionFromUrl(url: string) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase nu este configurat.');

  const params = parseAuthParams(url);
  const errorCode = params.error_code || params.error;
  if (errorCode) {
    throw new Error(oauthErrorMessage(params.error_description || errorCode));
  }

  const { code, access_token, refresh_token } = params;

  if (code) {
    const { data, error } = await sb.auth.exchangeCodeForSession(code);
    if (error) throw new Error(oauthErrorMessage(error.message));
    return data.session;
  }

  if (access_token && refresh_token) {
    const { data, error } = await sb.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error) throw new Error(oauthErrorMessage(error.message));
    return data.session;
  }

  return null;
}

export function oauthErrorMessage(raw: string) {
  const lower = raw.toLowerCase();
  if (lower.includes('cancel') || lower.includes('dismiss') || lower.includes('access_denied')) {
    return 'Autentificarea Google a fost anulată.';
  }
  if (lower.includes('redirect') || lower.includes('redirect_uri')) {
    return 'Redirect URL nepermis. Adaugă URL-ul în Supabase → Authentication → URL Configuration.';
  }
  if (lower.includes('provider') || lower.includes('unsupported')) {
    return 'Providerul Google nu este activat în Supabase Dashboard.';
  }
  return raw || 'Autentificarea Google a eșuat.';
}
