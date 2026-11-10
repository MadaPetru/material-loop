import Constants, { ExecutionEnvironment } from 'expo-constants';
import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { APP_SCHEME } from '@/lib/config';

export type AuthRedirectPath = 'login' | 'reset-password';

function isExpoGo() {
  return (
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  );
}

/**
 * Redirect after OAuth / email confirm / password reset.
 * Web → `{origin}/{path}`
 * Expo Go → `exp://…/--/{path}` (custom schemes never return to Expo Go)
 * Dev/production builds → `materialloop://{path}`
 */
export function getAuthRedirectTo(path: AuthRedirectPath = 'login') {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/${path}`;
  }

  if (isExpoGo()) {
    return Linking.createURL(path);
  }

  return makeRedirectUri({
    scheme: APP_SCHEME,
    path,
    native: `${APP_SCHEME}://${path}`,
  });
}
