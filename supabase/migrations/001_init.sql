-- MaterialLoop initial schema (Romania-wide, multi-country ready)
-- Apply in Supabase SQL editor or via supabase db push.

create extension if not exists postgis;
create extension if not exists pg_trgm;

create table if not exists countries (
  id text primary key,
  code text not null unique,
  name text not null,
  default_currency text not null default 'RON',
  default_locale text not null default 'ro'
);

create table if not exists counties (
  id text primary key,
  country_id text not null references countries(id),
  slug text not null,
  name text not null,
  unique (country_id, slug)
);

create table if not exists cities (
  id text primary key,
  county_id text not null references counties(id),
  name text not null,
  location geography(point, 4326) not null
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  avatar_url text,
  account_type text not null default 'individual' check (account_type in ('individual', 'business')),
  role text not null default 'user' check (role in ('user', 'admin')),
  city_id text references cities(id),
  phone text,
  bio text,
  location geography(point, 4326),
  seller_rating numeric(3,2),
  rating_count int not null default 0,
  completed_sales int not null default 0,
  created_at timestamptz not null default now(),
  deactivated_at timestamptz
);

create table if not exists categories (
  id text primary key,
  slug text not null unique,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table if not exists subcategories (
  id text primary key,
  category_id text not null references categories(id),
  slug text not null,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  unique (category_id, slug)
);

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles(id),
  title text not null,
  description text not null,
  category_id text not null references categories(id),
  subcategory_id text references subcategories(id),
  brand text,
  model text,
  condition text not null check (condition in ('new_unopened','new_opened','partially_used','used_reclaimed')),
  quantity numeric(12,3) not null check (quantity > 0),
  unit text not null,
  original_package_quantity numeric(12,3),
  price numeric(12,2) not null default 0,
  currency text not null default 'RON',
  is_negotiable boolean not null default false,
  is_free boolean not null default false,
  city_id text not null references cities(id),
  country_id text not null references countries(id),
  location geography(point, 4326) not null,
  pickup_available boolean not null default true,
  delivery_available boolean not null default false,
  storage_notes text,
  status text not null default 'draft'
    check (status in ('draft','active','reserved','sold','given_away','expired','removed')),
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(brand, '')), 'A')
  ) stored
);

create table if not exists listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  url text not null,
  sort_order int not null default 0
);

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

create index if not exists listings_status_published_idx on listings (status, published_at desc);
create index if not exists listings_category_status_idx on listings (category_id, status);
create index if not exists listings_city_status_idx on listings (city_id, status);
create index if not exists listings_location_idx on listings using gist (location);
create index if not exists listings_search_idx on listings using gin (search_vector);
create index if not exists cities_location_idx on cities using gist (location);

alter table profiles enable row level security;
alter table listings enable row level security;
alter table listing_photos enable row level security;
alter table favorites enable row level security;

drop policy if exists "Public profiles are readable" on profiles;
create policy "Public profiles are readable" on profiles for select using (deactivated_at is null);
drop policy if exists "Users update own profile" on profiles;
create policy "Users update own profile" on profiles for update using (auth.uid() = id);
drop policy if exists "Users insert own profile" on profiles;
create policy "Users insert own profile" on profiles for insert with check (auth.uid() = id);

drop policy if exists "Active listings are public" on listings;
create policy "Active listings are public" on listings for select using (
  status = 'active' or seller_id = auth.uid()
);
drop policy if exists "Sellers insert listings" on listings;
create policy "Sellers insert listings" on listings for insert with check (seller_id = auth.uid());
drop policy if exists "Sellers update own listings" on listings;
create policy "Sellers update own listings" on listings for update using (seller_id = auth.uid());

drop policy if exists "Photos readable with listing" on listing_photos;
create policy "Photos readable with listing" on listing_photos for select using (true);
drop policy if exists "Sellers manage photos" on listing_photos;
create policy "Sellers manage photos" on listing_photos for all using (
  exists (select 1 from listings l where l.id = listing_id and l.seller_id = auth.uid())
);

drop policy if exists "Users read own favorites" on favorites;
create policy "Users read own favorites" on favorites for select using (user_id = auth.uid());
drop policy if exists "Users manage own favorites" on favorites;
create policy "Users manage own favorites" on favorites for all using (user_id = auth.uid());

insert into countries (id, code, name, default_currency, default_locale)
values ('ro', 'RO', 'România', 'RON', 'ro')
on conflict (id) do nothing;
