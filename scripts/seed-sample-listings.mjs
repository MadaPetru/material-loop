/**
 * Load cold-start leftover listings into Supabase (purgeable via is_seed).
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-sample-listings.mjs
 *
 * Requires migration 017_seed_sample_flags.sql.
 * Catalogs: data/seed-sample.catalog.ts (+ optional .json) and data/seed-county.catalog.json
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ws from 'ws';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Node 20 seed scripts need an explicit WebSocket implementation.
if (!globalThis.WebSocket) globalThis.WebSocket = ws;

// Prefer compiled-friendly JSON sidecar if present; else extract object from .ts source.
function loadSampleCatalog() {
  const jsonPath = join(__dirname, '../data/seed-sample.catalog.json');
  try {
    return JSON.parse(readFileSync(jsonPath, 'utf8'));
  } catch {
    /* fall through */
  }
  const ts = readFileSync(join(__dirname, '../data/seed-sample.catalog.ts'), 'utf8');
  const marker = 'export const SEED_SAMPLE_CATALOG';
  const start = ts.indexOf(marker);
  if (start < 0) throw new Error('SEED_SAMPLE_CATALOG not found');
  const eq = ts.indexOf('=', start);
  const brace = ts.indexOf('{', eq);
  let depth = 0;
  let end = brace;
  for (; end < ts.length; end += 1) {
    if (ts[end] === '{') depth += 1;
    else if (ts[end] === '}') {
      depth -= 1;
      if (depth === 0) {
        end += 1;
        break;
      }
    }
  }
  // Strip TypeScript `as const` / trailing type noise — object is JSON-compatible.
  const literal = ts.slice(brace, end);
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${literal});`)();
}

function loadCountyCatalog() {
  const jsonPath = join(__dirname, '../data/seed-county.catalog.json');
  try {
    return JSON.parse(readFileSync(jsonPath, 'utf8'));
  } catch {
    return { profiles: [], listings: [] };
  }
}

const sample = loadSampleCatalog();
const county = loadCountyCatalog();
const catalog = {
  profiles: [...(sample.profiles ?? []), ...(county.profiles ?? [])],
  listings: [...(sample.listings ?? []), ...(county.listings ?? [])],
};

const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'Missing SUPABASE_URL (or EXPO_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.',
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function toEwkt(lat, lng) {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

function placeholder(label, hue) {
  return `https://placehold.co/800x600/${hue}/F3EEE6/png?text=${encodeURIComponent(label)}`;
}

function daysFromNow(days) {
  return new Date(Date.now() + days * 86400000).toISOString();
}

async function ensureAuthUser(profile) {
  const { data: existingData, error: getError } = await supabase.auth.admin.getUserById(
    profile.uuid,
  );
  if (getError && getError.message && !/not found|User not found/i.test(getError.message)) {
    throw getError;
  }

  if (existingData?.user) {
    const { error } = await supabase.auth.admin.updateUserById(profile.uuid, {
      email: profile.email,
      password: profile.password,
      email_confirm: true,
      user_metadata: { display_name: profile.displayName },
    });
    if (error) throw error;
    return;
  }

  const { error } = await supabase.auth.admin.createUser({
    id: profile.uuid,
    email: profile.email,
    password: profile.password,
    email_confirm: true,
    user_metadata: { display_name: profile.displayName },
  });
  if (error) throw error;
}

async function upsertProfile(profile) {
  const row = {
    id: profile.uuid,
    email: profile.email,
    display_name: profile.displayName,
    avatar_url: null,
    account_type: profile.accountType,
    roles: profile.roles,
    city_id: profile.cityId,
    phone: null,
    phone_verified_at: null,
    bio: profile.bio,
    location: toEwkt(profile.lat, profile.lng),
    seller_rating: profile.sellerRating,
    rating_count: profile.ratingCount,
    completed_sales: profile.completedSales,
    deactivated_at: null,
    is_seed: true,
  };
  const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

function seedOfferedStatus(listing) {
  if (listing.status === 'sold' || listing.status === 'given_away') return listing.status;
  // Fake/seed inventory is already offered — never active in the public feed.
  return listing.isFree ? 'given_away' : 'sold';
}

async function upsertListing(listing, sellerUuid) {
  const row = {
    id: listing.uuid,
    seller_id: sellerUuid,
    title: listing.title,
    description: listing.description,
    category_id: listing.categoryId,
    subcategory_id: listing.subcategoryId,
    brand: listing.brand,
    model: listing.model,
    condition: listing.condition,
    quantity: listing.quantity,
    unit: listing.unit,
    original_package_quantity: listing.originalPackageQuantity,
    price: listing.isFree ? 0 : listing.price,
    currency: 'RON',
    is_negotiable: listing.isFree ? false : listing.isNegotiable,
    is_free: listing.isFree,
    city_id: listing.cityId,
    country_id: 'ro',
    location: toEwkt(listing.lat, listing.lng),
    pickup_available: listing.pickupAvailable,
    delivery_available: listing.deliveryAvailable,
    storage_notes: listing.storageNotes,
    status: seedOfferedStatus(listing),
    published_at: listing.publishedAt,
    expires_at: daysFromNow(listing.expiresInDays),
    is_seed: true,
  };
  const { error } = await supabase.from('listings').upsert(row, { onConflict: 'id' });
  if (error) throw error;

  const photo = {
    id: listing.photoUuid,
    listing_id: listing.uuid,
    url: placeholder(listing.photoLabel, listing.photoHue),
    sort_order: 0,
  };
  const { error: photoError } = await supabase
    .from('listing_photos')
    .upsert(photo, { onConflict: 'id' });
  if (photoError) throw photoError;
}

async function main() {
  const cloudProfiles = catalog.profiles.filter((p) => p.cloud);
  const byDemoId = new Map(cloudProfiles.map((p) => [p.demoId, p]));

  console.log(`Seeding ${cloudProfiles.length} sample sellers…`);
  for (const profile of cloudProfiles) {
    await ensureAuthUser(profile);
    await upsertProfile(profile);
    console.log(`  ✓ ${profile.displayName} <${profile.email}>`);
  }

  console.log(`Seeding ${catalog.listings.length} sample listings…`);
  for (const listing of catalog.listings) {
    const seller = byDemoId.get(listing.sellerDemoId);
    if (!seller) {
      throw new Error(`Missing cloud seller for ${listing.demoId} (${listing.sellerDemoId})`);
    }
    await upsertListing(listing, seller.uuid);
    console.log(`  ✓ ${listing.title}`);
  }

  console.log('Done. Purge later with: delete from listings where is_seed;');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
