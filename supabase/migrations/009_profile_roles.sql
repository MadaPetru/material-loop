-- Multi-role ready: profiles.roles is the entitlement source; role stays as primary label.

alter table public.profiles
  add column if not exists roles text[] not null default array['user']::text[];

update public.profiles
set roles = array[coalesce(role, 'user')]
where roles is null
   or cardinality(roles) = 0
   or roles = array['user']::text[] and role is distinct from 'user' and role is not null;

-- Keep admin primary when present.
update public.profiles
set roles = case
  when role = 'admin' and not ('admin' = any (roles)) then array_append(roles, 'admin')
  when role = 'admin' then roles
  else array[coalesce(role, 'user')]
end;

alter table public.profiles
  drop constraint if exists profiles_roles_valid;

alter table public.profiles
  add constraint profiles_roles_valid
  check (
    cardinality(roles) > 0
    and roles <@ array['user', 'admin']::text[]
  );

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and deactivated_at is null
      and (
        role = 'admin'
        or 'admin' = any (roles)
      )
  );
$$;

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.roles := old.roles;
    new.deactivated_at := old.deactivated_at;
  else
    -- Keep role aligned with roles[] primary.
    if new.roles is null or cardinality(new.roles) = 0 then
      new.roles := array[coalesce(new.role, 'user')];
    end if;
    if 'admin' = any (new.roles) then
      new.role := 'admin';
    else
      new.role := coalesce(new.roles[1], 'user');
    end if;
  end if;
  return new;
end;
$$;
