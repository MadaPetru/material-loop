import { Platform } from 'react-native';
import type { User } from '@supabase/supabase-js';
import { CATEGORIES, SUBCATEGORIES } from '@/data/categories';
import { COUNTRY_RO, COUNTIES, CITIES, getCity } from '@/data/romania';
import { AUTH_EMAIL_CONFIRM_REQUIRED } from '@/lib/auth/errors';
import {
  createSessionFromUrl,
  getOAuthRedirectTo,
  oauthErrorMessage,
  openOAuthSession,
} from '@/lib/auth/oauth';
import { getAuthRedirectTo } from '@/lib/auth/redirect';
import { approximateCoords, daysFromNow, haversineKm } from '@/lib/geo';
import { LISTING_EXPIRY_DAYS } from '@/lib/config';
import {
  assertAnyEntitlement,
  assertEntitlement,
  filterKnownEntitlements,
  hasEntitlement,
  isValidRoleSlug,
  normalizeRoles,
  setRoleDefinitions,
  type Entitlement,
} from '@/lib/entitlements';
import { normalizeRoPhone } from '@/lib/phone';
import { getSupabase } from '@/lib/supabase';
import type {
  AdminAnalytics,
  ConversationWithMeta,
  ListingDraft,
  ListingStatus,
  MarketingAd,
  Profile,
  RoleDefinition,
  SearchFilters,
  UserRole,
} from '@/lib/types';
import {
  enrichListing,
  mapListing,
  mapPhoto,
  mapProfile,
  toEwkt,
  type DbListing,
  type DbPhoto,
  type DbProfile,
} from './mappers';
import { isPublicFeedListing } from '@/lib/listingVisibility';
import { mapConversationRow, mapMessageRow, otherParticipantId, withMeta } from './messaging-shared';

function client() {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase nu este configurat.');
  return sb;
}

/** Scrub profile + hide listings when the Edge Function is unavailable. */
async function softDeleteOwnAccount(sb: ReturnType<typeof client>, userId: string) {
  const now = new Date().toISOString();

  const { error: listingError } = await sb
    .from('listings')
    .update({ status: 'removed', updated_at: now })
    .eq('seller_id', userId);
  if (listingError) throw new Error(listingError.message);

  await sb.from('favorites').delete().eq('user_id', userId);

  const scrub = {
    display_name: 'Cont șters',
    email: `deleted-${userId}@deleted.local`,
    phone: null as string | null,
    bio: null as string | null,
    avatar_url: null as string | null,
    deactivated_at: now,
  };

  let { error: profileError } = await sb
    .from('profiles')
    .update({ ...scrub, phone_verified_at: null })
    .eq('id', userId);

  // Migration 006 may not be applied yet — retry without phone_verified_at.
  if (profileError && /phone_verified_at/i.test(profileError.message)) {
    ({ error: profileError } = await sb.from('profiles').update(scrub).eq('id', userId));
  }

  if (profileError) throw new Error(profileError.message);
}

function displayNameFromUser(user: User) {
  const meta = user.user_metadata ?? {};
  return (
    meta.display_name ||
    meta.full_name ||
    meta.name ||
    user.email?.split('@')[0] ||
    'Utilizator'
  );
}

function avatarFromUser(user: User): string | null {
  const meta = user.user_metadata ?? {};
  return meta.avatar_url || meta.picture || null;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await client().from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapProfile(data as DbProfile) : null;
}

async function ensureProfile(userId: string, email: string, displayName?: string, avatarUrl?: string | null): Promise<Profile> {
  const existing = await fetchProfile(userId);
  if (existing) {
    const patch: Record<string, unknown> = {};
    if (!existing.avatarUrl && avatarUrl) patch.avatar_url = avatarUrl;
    // Upgrade placeholder names (email local-part) when Google provides a real name.
    if (
      displayName &&
      displayName !== existing.displayName &&
      (!existing.displayName || existing.displayName === (email.split('@')[0] || ''))
    ) {
      patch.display_name = displayName;
    }
    if (Object.keys(patch).length) {
      const { data, error } = await client()
        .from('profiles')
        .update(patch)
        .eq('id', userId)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return mapProfile(data as DbProfile);
    }
    return existing;
  }

  const city = getCity('bh-oradea');
  const row = {
    id: userId,
    email,
    display_name: displayName || email.split('@')[0] || 'Utilizator',
    avatar_url: avatarUrl ?? null,
    account_type: 'individual',
    roles: ['user'],
    city_id: city?.id ?? null,
    phone: null,
    phone_verified_at: null,
    bio: null,
    location: city ? toEwkt(city.lat, city.lng) : null,
    seller_rating: null,
    rating_count: 0,
    completed_sales: 0,
  };

  const { data, error } = await client().from('profiles').insert(row).select('*').single();
  if (error) throw new Error(error.message);
  return mapProfile(data as DbProfile);
}

async function profileFromAuthUser(user: User) {
  return ensureProfile(
    user.id,
    user.email ?? '',
    displayNameFromUser(user),
    avatarFromUser(user)
  );
}

