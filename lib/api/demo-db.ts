import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATEGORIES, SUBCATEGORIES } from '@/data/categories';
import { COUNTRY_RO, COUNTIES, CITIES, getCity, getCounty } from '@/data/romania';
import { SEED_LISTINGS, SEED_PHOTOS, SEED_PROFILES } from '@/data/seed-listings';
import { approximateCoords, daysFromNow, haversineKm } from '@/lib/geo';
import { createId } from '@/lib/id';
import { LISTING_EXPIRY_DAYS } from '@/lib/config';
import type {
  Favorite,
  Listing,
  ListingDraft,
  ListingPhoto,
  ListingWithRelations,
  Profile,
  SearchFilters,
} from '@/lib/types';

const STORAGE_KEY = 'materialloop.demo.v1';

type DemoState = {
  profiles: Profile[];
  listings: Listing[];
  photos: ListingPhoto[];
  favorites: Favorite[];
  sessionUserId: string | null;
  passwords: Record<string, string>;
};

let memory: DemoState | null = null;
let ready: Promise<void> | null = null;

function defaultState(): DemoState {
  return {
    profiles: structuredClone(SEED_PROFILES),
    listings: structuredClone(SEED_LISTINGS),
    photos: structuredClone(SEED_PHOTOS),
    favorites: [],
    sessionUserId: null,
    passwords: {
      'demo@materialloop.ro': 'demo1234',
      'ana@example.ro': 'demo1234',
    },
  };
}

async function load() {
  if (memory) return memory;
  if (!ready) {
    ready = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        memory = raw ? (JSON.parse(raw) as DemoState) : defaultState();
      } catch {
        memory = defaultState();
      }
    })();
  }
  await ready;
  return memory!;
}

async function save() {
  if (!memory) return;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
}

function enrich(listing: Listing, state: DemoState, center?: { lat: number; lng: number }): ListingWithRelations {
  const city = getCity(listing.cityId);
  const county = city ? getCounty(city.countyId) : undefined;
  const distanceKm =
    center != null ? haversineKm(center.lat, center.lng, listing.lat, listing.lng) : null;
  return {
    ...listing,
    photos: state.photos
      .filter((p) => p.listingId === listing.id)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    seller: state.profiles.find((p) => p.id === listing.sellerId),
    city,
    county,
    category: CATEGORIES.find((c) => c.id === listing.categoryId),
    subcategory: listing.subcategoryId
      ? SUBCATEGORIES.find((s) => s.id === listing.subcategoryId) ?? null
      : null,
    distanceKm,
  };
}

