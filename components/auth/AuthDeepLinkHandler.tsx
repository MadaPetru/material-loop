import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { createSessionFromUrl, urlLooksLikeAuthCallback } from '@/lib/auth/oauth';
import { IS_DEMO } from '@/lib/config';

function pathLooksLikeReset(url: string) {
  return /reset-password/i.test(url) || /type=recovery/i.test(url);
}

/**
 * Native: email / OAuth callbacks land via deep links (detectSessionInUrl is web-only).
 * Exchange the code, then send recovery sessions to the reset-password screen.
 */
export function AuthDeepLinkHandler() {
  useEffect(() => {
    if (IS_DEMO || Platform.OS === 'web') return;

    let alive = true;

    const handleUrl = async (url: string | null) => {
      if (!url || !alive || !urlLooksLikeAuthCallback(url)) return;
      try {
        const session = await createSessionFromUrl(url);
        if (!alive || !session) return;
        if (pathLooksLikeReset(url)) {
          router.replace('/(auth)/reset-password' as Href);
        }
      } catch {
        /* Login / reset screens show their own errors when relevant */
      }
    };

    void Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url);
    });

    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return null;
}
