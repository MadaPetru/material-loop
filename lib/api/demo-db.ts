import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATEGORIES, SUBCATEGORIES } from '@/data/categories';
import { COUNTRY_RO, COUNTIES, CITIES, getCity, getCounty } from '@/data/romania';
import { SEED_LISTINGS, SEED_PHOTOS, SEED_PROFILES } from '@/data/seed-listings';
import { approximateCoords, daysFromNow, haversineKm } from '@/lib/geo';
import { createId } from '@/lib/id';
import { LISTING_EXPIRY_DAYS } from '@/lib/config';
import { normalizeRoPhone } from '@/lib/phone';
import {
  assertEntitlement,
  DEFAULT_ROLE_DEFINITIONS,
  filterKnownEntitlements,
  hasEntitlement,
  isValidRoleSlug,
  normalizeRoles,
  setRoleDefinitions,
} from '@/lib/entitlements';
import type {
  AdminAnalytics,
  ChatMessage,
  Conversation,
  ConversationWithMeta,
  Favorite,
  Listing,
  ListingDraft,
  ListingPhoto,
  ListingWithRelations,
  MarketingAd,
  Profile,
  RoleDefinition,
  SearchFilters,
  UserRole,
} from '@/lib/types';
import { otherParticipantId, withMeta } from './messaging-shared';

const STORAGE_KEY = 'materialloop.demo.v7';

/** Demo OTP always accepts this code (and any 6 digits after send). */
export const DEMO_PHONE_OTP = '123456';

type PendingPhone = { userId: string; phone: string; code: string; sentAt: number };

type DemoState = {
  profiles: Profile[];
  listings: Listing[];
  photos: ListingPhoto[];
  favorites: Favorite[];
  conversations: Conversation[];
  messages: ChatMessage[];
  roles: RoleDefinition[];
  ads: MarketingAd[];
  sessionUserId: string | null;
  passwords: Record<string, string>;
  pendingPhone: PendingPhone | null;
};

let memory: DemoState | null = null;
let ready: Promise<void> | null = null;

function defaultRoles(): RoleDefinition[] {
  return DEFAULT_ROLE_DEFINITIONS.map((r) => ({
    ...r,
    entitlements: [...r.entitlements],
    createdAt: new Date().toISOString(),
  }));
}

function defaultState(): DemoState {
  return {
    profiles: structuredClone(SEED_PROFILES),
    listings: structuredClone(SEED_LISTINGS),
    photos: structuredClone(SEED_PHOTOS),
    favorites: [],
    conversations: [],
    messages: [],
    roles: defaultRoles(),
    ads: [],
    sessionUserId: null,
    passwords: {
      'demo@materialloop.ro': 'demo1234',
      'ana@example.ro': 'demo1234',
      'admin@materialloop.ro': 'demo1234',
    },
    pendingPhone: null,
  };
}

function applyRoleCatalog(roles: RoleDefinition[]) {
  setRoleDefinitions(roles);
}

