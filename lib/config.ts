import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || (extra.supabaseUrl as string | undefined) || '';

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  (extra.supabaseAnonKey as string | undefined) ||
  '';

export const IS_DEMO = !SUPABASE_URL || !SUPABASE_ANON_KEY;

export const APP_SCHEME = 'materialloop';
export const LISTING_EXPIRY_DAYS = 60;
export const MAX_PHOTOS = 8;
