import { IS_DEMO } from '@/lib/config';
import { demoDb } from './demo-db';
import { supabaseDb } from './supabase-db';
import type { ListingDraft, Profile, SearchFilters, UserRole } from '@/lib/types';

const api = IS_DEMO ? demoDb : supabaseDb;

/**
 * Marketplace API facade.
 * Demo mode (no Supabase env) uses local AsyncStorage.
 * With EXPO_PUBLIC_SUPABASE_* set, uses cloud Auth + Postgres.
 */
export const marketplace = {
  isDemo: IS_DEMO,

  getSession: () => api.getSession(),
  signUp: (email: string, password: string, displayName: string) =>
    api.signUp(email, password, displayName),
  signIn: (email: string, password: string) => api.signIn(email, password),
  signOut: () => api.signOut(),
  signInWithGoogle: async () => {
    if (IS_DEMO) {
      throw new Error(
        'Autentificarea Google necesită Supabase. Adaugă EXPO_PUBLIC_SUPABASE_URL și cheia anon, apoi urmează ghidul din README.'
      );
    }
    return supabaseDb.signInWithGoogle();
  },
  updateProfile: (userId: string, patch: Partial<Profile>) => api.updateProfile(userId, patch),
  requestPhoneVerification: (userId: string, phone: string) =>
    api.requestPhoneVerification(userId, phone),
  confirmPhoneVerification: (userId: string, phone: string, token: string) =>
    api.confirmPhoneVerification(userId, phone, token),
  clearPhone: (userId: string) => api.clearPhone(userId),
  deleteAccount: (userId: string) => api.deleteAccount(userId),
  adminListUsers: () => api.adminListUsers(),
  adminUpdateUser: (targetUserId: string, patch: { role?: UserRole; deactivated?: boolean }) =>
    api.adminUpdateUser(targetUserId, patch),
  adminGetAnalytics: () => api.adminGetAnalytics(),
  getProfile: (userId: string) => api.getProfile(userId),
  search: (filters?: SearchFilters) => api.search(filters),
  getListing: (id: string, center?: { lat: number; lng: number }) => api.getListing(id, center),
  listingsForSeller: (sellerId: string) => api.listingsForSeller(sellerId),
  createListing: (sellerId: string, draft: ListingDraft) => api.createListing(sellerId, draft),
  updateListing: (listingId: string, sellerId: string, draft: Partial<ListingDraft>) =>
    api.updateListing(listingId, sellerId, draft),
  setListingStatus: (
    listingId: string,
    sellerId: string,
    status: ListingDraft['status']
  ) => api.setListingStatus(listingId, sellerId, status),
  deleteListing: (listingId: string, sellerId: string) => api.deleteListing(listingId, sellerId),
  getFavorites: (userId: string) => api.getFavorites(userId),
  isFavorite: (userId: string, listingId: string) => api.isFavorite(userId, listingId),
  toggleFavorite: (userId: string, listingId: string) => api.toggleFavorite(userId, listingId),
  listConversations: (userId: string) => api.listConversations(userId),
  getConversation: (conversationId: string, userId: string) =>
    api.getConversation(conversationId, userId),
  getMessages: (conversationId: string, userId: string) => api.getMessages(conversationId, userId),
  sendMessage: (conversationId: string, senderId: string, body: string) =>
    api.sendMessage(conversationId, senderId, body),
  startConversation: (params: {
    listingId: string;
    buyerId: string;
    sellerId: string;
    initialMessage?: string;
  }) => api.startConversation(params),
  resetDemo: () => (IS_DEMO ? demoDb.reset() : supabaseDb.resetDemo()),
  meta: api.meta,
};
