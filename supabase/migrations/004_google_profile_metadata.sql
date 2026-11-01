-- Prefer Google (and other OAuth) metadata for display name / avatar on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, city_id, location)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, 'user'), '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    ),
    'bh-oradea',
    ST_SetSRID(ST_MakePoint(21.9189, 47.0465), 4326)::geography
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