async function photosForListings(listingIds: string[]) {
  if (!listingIds.length) return [] as DbPhoto[];
  const { data, error } = await client()
    .from('listing_photos')
    .select('*')
    .in('listing_id', listingIds)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as DbPhoto[];
}

async function profilesByIds(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map<string, Profile>();
  const { data, error } = await client().from('profiles').select('*').in('id', unique);
  if (error) throw new Error(error.message);
  const map = new Map<string, Profile>();
  for (const row of (data ?? []) as DbProfile[]) {
    map.set(row.id, mapProfile(row));
  }
  return map;
}

async function enrichMany(rows: DbListing[], center?: { lat: number; lng: number }) {
  const photos = await photosForListings(rows.map((r) => r.id));
  const sellers = await profilesByIds(rows.map((r) => r.seller_id));
  const byListing = new Map<string, ReturnType<typeof mapPhoto>[]>();
  for (const p of photos) {
    const list = byListing.get(p.listing_id) ?? [];
    list.push(mapPhoto(p));
    byListing.set(p.listing_id, list);
  }
  return rows.map((row) => {
    const listing = mapListing(row);
    return enrichListing(listing, byListing.get(row.id) ?? [], sellers.get(row.seller_id), center);
  });
}

export const supabaseDb = {
  async getSession() {
    const { data, error } = await client().auth.getSession();
    if (error) throw new Error(error.message);
    const user = data.session?.user;
    if (!user) return null;
    return profileFromAuthUser(user);
  },

  async signUp(email: string, password: string, displayName: string) {
    const { data, error } = await client().auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: getAuthRedirectTo('login'),
      },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Nu s-a putut crea contul.');
    // Email confirmation may leave session null — profile is created by DB trigger.
    if (data.session) {
      return ensureProfile(data.user.id, email, displayName, avatarFromUser(data.user));
    }
    throw new Error(AUTH_EMAIL_CONFIRM_REQUIRED);
  },

  async updatePassword(password: string) {
    const { data: sessionData, error: sessionError } = await client().auth.getSession();
    if (sessionError) throw new Error(sessionError.message);
    if (!sessionData.session) {
      throw new Error('Autentifică-te din nou pentru a schimba parola.');
    }
    const { error } = await client().auth.updateUser({ password });
    if (error) throw new Error(error.message);
  },

  async signIn(email: string, password: string) {
    const { data, error } = await client().auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(
        error.message === 'Invalid login credentials'
          ? 'Email sau parolă greșită. Verifică datele sau resetează parola.'
          : error.message
      );
    }
    if (!data.user) throw new Error('Autentificare eșuată.');
    const profile = await profileFromAuthUser(data.user);
    if (profile.deactivatedAt) {
      await client().auth.signOut();
      throw new Error('Contul este dezactivat.');
    }
    return profile;
  },

  async signOut() {
    const { error } = await client().auth.signOut();
    if (error) throw new Error(error.message);
  },

  async updateProfile(userId: string, patch: Partial<Profile>) {
    const me = await this.getSession();
    if (me?.id !== userId) throw new Error('Autentifică-te din nou.');
    assertEntitlement(me, 'profile.edit');
    const update: Record<string, unknown> = {};
    if (patch.displayName !== undefined) update.display_name = patch.displayName;
    if (patch.avatarUrl !== undefined) update.avatar_url = patch.avatarUrl;
    if (patch.accountType !== undefined) update.account_type = patch.accountType;
    if (patch.cityId !== undefined) update.city_id = patch.cityId;
    // Phone / roles / deactivation are managed through dedicated flows.
    if (patch.bio !== undefined) update.bio = patch.bio;
    if (patch.lat != null && patch.lng != null) {
      update.location = toEwkt(patch.lat, patch.lng);
    } else if (patch.cityId) {
      const city = getCity(patch.cityId);
      if (city) update.location = toEwkt(city.lat, city.lng);
    }

    const { data, error } = await client()
      .from('profiles')
      .update(update)
      .eq('id', userId)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapProfile(data as DbProfile);
  },

  async requireEntitlement(entitlement: Entitlement) {
    const me = await this.getSession();
    assertEntitlement(me, entitlement);
    return me!;
  },

  async adminListUsers() {
    await this.requireEntitlement('admin.users.read');
    const { data, error } = await client()
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbProfile[]).map(mapProfile);
  },

  async loadRoleCatalog() {
    const { data, error } = await client()
      .from('roles')
      .select('id, label, description, entitlements, system, created_at')
      .order('id');
    if (error) throw new Error(error.message);
    const roles: RoleDefinition[] = ((data ?? []) as Array<{
      id: string;
      label: string;
      description: string;
      entitlements: string[] | null;
      system: boolean;
      created_at: string;
    }>).map((row) => ({
      id: row.id,
      label: row.label,
      description: row.description ?? '',
      entitlements: filterKnownEntitlements(row.entitlements),
      system: Boolean(row.system),
      createdAt: row.created_at,
    }));
    setRoleDefinitions(roles);
    return roles;
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
    await this.requireEntitlement('admin.roles.write');
    const id = input.id.trim().toLowerCase();
    if (!isValidRoleSlug(id)) {
      throw new Error('ID rol invalid. Folosește litere mici, cifre, _ sau -.');
    }
    const label = input.label.trim();
    if (!label) throw new Error('Completează eticheta rolului.');
    const entitlements = filterKnownEntitlements(input.entitlements);

    const { data, error } = await client()
      .from('roles')
      .upsert(
        {
          id,
          label,
          description: input.description?.trim() ?? '',
          entitlements,
        },
        { onConflict: 'id' },
      )
      .select('id, label, description, entitlements, system, created_at')
      .single();
    if (error) throw new Error(error.message);
    await this.loadRoleCatalog();
    const row = data as {
      id: string;
      label: string;
      description: string;
      entitlements: string[] | null;
      system: boolean;
      created_at: string;
    };
    return {
      id: row.id,
      label: row.label,
      description: row.description ?? '',
      entitlements: filterKnownEntitlements(row.entitlements),
      system: Boolean(row.system),
      createdAt: row.created_at,
    } satisfies RoleDefinition;
  },

  async deleteRole(roleId: string) {
    await this.requireEntitlement('admin.roles.delete');
    const { error } = await client().from('roles').delete().eq('id', roleId);
    if (error) throw new Error(error.message);
    await this.loadRoleCatalog();
  },

  async adminUpdateUser(
    targetUserId: string,
    patch: { roles?: UserRole[]; deactivated?: boolean },
  ) {
    const actor = await this.getSession();
    if (patch.roles !== undefined) assertEntitlement(actor, 'admin.users.roles');
    if (patch.deactivated !== undefined) assertEntitlement(actor, 'admin.users.deactivate');
    if (patch.roles === undefined && patch.deactivated === undefined) {
      assertAnyEntitlement(actor, ['admin.users.roles', 'admin.users.deactivate']);
    }
    const current = await fetchProfile(targetUserId);
    if (!current) throw new Error('Utilizator negăsit.');

    const nextRoles = patch.roles !== undefined ? normalizeRoles(patch.roles) : current.roles;

    const nextDeactivatedAt =
      patch.deactivated === true
        ? new Date().toISOString()
        : patch.deactivated === false
          ? null
          : current.deactivatedAt;

    if (actor!.id === targetUserId) {
      if (!hasEntitlement({ roles: nextRoles, deactivatedAt: nextDeactivatedAt }, 'admin.panel')) {
        throw new Error('Nu îți poți elimina propriul drept de administrator.');
      }
      if (patch.deactivated === true) {
        throw new Error('Nu îți poți dezactiva propriul cont din panoul admin.');
      }
    }

    const update: Record<string, unknown> = {};
    if (patch.roles !== undefined) update.roles = nextRoles;
    if (patch.deactivated === true) update.deactivated_at = nextDeactivatedAt;
    if (patch.deactivated === false) update.deactivated_at = null;

    const { data, error } = await client()
      .from('profiles')
      .update(update)
      .eq('id', targetUserId)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapProfile(data as DbProfile);
  },

  async listMarketingAds(): Promise<MarketingAd[]> {
    const me = await this.getSession();
    assertAnyEntitlement(me, ['marketing.panel', 'marketing.ads.read']);
    const { data, error } = await client()
      .from('marketing_ads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as Array<{
      id: string;
      title: string;
      body: string;
      active: boolean;
      created_by: string | null;
      created_at: string;
      updated_at: string;
    }>).map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body ?? '',
      active: Boolean(row.active),
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async upsertMarketingAd(input: {
    id?: string;
    title: string;
    body: string;
    active: boolean;
  }): Promise<MarketingAd> {
    const me = await this.getSession();
    assertEntitlement(me, 'marketing.ads.write');
    if (!me) throw new Error('Autentifică-te din nou.');
    const title = input.title.trim();
    if (!title) throw new Error('Completează subiectul schiței.');
    const now = new Date().toISOString();
    const sb = client();
    const query = input.id
      ? sb
          .from('marketing_ads')
          .update({
            title,
            body: input.body.trim(),
            active: input.active,
            updated_at: now,
          })
          .eq('id', input.id)
          .select('*')
          .single()
      : sb
          .from('marketing_ads')
          .insert({
            title,
            body: input.body.trim(),
            active: input.active,
            created_by: me.id,
            created_at: now,
            updated_at: now,
          })
          .select('*')
          .single();
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const row = data as {
      id: string;
      title: string;
      body: string;
      active: boolean;
      created_by: string | null;
      created_at: string;
      updated_at: string;
    };
    return {
      id: row.id,
      title: row.title,
      body: row.body ?? '',
      active: Boolean(row.active),
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async deleteMarketingAd(adId: string) {
    const me = await this.getSession();
    assertEntitlement(me, 'marketing.ads.delete');
    const { error } = await client().from('marketing_ads').delete().eq('id', adId);
    if (error) throw new Error(error.message);
  },

  async adminGetAnalytics(): Promise<AdminAnalytics> {
    await this.requireEntitlement('admin.analytics');
    const sb = client();
    const [
      { data: profiles, error: profilesError },
      { data: listingRows, error: listingsError },
      { count: conversations, error: convError },
      { count: messages, error: messagesError },
    ] = await Promise.all([
      sb.from('profiles').select('roles, deactivated_at, is_seed'),
      sb.from('listings').select('status, is_seed, city_id').neq('status', 'removed'),
      sb.from('conversations').select('*', { count: 'exact', head: true }),
      sb.from('messages').select('*', { count: 'exact', head: true }),
    ]);
    if (profilesError) throw new Error(profilesError.message);
    if (listingsError) throw new Error(listingsError.message);
    if (convError) throw new Error(convError.message);
    if (messagesError) throw new Error(messagesError.message);

    const rows = (profiles ?? []) as Array<{
      roles?: string[] | null;
      deactivated_at: string | null;
      is_seed?: boolean | null;
    }>;
    const listings = (listingRows ?? []) as Array<{
      status: string;
      is_seed?: boolean | null;
      city_id: string;
    }>;
    const usersActive = rows.filter((p) => !p.deactivated_at).length;
    const usersSeed = rows.filter((p) => !!p.is_seed).length;
    const active = listings.filter((l) => l.status === 'active');
    const sold = listings.filter((l) => l.status === 'sold');
    const given = listings.filter((l) => l.status === 'given_away');
    const activeCountyIds = new Set(
      active
        .map((l) => getCity(l.city_id)?.countyId)
        .filter((id): id is string => !!id),
    );
    return {
      usersTotal: rows.length,
      usersActive,
      usersDeactivated: rows.length - usersActive,
      usersSeed,
      usersOrganic: rows.length - usersSeed,
      admins: rows.filter((p) =>
        hasEntitlement(
          { roles: (p.roles ?? []) as UserRole[], deactivatedAt: p.deactivated_at },
          'admin.panel',
        ),
      ).length,
      listingsActive: active.length,
      listingsActiveSeed: active.filter((l) => !!l.is_seed).length,
      listingsActiveOrganic: active.filter((l) => !l.is_seed).length,
      listingsTotal: listings.length,
      listingsSeed: listings.filter((l) => !!l.is_seed).length,
      listingsOrganic: listings.filter((l) => !l.is_seed).length,
      listingsSold: sold.filter((l) => !l.is_seed).length,
      listingsGivenAway: given.filter((l) => !l.is_seed).length,
      listingsSoldSeed: sold.filter((l) => !!l.is_seed).length,
      listingsGivenAwaySeed: given.filter((l) => !!l.is_seed).length,
      conversations: conversations ?? 0,
      messages: messages ?? 0,
      countiesWithActiveListings: activeCountyIds.size,
      countiesTotal: COUNTIES.length,
    };
  },

  async requestPhoneVerification(userId: string, phoneInput: string) {
    const phone = normalizeRoPhone(phoneInput);
    if (!phone) throw new Error('Număr invalid. Folosește un mobil românesc (07…).');
    const me = await this.getSession();
    if (me?.id !== userId) throw new Error('Autentifică-te din nou.');
    assertEntitlement(me, 'profile.phone');
    const sb = client();

    const { error } = await sb.auth.updateUser({ phone });
    if (error) throw new Error(error.message);
    return { phone };
  },

  async confirmPhoneVerification(userId: string, phoneInput: string, token: string) {
    const phone = normalizeRoPhone(phoneInput);
    if (!phone) throw new Error('Număr invalid.');
    const code = token.trim();
    if (!/^\d{6}$/.test(code)) throw new Error('Codul trebuie să aibă 6 cifre.');

    const me = await this.getSession();
    if (me?.id !== userId) throw new Error('Autentifică-te din nou.');
    assertEntitlement(me, 'profile.phone');
    const sb = client();

    const { data, error } = await sb.auth.verifyOtp({
      phone,
      token: code,
      type: 'phone_change',
    });
    if (error) throw new Error(error.message);

    const verifiedPhone = data.user?.phone ? normalizeRoPhone(data.user.phone) : phone;
    if (!verifiedPhone) throw new Error('Verificarea a reușit, dar numărul lipsește.');

    const { data: row, error: updateError } = await sb
      .from('profiles')
      .update({
        phone: verifiedPhone,
        phone_verified_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('*')
      .single();
    if (updateError) throw new Error(updateError.message);
    return mapProfile(row as DbProfile);
  },

  async clearPhone(userId: string) {
    const me = await this.getSession();
    if (me?.id !== userId) throw new Error('Autentifică-te din nou.');
    assertEntitlement(me, 'profile.phone');
    const sb = client();

    const { data: row, error } = await sb
      .from('profiles')
      .update({ phone: null, phone_verified_at: null })
      .eq('id', userId)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapProfile(row as DbProfile);
  },

  async deleteAccount(userId: string) {
    const me = await this.getSession();
    if (me?.id !== userId) throw new Error('Autentifică-te din nou.');
    assertEntitlement(me, 'account.delete');
    const sb = client();

    // Prefer Edge Function (service role) for hard Auth deletion.
    const { data, error } = await sb.functions.invoke('delete-account', { body: {} });
    const payloadError =
      data && typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error: unknown }).error)
        : null;

    if (!error && !payloadError) {
      await sb.auth.signOut();
      return;
    }

    // Function missing / failed — scrub data with the user's own session, then sign out.
    try {
      await softDeleteOwnAccount(sb, userId);
      await sb.auth.signOut();
    } catch (softError) {
      const softMessage = softError instanceof Error ? softError.message : '';
      throw new Error(
        softMessage ||
          payloadError ||
          error?.message ||
          'Ștergerea contului a eșuat. Asigură-te că funcția delete-account e deploy-ată pe Supabase.',
      );
    }
  },

  async getProfile(userId: string) {
    return fetchProfile(userId);
  },

  async search(filters: SearchFilters = {}) {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;

    // Pull candidates; visibility is enforced by RLS + isPublicFeedListing
    // (active organic, or fake sold/given_away). Avoid a second .or() for text search.
    let query = client().from('listings').select('*').neq('status', 'removed');

    if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
    if (filters.subcategoryId) query = query.eq('subcategory_id', filters.subcategoryId);
    if (filters.cityId) query = query.eq('city_id', filters.cityId);
    if (filters.freeOnly) query = query.eq('is_free', true);
    if (filters.negotiableOnly) query = query.eq('is_negotiable', true);
    if (filters.condition) query = query.eq('condition', filters.condition);
    if (filters.pickupAvailable) query = query.eq('pickup_available', true);
    if (filters.deliveryAvailable) query = query.eq('delivery_available', true);
    if (filters.minPrice != null) query = query.gte('price', filters.minPrice);
    if (filters.maxPrice != null) query = query.lte('price', filters.maxPrice);
    if (filters.newOnly) query = query.in('condition', ['new_unopened', 'new_opened']);
    if (filters.usedOnly) query = query.in('condition', ['partially_used', 'used_reclaimed']);
    if (filters.query) {
      const q = filters.query.replace(/%/g, '').trim();
      if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,brand.ilike.%${q}%`);
    }

    const { data, error } = await query.order('published_at', { ascending: false }).limit(500);
    if (error) throw new Error(error.message);

    let rows = ((data ?? []) as DbListing[]).filter((row) =>
      isPublicFeedListing({
        status: row.status,
        isSeed: row.is_seed ?? false,
      })
    );

    if (filters.countyId) {
      rows = rows.filter((r) => getCity(r.city_id)?.countyId === filters.countyId);
    }

    const center =
      filters.centerLat != null && filters.centerLng != null
        ? { lat: filters.centerLat, lng: filters.centerLng }
        : filters.cityId
          ? (() => {
              const c = getCity(filters.cityId!);
              return c ? { lat: c.lat, lng: c.lng } : null;
            })()
          : null;

    let enriched = await enrichMany(rows, center ?? undefined);

    if (!filters.countryWide && filters.radiusKm != null && center) {
      enriched = enriched.filter(
        (l) => haversineKm(center.lat, center.lng, l.lat, l.lng) <= filters.radiusKm!
      );
    }

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
    const { data, error } = await client().from('listings').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const [item] = await enrichMany([data as DbListing], center);
    return item ?? null;
  },

  async listingsForSeller(sellerId: string) {
    const me = await this.getSession();
    if (me?.id === sellerId) assertEntitlement(me, 'listings.read_own');
    const { data, error } = await client()
      .from('listings')
      .select('*')
      .eq('seller_id', sellerId)
      .neq('status', 'removed')
      .order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return enrichMany((data ?? []) as DbListing[]);
  },

  async createListing(sellerId: string, draft: ListingDraft) {
    const me = await this.getSession();
    if (me?.id !== sellerId) throw new Error('Autentifică-te din nou.');
    assertEntitlement(me, 'listings.create');
    const now = new Date().toISOString();
    const city = getCity(draft.cityId);
    const approx = approximateCoords(draft.lat || city?.lat || 45.9, draft.lng || city?.lng || 24.9);
    const row = {
      seller_id: sellerId,
      title: draft.title,
      description: draft.description,
      category_id: draft.categoryId,
      subcategory_id: draft.subcategoryId,
      brand: draft.brand,
      model: draft.model,
      condition: draft.condition,
      quantity: draft.quantity,
      unit: draft.unit,
      original_package_quantity: draft.originalPackageQuantity,
      price: draft.isFree ? 0 : draft.price,
      currency: draft.currency || 'RON',
      is_negotiable: draft.isFree ? false : draft.isNegotiable,
      is_free: draft.isFree,
      city_id: draft.cityId,
      country_id: draft.countryId || 'ro',
      location: toEwkt(approx.lat, approx.lng),
      pickup_available: draft.pickupAvailable,
      delivery_available: draft.deliveryAvailable,
      storage_notes: draft.storageNotes,
      status: draft.status,
      published_at: draft.status === 'active' ? now : null,
      expires_at: draft.status === 'active' ? daysFromNow(LISTING_EXPIRY_DAYS) : null,
    };

    const { data, error } = await client().from('listings').insert(row).select('*').single();
    if (error) throw new Error(error.message);
    const listing = data as DbListing;

    if (draft.photoUrls.length) {
      const photos = draft.photoUrls.map((url, i) => ({
        listing_id: listing.id,
        url,
        sort_order: i,
      }));
      const { error: photoError } = await client().from('listing_photos').insert(photos);
      if (photoError) throw new Error(photoError.message);
    }

    const [enriched] = await enrichMany([listing]);
    return enriched;
  },

  async updateListing(listingId: string, sellerId: string, patch: Partial<ListingDraft>) {
    const me = await this.getSession();
    if (me?.id !== sellerId) throw new Error('Autentifică-te din nou.');
    const { photoUrls, ...listingPatch } = patch;
    const statusOnly =
      Object.keys(listingPatch).length === 1 && listingPatch.status !== undefined && !photoUrls;
    if (statusOnly) {
      assertEntitlement(
        me,
        listingPatch.status === 'removed' ? 'listings.delete_own' : 'listings.status_own',
      );
    } else {
      assertEntitlement(me, 'listings.edit_own');
    }

    const current = await this.getListing(listingId);
    if (!current || current.sellerId !== sellerId) throw new Error('Anunțul nu a fost găsit.');

    const now = new Date().toISOString();
    const nextStatus = patch.status ?? current.status;
    const isFree = patch.isFree ?? current.isFree;
    const update: Record<string, unknown> = { updated_at: now };

    if (patch.title !== undefined) update.title = patch.title;
    if (patch.description !== undefined) update.description = patch.description;
    if (patch.categoryId !== undefined) update.category_id = patch.categoryId;
    if (patch.subcategoryId !== undefined) update.subcategory_id = patch.subcategoryId;
    if (patch.brand !== undefined) update.brand = patch.brand;
    if (patch.model !== undefined) update.model = patch.model;
    if (patch.condition !== undefined) update.condition = patch.condition;
    if (patch.quantity !== undefined) update.quantity = patch.quantity;
    if (patch.unit !== undefined) update.unit = patch.unit;
    if (patch.originalPackageQuantity !== undefined) {
      update.original_package_quantity = patch.originalPackageQuantity;
    }
    if (patch.price !== undefined || patch.isFree !== undefined) {
      update.price = isFree ? 0 : (patch.price ?? current.price);
    }
    if (patch.currency !== undefined) update.currency = patch.currency;
    if (patch.isNegotiable !== undefined || patch.isFree !== undefined) {
      update.is_negotiable = isFree ? false : (patch.isNegotiable ?? current.isNegotiable);
    }
    if (patch.isFree !== undefined) update.is_free = patch.isFree;
    if (patch.cityId !== undefined) update.city_id = patch.cityId;
    if (patch.countryId !== undefined) update.country_id = patch.countryId;
    if (patch.pickupAvailable !== undefined) update.pickup_available = patch.pickupAvailable;
    if (patch.deliveryAvailable !== undefined) update.delivery_available = patch.deliveryAvailable;
    if (patch.storageNotes !== undefined) update.storage_notes = patch.storageNotes;
    if (patch.status !== undefined) update.status = patch.status;
    if (patch.lat != null && patch.lng != null) {
      const approx = approximateCoords(patch.lat, patch.lng);
      update.location = toEwkt(approx.lat, approx.lng);
    }

    if (nextStatus === 'active' && !current.publishedAt) {
      update.published_at = now;
      update.expires_at = daysFromNow(LISTING_EXPIRY_DAYS);
    }

    const { data, error } = await client()
      .from('listings')
      .update(update)
      .eq('id', listingId)
      .eq('seller_id', sellerId)
      .select('*')
      .single();
    if (error) throw new Error(error.message);

    if (photoUrls) {
      await client().from('listing_photos').delete().eq('listing_id', listingId);
      if (photoUrls.length) {
        const photos = photoUrls.map((url, i) => ({
          listing_id: listingId,
          url,
          sort_order: i,
        }));
        const { error: photoError } = await client().from('listing_photos').insert(photos);
        if (photoError) throw new Error(photoError.message);
      }
    }

    const [enriched] = await enrichMany([data as DbListing]);
    return enriched;
  },

  async setListingStatus(listingId: string, sellerId: string, status: ListingStatus) {
    return this.updateListing(listingId, sellerId, { status } as Partial<ListingDraft>);
  },

  async deleteListing(listingId: string, sellerId: string) {
    return this.updateListing(listingId, sellerId, { status: 'removed' } as Partial<ListingDraft>);
  },

  async getFavorites(userId: string) {
    const me = await this.getSession();
    if (me?.id !== userId) throw new Error('Autentifică-te din nou.');
    assertEntitlement(me, 'favorites.read');
    const { data, error } = await client()
      .from('favorites')
      .select('listing_id')
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    const ids = (data ?? []).map((r: { listing_id: string }) => r.listing_id);
    if (!ids.length) return [];
    const { data: listings, error: listError } = await client()
      .from('listings')
      .select('*')
      .in('id', ids)
      .neq('status', 'removed');
    if (listError) throw new Error(listError.message);
    return enrichMany((listings ?? []) as DbListing[]);
  },

  async isFavorite(userId: string, listingId: string) {
    const { data, error } = await client()
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('listing_id', listingId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return !!data;
  },

  async toggleFavorite(userId: string, listingId: string) {
    const me = await this.getSession();
    if (me?.id !== userId) throw new Error('Autentifică-te din nou.');
    assertEntitlement(me, 'favorites.write');
    const exists = await this.isFavorite(userId, listingId);
    if (exists) {
      const { error } = await client()
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('listing_id', listingId);
      if (error) throw new Error(error.message);
      return false;
    }
    const { error } = await client().from('favorites').insert({
      user_id: userId,
      listing_id: listingId,
    });
    if (error) throw new Error(error.message);
    return true;
  },

  async listConversations(userId: string): Promise<ConversationWithMeta[]> {
    const me = await this.getSession();
    if (me?.id !== userId) throw new Error('Autentifică-te din nou.');
    assertEntitlement(me, 'messages.read');
    const { data, error } = await client()
      .from('conversations')
      .select('*')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    return Promise.all(
      rows.map(async (row) => {
        const conversation = mapConversationRow(row);
        const otherId = otherParticipantId(conversation, userId);
        const [{ data: listing }, { data: profile }, { data: lastMsg }, { data: photos }] =
          await Promise.all([
            client()
              .from('listings')
              .select('title, category_id, subcategory_id')
              .eq('id', conversation.listingId)
              .maybeSingle(),
            client().from('profiles').select('*').eq('id', otherId).maybeSingle(),
            client()
              .from('messages')
              .select('body, sender_id')
              .eq('conversation_id', conversation.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
            client()
              .from('listing_photos')
              .select('url')
              .eq('listing_id', conversation.listingId)
              .order('sort_order', { ascending: true })
              .limit(1),
          ]);
        return withMeta(conversation, {
          userId,
          otherUser: profile ? mapProfile(profile as DbProfile) : null,
          listingTitle: listing?.title,
          listingPhotoUrl: photos?.[0]?.url ?? null,
          listingCategoryId: listing?.category_id ?? null,
          listingSubcategoryId: listing?.subcategory_id ?? null,
          lastMessageBody: lastMsg?.body ?? null,
          lastMessageSenderId: lastMsg?.sender_id ?? null,
        });
      })
    );
  },

  async countUnreadConversations(userId: string): Promise<number> {
    const rows = await this.listConversations(userId);
    return rows.filter((c) => c.unread).length;
  },

  async getConversation(conversationId: string, userId: string) {
    const { data, error } = await client()
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const conversation = mapConversationRow(data);
    if (conversation.buyerId !== userId && conversation.sellerId !== userId) return null;
    const otherId = otherParticipantId(conversation, userId);
    const [{ data: listing }, { data: profile }, { data: lastMsg }, { data: photos }] =
      await Promise.all([
        client()
          .from('listings')
          .select('title, category_id, subcategory_id')
          .eq('id', conversation.listingId)
          .maybeSingle(),
        client().from('profiles').select('*').eq('id', otherId).maybeSingle(),
        client()
          .from('messages')
          .select('body, sender_id')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        client()
          .from('listing_photos')
          .select('url')
          .eq('listing_id', conversation.listingId)
          .order('sort_order', { ascending: true })
          .limit(1),
      ]);
    return withMeta(conversation, {
      userId,
      otherUser: profile ? mapProfile(profile as DbProfile) : null,
      listingTitle: listing?.title,
      listingPhotoUrl: photos?.[0]?.url ?? null,
      listingCategoryId: listing?.category_id ?? null,
      listingSubcategoryId: listing?.subcategory_id ?? null,
      lastMessageBody: lastMsg?.body ?? null,
      lastMessageSenderId: lastMsg?.sender_id ?? null,
    });
  },

  async getMessages(conversationId: string, userId: string) {
    const me = await this.getSession();
    if (me?.id !== userId) throw new Error('Autentifică-te din nou.');
    assertEntitlement(me, 'messages.read');
    const conversation = await this.getConversation(conversationId, userId);
    if (!conversation) throw new Error('Conversația nu a fost găsită.');
    const { data, error } = await client()
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapMessageRow);
  },

  async markConversationRead(conversationId: string, userId: string) {
    const me = await this.getSession();
    if (me?.id !== userId) throw new Error('Autentifică-te din nou.');
    assertEntitlement(me, 'messages.read');
    const conversation = await this.getConversation(conversationId, userId);
    if (!conversation) throw new Error('Conversația nu a fost găsită.');

    const now = new Date().toISOString();
    const patch =
      conversation.buyerId === userId
        ? { buyer_last_read_at: now }
        : { seller_last_read_at: now };

    const { error } = await client()
      .from('conversations')
      .update(patch)
      .eq('id', conversationId);
    if (error) throw new Error(error.message);
  },

  async sendMessage(conversationId: string, senderId: string, body: string) {
    const me = await this.getSession();
    if (me?.id !== senderId) throw new Error('Autentifică-te din nou.');
    assertEntitlement(me, 'messages.send');
    const text = body.trim();
    if (!text) throw new Error('Mesajul nu poate fi gol.');
    const conversation = await this.getConversation(conversationId, senderId);
    if (!conversation) throw new Error('Nu poți trimite mesaje în această conversație.');

    const { data, error } = await client()
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        body: text.slice(0, 2000),
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);

    const now = new Date().toISOString();
    const readPatch =
      conversation.buyerId === senderId
        ? { buyer_last_read_at: now }
        : { seller_last_read_at: now };

    await client()
      .from('conversations')
      .update({ last_message_at: now, ...readPatch })
      .eq('id', conversationId);

    return mapMessageRow(data);
  },

  async startConversation(params: {
    listingId: string;
    buyerId: string;
    sellerId: string;
    initialMessage?: string;
  }) {
    const me = await this.getSession();
    if (me?.id !== params.buyerId) throw new Error('Autentifică-te din nou.');
    assertEntitlement(me, 'messages.start');
    if (params.buyerId === params.sellerId) {
      throw new Error('Nu poți contacta propriul anunț.');
    }

    const { data: listingRow, error: listingError } = await client()
      .from('listings')
      .select('status, is_seed, seller_id')
      .eq('id', params.listingId)
      .maybeSingle();
    if (listingError) throw new Error(listingError.message);
    if (!listingRow) throw new Error('Anunțul nu a fost găsit.');

    let sellerIsSeed = false;
    if (listingRow.seller_id) {
      const { data: sellerRow } = await client()
        .from('profiles')
        .select('is_seed')
        .eq('id', listingRow.seller_id)
        .maybeSingle();
      sellerIsSeed = !!sellerRow?.is_seed;
    }
    if (
      listingRow.status !== 'active' ||
      !!listingRow.is_seed ||
      sellerIsSeed
    ) {
      throw new Error('Contactul nu este disponibil pentru acest anunț.');
    }

    const { data: existing } = await client()
      .from('conversations')
      .select('*')
      .eq('listing_id', params.listingId)
      .eq('buyer_id', params.buyerId)
      .maybeSingle();

    let conversationId = existing?.id ?? null;
    if (!conversationId) {
      const now = new Date().toISOString();
      const { data, error } = await client()
        .from('conversations')
        .insert({
          listing_id: params.listingId,
          buyer_id: params.buyerId,
          seller_id: params.sellerId,
          buyer_last_read_at: now,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      conversationId = data.id as string;
    }

    if (params.initialMessage?.trim()) {
      await this.sendMessage(conversationId, params.buyerId, params.initialMessage);
    }

    const meta = await this.getConversation(conversationId, params.buyerId);
    if (!meta) throw new Error('Conversația nu a putut fi deschisă.');
    return meta;
  },

  async resetDemo() {
    throw new Error('Reset demo nu este disponibil pe Supabase.');
  },

  async signInWithGoogle(): Promise<Profile | null> {
    const sb = client();
    const redirectTo = getOAuthRedirectTo();

    if (Platform.OS === 'web') {
      const { data, error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: false,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) throw new Error(oauthErrorMessage(error.message));
      if (!data.url) {
        throw new Error('Nu s-a putut porni autentificarea Google.');
      }
      // Full-page redirect; session is restored on return via detectSessionInUrl + PKCE.
      return null;
    }

    if (__DEV__) {
      console.log('[auth] Google OAuth redirectTo =', redirectTo);
    }

    const { data, error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw new Error(oauthErrorMessage(error.message));
    if (!data.url) {
      throw new Error('Nu s-a putut porni autentificarea Google.');
    }

    const callbackUrl = await openOAuthSession(data.url, redirectTo);
    await createSessionFromUrl(callbackUrl);
    const profile = await this.getSession();
    if (!profile) {
      throw new Error('Sesiunea Google nu a putut fi creată.');
    }
    if (profile.deactivatedAt) {
      await sb.auth.signOut();
      throw new Error('Contul este dezactivat.');
    }
    return profile;
  },

  meta: {
    country: COUNTRY_RO,
    counties: COUNTIES,
    cities: CITIES,
    categories: CATEGORIES,
    subcategories: SUBCATEGORIES,
  },
};
