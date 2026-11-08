import Constants, { ExecutionEnvironment } from 'expo-constants';
import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { APP_SCHEME } from '@/lib/config';
import { getSupabase } from '@/lib/supabase';

/** Completes popup/tab auth on web when using openAuthSessionAsync. */
WebBrowser.maybeCompleteAuthSession();

function isExpoGo() {
  return (
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  );
}

/**
 * Redirect after Google OAuth.
 * Web → current origin `/login` (PKCE + detectSessionInUrl).
 * Expo Go → `exp://…/--/login` only (custom schemes like materialloop:// never return to Expo Go).
 * Dev/production builds → `materialloop://login`.
 */
export function getOAuthRedirectTo() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/login`;
  }

  // Expo Go does not own `materialloop://`. Using it makes openAuthSessionAsync hang forever.
  if (isExpoGo()) {
    return Linking.createURL('login');
  }

  return makeRedirectUri({
    scheme: APP_SCHEME,
    path: 'login',
    native: `${APP_SCHEME}://login`,
  });
}

function urlLooksLikeAuthCallback(url: string) {
  return (
    url.includes('code=') ||
    url.includes('access_token=') ||
    url.includes('error=') ||
    url.includes('error_code=')
  );
}

/**
 * Opens the OAuth page and waits for the app deep link.
 * Android Custom Tabs sometimes dismisses before returning the URL — Linking is the fallback.
 */
export async function openOAuthSession(authUrl: string, redirectTo: string): Promise<string> {
  if (Platform.OS === 'android') {
    try {
      await WebBrowser.warmUpAsync();
    } catch {
      // optional
    }
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false;

    const finish = (url: string | null, error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      subscription.remove();
      if (Platform.OS === 'android') {
        void WebBrowser.coolDownAsync();
      }
      if (error) reject(error);
      else if (url) resolve(url);
      else reject(new Error('Autentificarea Google a eșuat.'));
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url && urlLooksLikeAuthCallback(url)) finish(url);
    });

    const timer = setTimeout(() => {
      finish(
        null,
        new Error(
          `Google login timed out. In Supabase Auth → URL Configuration allow: ${redirectTo}`
        )
      );
    }, 120_000);

    void (async () => {
      try {
        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);
        if (settled) return;

        if (result.type === 'success' && result.url) {
          finish(result.url);
          return;
        }

        // On Android the session can dismiss while the deep link still arrives via Linking.
        if (result.type === 'cancel' || result.type === 'dismiss') {
          setTimeout(() => {
            if (!settled) {
              finish(null, new Error('Autentificarea Google a fost anulată.'));
            }
          }, 800);
          return;
        }

        finish(null, new Error('Autentificarea Google a eșuat.'));
      } catch (e) {
        finish(null, e instanceof Error ? e : new Error(String(e)));
      }
    })();
  });
}

function parseAuthParams(url: string): Record<string, string> {
  const parsed = Linking.parse(url);
  const out: Record<string, string> = {};
  if (parsed.queryParams) {
    for (const [key, value] of Object.entries(parsed.queryParams)) {
      if (typeof value === 'string') out[key] = value;
      else if (Array.isArray(value) && typeof value[0] === 'string') out[key] = value[0];
    }
  }
  // Tokens sometimes arrive in the hash fragment (implicit / older flows).
  try {
    const hash = new URL(url).hash?.replace(/^#/, '');
    if (hash) {
      const hashParams = new URLSearchParams(hash);
      hashParams.forEach((value, key) => {
        out[key] = value;
      });
    }
  } catch {
    const hashIndex = url.indexOf('#');
    if (hashIndex >= 0) {
      const hashParams = new URLSearchParams(url.slice(hashIndex + 1));
      hashParams.forEach((value, key) => {
        out[key] = value;
      });
    }
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
  if (lower.includes('redirect') || lower.includes('redirect_uri') || lower.includes('expirat')) {
    return raw.includes('Redirect URL')
      ? raw
      : 'Redirect URL nepermis. Adaugă URL-ul în Supabase → Authentication → URL Configuration (exp://** și materialloop://**).';
  }
  if (lower.includes('provider') || lower.includes('unsupported')) {
    return 'Providerul Google nu este activat în Supabase Dashboard.';
  }
  return raw || 'Autentificarea Google a eșuat.';
}
