import { IS_DEMO } from '@/lib/config';
import { demoDb } from './demo-db';
import type { ListingDraft, Profile, SearchFilters } from '@/lib/types';

/**
 * Marketplace API facade.
 * Demo mode (no Supabase env) uses local AsyncStorage.
 * When Supabase credentials are set, swap implementations here without changing screens.
 */
export const marketplace = {
  isDemo: IS_DEMO,

  getSession: () => demoDb.getSession(),
  signUp: (email: string, password: string, displayName: string) =>
    demoDb.signUp(email, password, displayName),
  signIn: (email: string, password: string) => demoDb.signIn(email, password),
  signOut: () => demoDb.signOut(),
  /** Google OAuth — requires Supabase + Google Cloud credentials. */
  signInWithGoogle: async () => {
    if (IS_DEMO) {
      throw new Error(
        'Autentificarea Google necesită Supabase. Adaugă EXPO_PUBLIC_SUPABASE_URL și cheia anon, apoi urmează ghidul din README.'
      );
    }
    throw new Error('Conectează clientul Supabase pentru Google OAuth.');
  },
  updateProfile: (userId: string, patch: Partial<Profile>) => demoDb.updateProfile(userId, patch),
  getProfile: (userId: string) => demoDb.getProfile(userId),
  search: (filters?: SearchFilters) => demoDb.search(filters),
  getListing: (id: string, center?: { lat: number; lng: number }) => demoDb.getListing(id, center),
  listingsForSeller: (sellerId: string) => demoDb.listingsForSeller(sellerId),
  createListing: (sellerId: string, draft: ListingDraft) => demoDb.createListing(sellerId, draft),
  updateListing: (listingId: string, sellerId: string, draft: Partial<ListingDraft>) =>
    demoDb.updateListing(listingId, sellerId, draft),
  setListingStatus: (
    listingId: string,
    sellerId: string,
    status: ListingDraft['status']
  ) => demoDb.setListingStatus(listingId, sellerId, status),
  deleteListing: (listingId: string, sellerId: string) => demoDb.deleteListing(listingId, sellerId),
  getFavorites: (userId: string) => demoDb.getFavorites(userId),
  isFavorite: (userId: string, listingId: string) => demoDb.isFavorite(userId, listingId),
  toggleFavorite: (userId: string, listingId: string) => demoDb.toggleFavorite(userId, listingId),
  resetDemo: () => demoDb.reset(),
  meta: demoDb.meta,
};
