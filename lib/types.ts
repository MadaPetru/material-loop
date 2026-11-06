export type AccountType = 'individual' | 'business';
export type UserRole = 'user' | 'admin';

export type ListingStatus =
  | 'draft'
  | 'active'
  | 'reserved'
  | 'sold'
  | 'given_away'
  | 'expired'
  | 'removed';

export type ProductCondition =
  | 'new_unopened'
  | 'new_opened'
  | 'partially_used'
  | 'used_reclaimed';

export type MeasurementUnit =
  | 'bag'
  | 'piece'
  | 'm'
  | 'm2'
  | 'm3'
  | 'kg'
  | 'l'
  | 'bucket'
  | 'board'
  | 'other';

export type SortOption =
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'nearest'
  | 'relevant';

export interface Country {
  id: string;
  code: string;
  name: string;
  defaultCurrency: string;
  defaultLocale: string;
}

export interface County {
  id: string;
  countryId: string;
  slug: string;
  name: string;
}

export interface City {
  id: string;
  countyId: string;
  name: string;
  lat: number;
  lng: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  accountType: AccountType;
  /** Assigned roles — entitlements are the union of these. */
  roles: UserRole[];
  cityId: string | null;
  phone: string | null;
  /** Set only after SMS OTP verification succeeds. */
  phoneVerifiedAt: string | null;
  bio: string | null;
  lat: number | null;
  lng: number | null;
  sellerRating: number | null;
  ratingCount: number;
  completedSales: number;
  createdAt: string;
  deactivatedAt: string | null;
}

export interface AdminAnalytics {
  usersTotal: number;
  usersActive: number;
  usersDeactivated: number;
  admins: number;
  listingsActive: number;
  listingsTotal: number;
  conversations: number;
}

export interface ListingPhoto {
  id: string;
  listingId: string;
  url: string;
  sortOrder: number;
}

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  categoryId: string;
  subcategoryId: string | null;
  brand: string | null;
  model: string | null;
  condition: ProductCondition;
  quantity: number;
  unit: MeasurementUnit;
  originalPackageQuantity: number | null;
  price: number;
  currency: string;
  isNegotiable: boolean;
  isFree: boolean;
  cityId: string;
  countryId: string;
  lat: number;
  lng: number;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  storageNotes: string | null;
  status: ListingStatus;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListingWithRelations extends Listing {
  photos: ListingPhoto[];
  seller?: Profile;
  city?: City;
  county?: County;
  category?: Category;
  subcategory?: Subcategory | null;
  distanceKm?: number | null;
}

export interface Favorite {
  id: string;
  userId: string;
  listingId: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface ConversationWithMeta extends Conversation {
  listingTitle?: string;
  listingPhotoUrl?: string | null;
  otherUser?: Profile | null;
  lastMessageBody?: string | null;
}

export interface SearchFilters {
  query?: string;
  categoryId?: string;
  subcategoryId?: string;
  countyId?: string;
  cityId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: ProductCondition;
  freeOnly?: boolean;
  negotiableOnly?: boolean;
  newOnly?: boolean;
  usedOnly?: boolean;
  pickupAvailable?: boolean;
  deliveryAvailable?: boolean;
  radiusKm?: number | null;
  centerLat?: number | null;
  centerLng?: number | null;
  countryWide?: boolean;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

export interface AuthSession {
  user: Profile;
  accessToken: string;
}

export type ListingDraft = {
  title: string;
  description: string;
  categoryId: string;
  subcategoryId: string | null;
  brand: string | null;
  model: string | null;
  condition: ProductCondition;
  quantity: number;
  unit: MeasurementUnit;
  originalPackageQuantity: number | null;
  price: number;
  currency: string;
  isNegotiable: boolean;
  isFree: boolean;
  cityId: string;
  countryId: string;
  lat: number;
  lng: number;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  storageNotes: string | null;
  status: ListingStatus;
  photoUrls: string[];
};