export const demoDb = {
  async reset() {
    memory = defaultState();
    await save();
  },

  async getSession() {
    const state = await load();
    if (!state.sessionUserId) return null;
    return state.profiles.find((p) => p.id === state.sessionUserId) ?? null;
  },

  async signUp(email: string, password: string, displayName: string) {
    const state = await load();
    const existing = state.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (existing) throw new Error('Există deja un cont cu acest email.');
    const profile: Profile = {
      id: createId('user'),
      email,
      displayName,
      avatarUrl: null,
      accountType: 'individual',
      role: 'user',
      cityId: 'bh-oradea',
      phone: null,
      bio: null,
      lat: 47.0465,
      lng: 21.9189,
      sellerRating: null,
      ratingCount: 0,
      completedSales: 0,
      createdAt: new Date().toISOString(),
      deactivatedAt: null,
    };
    state.profiles.push(profile);
    state.passwords[email.toLowerCase()] = password;
    state.sessionUserId = profile.id;
    await save();
    return profile;
  },

  async signIn(email: string, password: string) {
    const state = await load();
    const profile = state.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (!profile || state.passwords[email.toLowerCase()] !== password) {
      throw new Error('Email sau parolă incorrectă.');
    }
    if (profile.deactivatedAt) throw new Error('Contul este dezactivat.');
    state.sessionUserId = profile.id;
    await save();
    return profile;
  },

  async signOut() {
    const state = await load();
    state.sessionUserId = null;
    await save();
  },

  async updateProfile(userId: string, patch: Partial<Profile>) {
    const state = await load();
    const idx = state.profiles.findIndex((p) => p.id === userId);
    if (idx < 0) throw new Error('Profil negăsit.');
    state.profiles[idx] = { ...state.profiles[idx], ...patch, id: userId };
    await save();
    return state.profiles[idx];
  },

  async getProfile(userId: string) {
    const state = await load();
    return state.profiles.find((p) => p.id === userId) ?? null;
  },

  async search(filters: SearchFilters = {}) {
    const state = await load();
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    let items = state.listings.filter((l) => l.status === 'active');

    if (filters.query) {
      const q = filters.query.toLowerCase();
      items = items.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          (l.brand ?? '').toLowerCase().includes(q)
      );
    }
    if (filters.categoryId) items = items.filter((l) => l.categoryId === filters.categoryId);
    if (filters.subcategoryId) items = items.filter((l) => l.subcategoryId === filters.subcategoryId);
    if (filters.cityId) items = items.filter((l) => l.cityId === filters.cityId);
    if (filters.countyId) {
      items = items.filter((l) => getCity(l.cityId)?.countyId === filters.countyId);
    }
    if (filters.freeOnly) items = items.filter((l) => l.isFree);
    if (filters.negotiableOnly) items = items.filter((l) => l.isNegotiable);
    if (filters.condition) items = items.filter((l) => l.condition === filters.condition);
    if (filters.newOnly) {
      items = items.filter((l) => l.condition === 'new_unopened' || l.condition === 'new_opened');
    }
    if (filters.usedOnly) {
      items = items.filter(
        (l) => l.condition === 'partially_used' || l.condition === 'used_reclaimed'
      );
    }
    if (filters.pickupAvailable) items = items.filter((l) => l.pickupAvailable);
    if (filters.deliveryAvailable) items = items.filter((l) => l.deliveryAvailable);
    if (filters.minPrice != null) items = items.filter((l) => l.price >= filters.minPrice!);
    if (filters.maxPrice != null) items = items.filter((l) => l.price <= filters.maxPrice!);

    const center =
      filters.centerLat != null && filters.centerLng != null
        ? { lat: filters.centerLat, lng: filters.centerLng }
        : filters.cityId
          ? (() => {
              const c = getCity(filters.cityId!);
              return c ? { lat: c.lat, lng: c.lng } : null;
            })()
          : null;

    if (!filters.countryWide && filters.radiusKm != null && center) {
      items = items.filter(
        (l) => haversineKm(center.lat, center.lng, l.lat, l.lng) <= filters.radiusKm!
      );
    }

    const enriched = items.map((l) => enrich(l, state, center ?? undefined));
    const sort = filters.sort ?? 'newest';
    enriched.sort((a, b) => {
      if (sort === 'price_asc') return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      if (sort === 'nearest') return (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9);
      return (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '');
    });

    const start = (page - 1) * pageSize;
    return {
      items: enriched.slice(start, start + pageSize),
      total: enriched.length,
      page,
      pageSize,
    };
  },

  async getListing(id: string, center?: { lat: number; lng: number }) {
    const state = await load();
    const listing = state.listings.find((l) => l.id === id);
    if (!listing) return null;
    return enrich(listing, state, center);
  },

  async listingsForSeller(sellerId: string) {
    const state = await load();
    return state.listings
      .filter((l) => l.sellerId === sellerId && l.status !== 'removed')
      .map((l) => enrich(l, state));
  },

  async createListing(sellerId: string, draft: ListingDraft) {
    const state = await load();
    const now = new Date().toISOString();
    const city = getCity(draft.cityId);
    const approx = approximateCoords(draft.lat || city?.lat || 45.9, draft.lng || city?.lng || 24.9);
    const listing: Listing = {
      id: createId('lst'),
      sellerId,
      title: draft.title,
      description: draft.description,
      categoryId: draft.categoryId,
      subcategoryId: draft.subcategoryId,
      brand: draft.brand,
      model: draft.model,
      condition: draft.condition,
      quantity: draft.quantity,
      unit: draft.unit,
      originalPackageQuantity: draft.originalPackageQuantity,
      price: draft.isFree ? 0 : draft.price,
      currency: draft.currency || 'RON',
      isNegotiable: draft.isFree ? false : draft.isNegotiable,
      isFree: draft.isFree,
      cityId: draft.cityId,
      countryId: draft.countryId || 'ro',
      lat: approx.lat,
      lng: approx.lng,
      pickupAvailable: draft.pickupAvailable,
      deliveryAvailable: draft.deliveryAvailable,
      storageNotes: draft.storageNotes,
      status: draft.status,
      publishedAt: draft.status === 'active' ? now : null,
      expiresAt: draft.status === 'active' ? daysFromNow(LISTING_EXPIRY_DAYS) : null,
      createdAt: now,
      updatedAt: now,
    };
    state.listings.unshift(listing);
    draft.photoUrls.forEach((url, i) => {
      state.photos.push({
        id: createId('ph'),
        listingId: listing.id,
        url,
        sortOrder: i,
      });
    });
    await save();
    return enrich(listing, state);
  },

  async updateListing(listingId: string, sellerId: string, patch: Partial<ListingDraft>) {
    const state = await load();
    const idx = state.listings.findIndex((l) => l.id === listingId && l.sellerId === sellerId);
    if (idx < 0) throw new Error('Anunțul nu a fost găsit.');
    const current = state.listings[idx];
    const now = new Date().toISOString();
    const { photoUrls, ...listingPatch } = patch;
    const nextStatus = listingPatch.status ?? current.status;
    state.listings[idx] = {
      ...current,
      ...listingPatch,
      id: current.id,
      sellerId: current.sellerId,
      price: (listingPatch.isFree ?? current.isFree) ? 0 : (listingPatch.price ?? current.price),
      publishedAt:
        nextStatus === 'active' && !current.publishedAt ? now : current.publishedAt,
      expiresAt:
        nextStatus === 'active' && !current.expiresAt
          ? daysFromNow(LISTING_EXPIRY_DAYS)
          : current.expiresAt,
      updatedAt: now,
    };
    if (photoUrls) {
      state.photos = state.photos.filter((p) => p.listingId !== listingId);
      photoUrls.forEach((url, i) => {
        state.photos.push({ id: createId('ph'), listingId, url, sortOrder: i });
      });
    }
    await save();
    return enrich(state.listings[idx], state);
  },

  async setListingStatus(listingId: string, sellerId: string, status: Listing['status']) {
    return this.updateListing(listingId, sellerId, { status } as Partial<ListingDraft>);
  },

  async deleteListing(listingId: string, sellerId: string) {
    return this.setListingStatus(listingId, sellerId, 'removed');
  },

  async getFavorites(userId: string) {
    const state = await load();
    const ids = state.favorites.filter((f) => f.userId === userId).map((f) => f.listingId);
    return state.listings
      .filter((l) => ids.includes(l.id) && l.status !== 'removed')
      .map((l) => enrich(l, state));
  },

  async isFavorite(userId: string, listingId: string) {
    const state = await load();
    return state.favorites.some((f) => f.userId === userId && f.listingId === listingId);
  },

  async toggleFavorite(userId: string, listingId: string) {
    const state = await load();
    const existing = state.favorites.findIndex(
      (f) => f.userId === userId && f.listingId === listingId
    );
    if (existing >= 0) {
      state.favorites.splice(existing, 1);
      await save();
      return false;
    }
    state.favorites.push({
      id: createId('fav'),
      userId,
      listingId,
      createdAt: new Date().toISOString(),
    });
    await save();
    return true;
  },

  meta: {
    country: COUNTRY_RO,
    counties: COUNTIES,
    cities: CITIES,
    categories: CATEGORIES,
    subcategories: SUBCATEGORIES,
  },
};
