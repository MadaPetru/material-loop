-- Mark cold-start sample sellers/listings so they can be purged later.
-- Actual sample rows are loaded via: node scripts/seed-sample-listings.mjs

alter table public.profiles
  add column if not exists is_seed boolean not null default false;

alter table public.listings
  add column if not exists is_seed boolean not null default false;

create index if not exists profiles_is_seed_idx on public.profiles (is_seed)
  where is_seed = true;

create index if not exists listings_is_seed_idx on public.listings (is_seed)
  where is_seed = true;

comment on column public.profiles.is_seed is
  'True for cold-start sample accounts loaded by scripts/seed-sample-listings.mjs';
comment on column public.listings.is_seed is
  'True for cold-start sample listings; delete with WHERE is_seed when organic supply is enough';
