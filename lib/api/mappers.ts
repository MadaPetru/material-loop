import { getCategory, getSubcategory } from '@/data/categories';
import { getCity, getCounty } from '@/data/romania';
import { haversineKm } from '@/lib/geo';
import { normalizeRoles, primaryRole } from '@/lib/entitlements';
import type {
  Listing,
  ListingPhoto,
  ListingStatus,
  ListingWithRelations,
  MeasurementUnit,
  ProductCondition,
  Profile,
  UserRole,
} from '@/lib/types';

export type DbProfile = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  account_type: Profile['accountType'];
  role: Profile['role'];
  roles?: string[] | null;
  city_id: string | null;
  phone: string | null;
  phone_verified_at: string | null;
  bio: string | null;
  location?: unknown;
  seller_rating: number | null;
  rating_count: number;
  completed_sales: number;
  created_at: string;
  deactivated_at: string | null;
};

export type DbListing = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  category_id: string;
  subcategory_id: string | null;
  brand: string | null;
  model: string | null;
  condition: ProductCondition;
  quantity: number;
  unit: MeasurementUnit;
  original_package_quantity: number | null;
  price: number;
  currency: string;
  is_negotiable: boolean;
  is_free: boolean;
  city_id: string;
  country_id: string;
  location?: unknown;
  pickup_available: boolean;
  delivery_available: boolean;
  storage_notes: string | null;
  status: ListingStatus;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DbPhoto = {
  id: string;
  listing_id: string;
  url: string;
  sort_order: number;
};

export function parseGeoPoint(value: unknown): { lat: number; lng: number } | null {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'coordinates' in value) {
    const coords = (value as { coordinates?: number[] }).coordinates;
    if (Array.isArray(coords) && coords.length >= 2) {
      return { lng: Number(coords[0]), lat: Number(coords[1]) };
    }
  }
  if (typeof value === 'string') {
    try {
      return parseGeoPoint(JSON.parse(value));
    } catch {
      const match = /POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i.exec(value);
      if (match) return { lng: Number(match[1]), lat: Number(match[2]) };
    }
  }
  return null;
}

export function toEwkt(lat: number, lng: number) {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

export function mapProfile(row: DbProfile): Profile {
  const city = row.city_id ? getCity(row.city_id) : undefined;
  const point = parseGeoPoint(row.location);
  const roles = normalizeRoles((row.roles as UserRole[] | null | undefined) ?? null, row.role);
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    accountType: row.account_type,
    role: primaryRole(roles),
    roles,
    cityId: row.city_id,
    phone: row.phone,
    phoneVerifiedAt: row.phone_verified_at ?? null,
    bio: row.bio,
    lat: point?.lat ?? city?.lat ?? null,
    lng: point?.lng ?? city?.lng ?? null,
    sellerRating: row.seller_rating == null ? null : Number(row.seller_rating),
    ratingCount: row.rating_count,
    completedSales: row.completed_sales,
    createdAt: row.created_at,
    deactivatedAt: row.deactivated_at,
  };
}

export function mapPhoto(row: DbPhoto): ListingPhoto {
  return {
    id: row.id,
    listingId: row.listing_id,
    url: row.url,
    sortOrder: row.sort_order,
  };
}

export function mapListing(row: DbListing): Listing {
  const city = getCity(row.city_id);
  const point = parseGeoPoint(row.location);
  return {
    id: row.id,
    sellerId: row.seller_id,
    title: row.title,
    description: row.description,
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id,
    brand: row.brand,
    model: row.model,
    condition: row.condition,
    quantity: Number(row.quantity),
    unit: row.unit,
    originalPackageQuantity:
      row.original_package_quantity == null ? null : Number(row.original_package_quantity),
    price: Number(row.price),
    currency: row.currency,
    isNegotiable: row.is_negotiable,
    isFree: row.is_free,
    cityId: row.city_id,
    countryId: row.country_id,
    lat: point?.lat ?? city?.lat ?? 0,
    lng: point?.lng ?? city?.lng ?? 0,
    pickupAvailable: row.pickup_available,
    deliveryAvailable: row.delivery_available,
    storageNotes: row.storage_notes,
    status: row.status,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function enrichListing(
  listing: Listing,
  photos: ListingPhoto[],
  seller?: Profile | null,
  center?: { lat: number; lng: number }
): ListingWithRelations {
  const city = getCity(listing.cityId);
  const county = city ? getCounty(city.countyId) : undefined;
  const distanceKm =
    center != null ? haversineKm(center.lat, center.lng, listing.lat, listing.lng) : null;
  return {
    ...listing,
    photos: [...photos].sort((a, b) => a.sortOrder - b.sortOrder),
    seller: seller ?? undefined,
    city,
    county,
    category: getCategory(listing.categoryId),
    subcategory: listing.subcategoryId ? getSubcategory(listing.subcategoryId) ?? null : null,
    distanceKm,
  };
}
