import 'react-native-url-polyfill/auto';
import '@/lib/cryptoPolyfill';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { IS_DEMO, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';

let client: SupabaseClient | null = null;
let appStateBound = false;

export function getSupabase() {
  if (IS_DEMO) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === 'web',
        flowType: 'pkce',
      },
    });

    // Keep token refresh tied to foreground on native (Expo / Supabase guidance).
    if (Platform.OS !== 'web' && !appStateBound) {
      appStateBound = true;
      const onChange = (state: AppStateStatus) => {
        if (state === 'active') client?.auth.startAutoRefresh();
        else client?.auth.stopAutoRefresh();
      };
      AppState.addEventListener('change', onChange);
      client.auth.startAutoRefresh();
    }
  }
  return client;
}