async function load() {
  if (memory) return memory;
  if (!ready) {
    ready = (async () => {
      const defaults = defaultState();
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) {
          memory = defaults;
          applyRoleCatalog(memory.roles);
          return;
        }
        const parsed = JSON.parse(raw) as Partial<DemoState>;
        // Merge so older local demos still keep seed passwords / data shape.
        const profiles = (parsed.profiles?.length ? parsed.profiles : defaults.profiles).map(
          (p) => ({ ...p, roles: normalizeRoles(p.roles) }),
        );
        const roles =
          parsed.roles?.length
            ? parsed.roles.map((r) => ({
                ...r,
                entitlements: filterKnownEntitlements(r.entitlements),
              }))
            : defaults.roles;
        memory = {
          profiles,
          listings: parsed.listings?.length ? parsed.listings : defaults.listings,
          photos: parsed.photos?.length ? parsed.photos : defaults.photos,
          favorites: parsed.favorites ?? [],
          conversations: parsed.conversations ?? [],
          messages: parsed.messages ?? [],
          roles,
          ads: parsed.ads ?? [],
          sessionUserId: parsed.sessionUserId ?? null,
          passwords: { ...defaults.passwords, ...(parsed.passwords ?? {}) },
          pendingPhone: parsed.pendingPhone ?? null,
        };
        applyRoleCatalog(memory.roles);
      } catch {
        memory = defaults;
        applyRoleCatalog(memory.roles);
      }
    })();
  }
  await ready;
  const state = memory ?? defaultState();
  memory = state;
  applyRoleCatalog(state.roles);
  return state;
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
    applyRoleCatalog(memory.roles);
    await save();
  },

  async loadRoleCatalog() {
    const state = await load();
    applyRoleCatalog(state.roles);
    return [...state.roles].sort((a, b) => a.id.localeCompare(b.id));
  },

  async listRoles() {
    return this.loadRoleCatalog();
  },

  async upsertRole(input: {
    id: string;
    label: string;
    description?: string;
    entitlements: string[];
  }) {
    await this.requireEntitlement('admin.roles.manage');
    const id = input.id.trim().toLowerCase();
    if (!isValidRoleSlug(id)) {
      throw new Error('ID rol invalid. Folosește litere mici, cifre, _ sau -.');
    }
    const label = input.label.trim();
    if (!label) throw new Error('Completează eticheta rolului.');
    const state = await load();
    const entitlements = filterKnownEntitlements(input.entitlements);
    const existing = state.roles.find((r) => r.id === id);
    const next: RoleDefinition = {
      id,
      label,
      description: input.description?.trim() ?? '',
      entitlements,
      system: existing?.system ?? false,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    state.roles = [...state.roles.filter((r) => r.id !== id), next];
    applyRoleCatalog(state.roles);
    await save();
    return next;
  },

  async deleteRole(roleId: string) {
    await this.requireEntitlement('admin.roles.manage');
    const state = await load();
    const role = state.roles.find((r) => r.id === roleId);
    if (!role) throw new Error('Rol negăsit.');
    if (role.system) throw new Error('Rolurile de sistem nu pot fi șterse.');
    state.roles = state.roles.filter((r) => r.id !== roleId);
    state.profiles = state.profiles.map((p) => ({
      ...p,
      roles: normalizeRoles(p.roles.filter((r) => r !== roleId)),
    }));
    applyRoleCatalog(state.roles);
    await save();
  },

  async listMarketingAds(): Promise<MarketingAd[]> {
    await this.requireEntitlement('marketing.panel');
    const state = await load();
    return [...state.ads].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async upsertMarketingAd(input: {
    id?: string;
    title: string;
    body: string;
    active: boolean;
  }): Promise<MarketingAd> {
    const me = await this.requireEntitlement('marketing.ads');
    const title = input.title.trim();
    if (!title) throw new Error('Completează titlul anunțului.');
    const state = await load();
    const now = new Date().toISOString();
    if (input.id) {
      const idx = state.ads.findIndex((a) => a.id === input.id);
      if (idx < 0) throw new Error('Anunț negăsit.');
      state.ads[idx] = {
        ...state.ads[idx],
        title,
        body: input.body.trim(),
        active: input.active,
        updatedAt: now,
      };
      await save();
      return state.ads[idx];
    }
    const ad: MarketingAd = {
      id: createId('ad'),
      title,
      body: input.body.trim(),
      active: input.active,
      createdBy: me.id,
      createdAt: now,
      updatedAt: now,
    };
    state.ads.unshift(ad);
    await save();
    return ad;
  },

  async deleteMarketingAd(adId: string) {
    await this.requireEntitlement('marketing.ads');
    const state = await load();
    state.ads = state.ads.filter((a) => a.id !== adId);
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
      roles: ['user'],
      cityId: 'bh-oradea',
      phone: null,
      phoneVerifiedAt: null,
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
      throw new Error('Email sau parolă greșită. Verifică datele sau resetează parola.');
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
    // Phone / roles / deactivation are managed through dedicated flows.
    const {
      phone: _phone,
      phoneVerifiedAt: _verified,
      roles: _roles,
      deactivatedAt: _deactivated,
      ...safe
    } = patch;
    state.profiles[idx] = { ...state.profiles[idx], ...safe, id: userId };
    await save();
    return state.profiles[idx];
  },

  async requireEntitlement(entitlement: Parameters<typeof assertEntitlement>[1]) {
    const state = await load();
    const me = state.profiles.find((p) => p.id === state.sessionUserId) ?? null;
    assertEntitlement(me, entitlement);
    return me!;
  },

  async adminListUsers() {
    await this.requireEntitlement('admin.users.read');
    const state = await load();
    return [...state.profiles].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async adminUpdateUser(
    targetUserId: string,
    patch: { roles?: UserRole[]; deactivated?: boolean },
  ) {
    const actor = await this.requireEntitlement('admin.users.manage');
    const state = await load();
    const idx = state.profiles.findIndex((p) => p.id === targetUserId);
    if (idx < 0) throw new Error('Utilizator negăsit.');
    const next = { ...state.profiles[idx] };
    if (patch.roles !== undefined) next.roles = normalizeRoles(patch.roles);
    if (patch.deactivated === true) next.deactivatedAt = new Date().toISOString();
    if (patch.deactivated === false) next.deactivatedAt = null;

    if (actor.id === targetUserId) {
      if (!hasEntitlement(next, 'admin.panel')) {
        throw new Error('Nu îți poți elimina propriul drept de administrator.');
      }
      if (patch.deactivated === true) {
        throw new Error('Nu îți poți dezactiva propriul cont din panoul admin.');
      }
    }

    state.profiles[idx] = next;
    await save();
    return next;
  },

  async adminGetAnalytics(): Promise<AdminAnalytics> {
    await this.requireEntitlement('admin.analytics');
    const state = await load();
    const usersActive = state.profiles.filter((p) => !p.deactivatedAt).length;
    const usersDeactivated = state.profiles.length - usersActive;
    return {
      usersTotal: state.profiles.length,
      usersActive,
      usersDeactivated,
      admins: state.profiles.filter((p) => hasEntitlement(p, 'admin.panel')).length,
      listingsActive: state.listings.filter((l) => l.status === 'active').length,
      listingsTotal: state.listings.filter((l) => l.status !== 'removed').length,
      conversations: state.conversations.length,
    };
  },

  async requestPhoneVerification(userId: string, phoneInput: string) {
    const phone = normalizeRoPhone(phoneInput);
    if (!phone) throw new Error('Număr invalid. Folosește un mobil românesc (07…).');
    const state = await load();
    const profile = state.profiles.find((p) => p.id === userId);
    if (!profile) throw new Error('Profil negăsit.');
    if (state.sessionUserId !== userId) throw new Error('Autentifică-te din nou.');
    state.pendingPhone = {
      userId,
      phone,
      code: DEMO_PHONE_OTP,
      sentAt: Date.now(),
    };
    await save();
    return { phone, demoCode: DEMO_PHONE_OTP };
  },

  async confirmPhoneVerification(userId: string, phoneInput: string, token: string) {
    const phone = normalizeRoPhone(phoneInput);
    if (!phone) throw new Error('Număr invalid.');
    const code = token.trim();
    if (!/^\d{6}$/.test(code)) throw new Error('Codul trebuie să aibă 6 cifre.');
    const state = await load();
    const idx = state.profiles.findIndex((p) => p.id === userId);
    if (idx < 0) throw new Error('Profil negăsit.');
    if (state.sessionUserId !== userId) throw new Error('Autentifică-te din nou.');
    const pending = state.pendingPhone;
    if (!pending || pending.userId !== userId || pending.phone !== phone) {
      throw new Error('Trimite mai întâi codul de verificare.');
    }
    if (Date.now() - pending.sentAt > 10 * 60 * 1000) {
      state.pendingPhone = null;
      await save();
      throw new Error('Codul a expirat. Trimite din nou.');
    }
    if (code !== pending.code && code !== DEMO_PHONE_OTP) {
      throw new Error('Cod greșit. În demo folosește 123456.');
    }
    state.profiles[idx] = {
      ...state.profiles[idx],
      phone,
      phoneVerifiedAt: new Date().toISOString(),
    };
    state.pendingPhone = null;
    await save();
    return state.profiles[idx];
  },

  async clearPhone(userId: string) {
    const state = await load();
    const idx = state.profiles.findIndex((p) => p.id === userId);
    if (idx < 0) throw new Error('Profil negăsit.');
    state.profiles[idx] = {
      ...state.profiles[idx],
      phone: null,
      phoneVerifiedAt: null,
    };
    if (state.pendingPhone?.userId === userId) state.pendingPhone = null;
    await save();
    return state.profiles[idx];
  },

  async deleteAccount(userId: string) {
    const state = await load();
    if (state.sessionUserId !== userId) throw new Error('Autentifică-te din nou.');
    const profile = state.profiles.find((p) => p.id === userId);
    if (!profile) throw new Error('Profil negăsit.');

    const listingIds = new Set(
      state.listings.filter((l) => l.sellerId === userId).map((l) => l.id),
    );
    const conversationIds = new Set(
      state.conversations
        .filter(
          (c) =>
            c.buyerId === userId ||
            c.sellerId === userId ||
            listingIds.has(c.listingId),
        )
        .map((c) => c.id),
    );

    state.messages = state.messages.filter((m) => !conversationIds.has(m.conversationId));
    state.conversations = state.conversations.filter((c) => !conversationIds.has(c.id));
    state.favorites = state.favorites.filter(
      (f) => f.userId !== userId && !listingIds.has(f.listingId),
    );
    state.photos = state.photos.filter((p) => !listingIds.has(p.listingId));
    state.listings = state.listings.filter((l) => l.sellerId !== userId);
    state.profiles = state.profiles.filter((p) => p.id !== userId);
    delete state.passwords[profile.email.toLowerCase()];
    if (state.pendingPhone?.userId === userId) state.pendingPhone = null;
    state.sessionUserId = null;
    await save();
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

  async listConversations(userId: string): Promise<ConversationWithMeta[]> {
    const state = await load();
    const mine = state.conversations
      .filter((c) => c.buyerId === userId || c.sellerId === userId)
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));

    return mine.map((c) => {
      const listing = state.listings.find((l) => l.id === c.listingId);
      const otherId = otherParticipantId(c, userId);
      const last = state.messages
        .filter((m) => m.conversationId === c.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      return withMeta(c, {
        userId,
        otherUser: state.profiles.find((p) => p.id === otherId) ?? null,
        listingTitle: listing?.title,
        listingPhotoUrl: state.photos.find((p) => p.listingId === c.listingId)?.url ?? null,
        lastMessageBody: last?.body ?? null,
      });
    });
  },

  async getConversation(conversationId: string, userId: string) {
    const state = await load();
    const c = state.conversations.find((x) => x.id === conversationId);
    if (!c || (c.buyerId !== userId && c.sellerId !== userId)) return null;
    const listing = state.listings.find((l) => l.id === c.listingId);
    const otherId = otherParticipantId(c, userId);
    const last = state.messages
      .filter((m) => m.conversationId === c.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    return withMeta(c, {
      userId,
      otherUser: state.profiles.find((p) => p.id === otherId) ?? null,
      listingTitle: listing?.title,
      listingPhotoUrl: state.photos.find((p) => p.listingId === c.listingId)?.url ?? null,
      lastMessageBody: last?.body ?? null,
    });
  },

  async getMessages(conversationId: string, userId: string) {
    const state = await load();
    const c = state.conversations.find((x) => x.id === conversationId);
    if (!c || (c.buyerId !== userId && c.sellerId !== userId)) {
      throw new Error('Conversația nu a fost găsită.');
    }
    return state.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async sendMessage(conversationId: string, senderId: string, body: string) {
    const state = await load();
    const text = body.trim();
    if (!text) throw new Error('Mesajul nu poate fi gol.');
    const c = state.conversations.find((x) => x.id === conversationId);
    if (!c || (c.buyerId !== senderId && c.sellerId !== senderId)) {
      throw new Error('Nu poți trimite mesaje în această conversație.');
    }
    const now = new Date().toISOString();
    const message: ChatMessage = {
      id: createId('msg'),
      conversationId,
      senderId,
      body: text.slice(0, 2000),
      createdAt: now,
    };
    state.messages.push(message);
    c.lastMessageAt = now;
    await save();
    return message;
  },

  async startConversation(params: {
    listingId: string;
    buyerId: string;
    sellerId: string;
    initialMessage?: string;
  }) {
    const state = await load();
    if (params.buyerId === params.sellerId) {
      throw new Error('Nu poți contacta propriul anunț.');
    }
    const listing = state.listings.find((l) => l.id === params.listingId);
    if (!listing) throw new Error('Anunțul nu a fost găsit.');

    let conversation = state.conversations.find(
      (c) => c.listingId === params.listingId && c.buyerId === params.buyerId
    );
    const now = new Date().toISOString();
    if (!conversation) {
      conversation = {
        id: createId('conv'),
        listingId: params.listingId,
        buyerId: params.buyerId,
        sellerId: params.sellerId,
        lastMessageAt: now,
        createdAt: now,
      };
      state.conversations.unshift(conversation);
    }

    if (params.initialMessage?.trim()) {
      await this.sendMessage(conversation.id, params.buyerId, params.initialMessage);
    } else {
      await save();
    }

    return (await this.getConversation(conversation.id, params.buyerId))!;
  },

  meta: {
    country: COUNTRY_RO,
    counties: COUNTIES,
    cities: CITIES,
    categories: CATEGORIES,
    subcategories: SUBCATEGORIES,
  },
};
