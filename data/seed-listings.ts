import type {
  Listing,
  ListingPhoto,
  MeasurementUnit,
  ProductCondition,
  Profile,
  UserRole,
} from '@/lib/types';
import { daysFromNow } from '@/lib/geo';
import catalog from '@/data/seed-sample.catalog.json';

const now = new Date().toISOString();

const PLACEHOLDER = (label: string, hue: string) =>
  `https://placehold.co/800x600/${hue}/F3EEE6/png?text=${encodeURIComponent(label)}`;

type CatalogProfile = (typeof catalog.profiles)[number];
type CatalogListing = (typeof catalog.listings)[number];

function mapProfile(row: CatalogProfile): Profile {
  return {
    id: row.demoId,
    email: row.email,
    displayName: row.displayName,
    avatarUrl: null,
    accountType: row.accountType as Profile['accountType'],
    roles: row.roles as UserRole[],
    cityId: row.cityId,
    phone: null,
    phoneVerifiedAt: null,
    bio: row.bio,
    lat: row.lat,
    lng: row.lng,
    sellerRating: row.sellerRating,
    ratingCount: row.ratingCount,
    completedSales: row.completedSales,
    createdAt: row.createdAt ?? now,
    deactivatedAt: null,
    isSeed: row.cloud,
  };
}

function mapListing(row: CatalogListing): Listing {
  return {
    id: row.demoId,
    sellerId: row.sellerDemoId,
    title: row.title,
    description: row.description,
    categoryId: row.categoryId,
    subcategoryId: row.subcategoryId,
    brand: row.brand,
    model: row.model,
    condition: row.condition as ProductCondition,
    quantity: row.quantity,
    unit: row.unit as MeasurementUnit,
    originalPackageQuantity: row.originalPackageQuantity,
    price: row.price,
    currency: 'RON',
    isNegotiable: row.isNegotiable,
    isFree: row.isFree,
    cityId: row.cityId,
    countryId: 'ro',
    lat: row.lat,
    lng: row.lng,
    pickupAvailable: row.pickupAvailable,
    deliveryAvailable: row.deliveryAvailable,
    storageNotes: row.storageNotes,
    status: 'active',
    publishedAt: row.publishedAt,
    expiresAt: daysFromNow(row.expiresInDays),
    createdAt: row.publishedAt,
    updatedAt: row.publishedAt,
    isSeed: true,
  };
}

export const SEED_PROFILES: Profile[] = catalog.profiles.map(mapProfile);

export const SEED_LISTINGS: Listing[] = catalog.listings.map(mapListing);

export const SEED_PHOTOS: ListingPhoto[] = catalog.listings.map((row, index) => ({
  id: `ph${index + 1}`,
  listingId: row.demoId,
  url: PLACEHOLDER(row.photoLabel, row.photoHue),
  sortOrder: 0,
}));

/** Demo-only passwords keyed by email (local AsyncStorage auth). */
export const SEED_DEMO_PASSWORDS: Record<string, string> = Object.fromEntries(
  catalog.profiles.map((row) => [row.email, row.password]),
);
