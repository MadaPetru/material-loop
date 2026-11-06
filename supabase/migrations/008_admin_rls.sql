-- Admin helpers + RLS for administration panel.

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
      and role = 'admin'
      and deactivated_at is null
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Admins read all profiles" on profiles;
create policy "Admins read all profiles" on profiles
  for select using (public.is_admin());

drop policy if exists "Admins update profiles" on profiles;
create policy "Admins update profiles" on profiles
  for update using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins read all listings" on listings;
create policy "Admins read all listings" on listings
  for select using (public.is_admin());

drop policy if exists "Admins read conversations" on conversations;
create policy "Admins read conversations" on conversations
  for select using (public.is_admin());

-- Non-admins cannot escalate role or toggle deactivation on themselves.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.deactivated_at := old.deactivated_at;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_privileges on profiles;
create trigger profiles_guard_privileges
  before update on profiles
  for each row
  execute function public.guard_profile_privileges();
