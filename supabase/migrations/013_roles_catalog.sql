-- DB-backed roles linked to a fixed entitlement catalog (enforced in app code).

create table if not exists public.roles (
  id text primary key,
  label text not null,
  description text not null default '',
  entitlements text[] not null default array[]::text[],
  system boolean not null default false,
  created_at timestamptz not null default now(),
  constraint roles_id_format check (id ~ '^[a-z][a-z0-9_-]*$')
);

insert into public.roles (id, label, description, entitlements, system)
values
  (
    'user',
    'User',
    'Default marketplace member',
    array[
      'app.access',
      'listings.create',
      'listings.manage_own',
      'messages.use',
      'favorites.use',
      'profile.edit'
    ]::text[],
    true
  ),
  (
    'admin',
    'Admin',
    'Full administration',
    array[
      'app.access',
      'listings.create',
      'listings.manage_own',
      'messages.use',
      'favorites.use',
      'profile.edit',
      'admin.panel',
      'admin.users.read',
      'admin.users.manage',
      'admin.users.email',
      'admin.analytics',
      'admin.roles.manage',
      'marketing.panel',
      'marketing.ads',
      'marketing.email'
    ]::text[],
    true
  ),
  (
    'marketing',
    'Marketing',
    'Ads and outreach',
    array[
      'app.access',
      'admin.users.read',
      'marketing.panel',
      'marketing.ads',
      'marketing.email'
    ]::text[],
    false
  )
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description,
  entitlements = excluded.entitlements,
  system = excluded.system;

-- Allow any role slug that exists in roles (drop hard-coded user|admin check).
alter table public.profiles drop constraint if exists profiles_roles_valid;

create or replace function public.profiles_roles_are_valid(role_ids text[])
returns boolean
language sql
stable
as $$
  select
    role_ids is not null
    and cardinality(role_ids) > 0
    and not exists (
      select 1
      from unnest(role_ids) as r(id)
      where not exists (select 1 from public.roles where roles.id = r.id)
    );
$$;

alter table public.profiles
  add constraint profiles_roles_valid
  check (public.profiles_roles_are_valid(roles));

alter table public.roles enable row level security;

drop policy if exists "Roles readable by authenticated" on public.roles;
create policy "Roles readable by authenticated" on public.roles
  for select to authenticated
  using (true);

drop policy if exists "Admins manage roles" on public.roles;
create policy "Admins manage roles" on public.roles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Prevent deleting system roles.
create or replace function public.guard_roles_system()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.system then
      raise exception 'System role "%" cannot be deleted', old.id;
    end if;
    return old;
  end if;
  if tg_op = 'UPDATE' and old.system and new.id is distinct from old.id then
    raise exception 'System role id cannot be renamed';
  end if;
  if tg_op = 'UPDATE' then
    new.system := old.system;
  end if;
  return new;
end;
$$;

drop trigger if exists roles_guard_system on public.roles;
create trigger roles_guard_system
  before update or delete on public.roles
  for each row
  execute function public.guard_roles_system();

-- Lightweight marketing ads stub.
create table if not exists public.marketing_ads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.marketing_ads enable row level security;

drop policy if exists "Marketing ads readable by authenticated" on public.marketing_ads;
create policy "Marketing ads readable by authenticated" on public.marketing_ads
  for select to authenticated
  using (true);

drop policy if exists "Admins manage marketing ads" on public.marketing_ads;
create policy "Admins manage marketing ads" on public.marketing_ads
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Entitlement check from DB role catalog (mirrors app hasEntitlement).
create or replace function public.profile_has_entitlement(ent text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = any (p.roles)
    where p.id = auth.uid()
      and p.deactivated_at is null
      and ent = any (r.entitlements)
  );
$$;

revoke all on function public.profile_has_entitlement(text) from public;
grant execute on function public.profile_has_entitlement(text) to authenticated;

drop policy if exists "Admins manage marketing ads" on public.marketing_ads;
drop policy if exists "Marketers manage marketing ads" on public.marketing_ads;
create policy "Marketers manage marketing ads" on public.marketing_ads
  for all to authenticated
  using (public.profile_has_entitlement('marketing.ads'))
  with check (public.profile_has_entitlement('marketing.ads'));
