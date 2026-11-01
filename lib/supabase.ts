import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { IS_DEMO, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';

let client: SupabaseClient | null = null;

export function getSupabase() {
  if (IS_DEMO) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
