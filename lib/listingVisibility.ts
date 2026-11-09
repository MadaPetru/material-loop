import type { Listing, ListingStatus } from '@/lib/types';

const SEED_OFFERED: ListingStatus[] = ['sold', 'given_away'];

/** Listings visible on Home / Search for everyone. */
export function isPublicFeedListing(listing: Pick<Listing, 'status' | 'isSeed'>) {
  if (listing.status === 'active') return true;
  // Cold-start inventory stays visible after it was offered / closed.
  if (listing.isSeed && SEED_OFFERED.includes(listing.status)) return true;
  return false;
}

export function isSeedOfferedListing(listing: Pick<Listing, 'status' | 'isSeed'>) {
  return !!listing.isSeed && SEED_OFFERED.includes(listing.status);
}

/** Contact only for real, still-active listings — never for seed or closed ones. */
export function canContactListing(
  listing: Pick<Listing, 'status' | 'isSeed'> & {
    seller?: Pick<{ isSeed?: boolean }, 'isSeed'> | null;
  }
) {
  if (listing.status !== 'active') return false;
  if (listing.isSeed || listing.seller?.isSeed) return false;
  return true;
}
