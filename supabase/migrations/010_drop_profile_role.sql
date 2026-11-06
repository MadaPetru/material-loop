-- roles[] is the only role source; drop legacy singular role column.

-- Ensure every profile has roles before dropping role.
update public.profiles
set roles = case
  when roles is null or cardinality(roles) = 0 then array[coalesce(role, 'user')]
  when role = 'admin' and not ('admin' = any (roles)) then array_append(roles, 'admin')
  else roles
end;

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
      and 'admin' = any (roles)
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
    new.roles := old.roles;
    new.deactivated_at := old.deactivated_at;
  else
    if new.roles is null or cardinality(new.roles) = 0 then
      new.roles := array['user']::text[];
    end if;
  end if;
  return new;
end;
$$;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles drop column if exists role;
