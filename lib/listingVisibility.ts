import type { Listing, ListingStatus } from '@/lib/types';

const SEED_OFFERED: ListingStatus[] = ['sold', 'given_away'];

/** Listings visible on Home / Search for everyone. */
export function isPublicFeedListing(listing: Pick<Listing, 'status' | 'isSeed'>) {
  if (listing.status === 'active') return true;
  // Fake cold-start inventory stays visible after it was "offered".
  if (listing.isSeed && SEED_OFFERED.includes(listing.status)) return true;
  return false;
}

export function isSeedOfferedListing(listing: Pick<Listing, 'status' | 'isSeed'>) {
  return !!listing.isSeed && SEED_OFFERED.includes(listing.status);
}
