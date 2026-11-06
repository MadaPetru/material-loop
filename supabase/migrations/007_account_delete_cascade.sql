-- Allow deleting a profile (via auth.users cascade) to remove the seller's listings.
do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'listings'
      and constraint_name = 'listings_seller_id_fkey'
  ) then
    alter table public.listings drop constraint listings_seller_id_fkey;
  end if;
end $$;

alter table public.listings
  add constraint listings_seller_id_fkey
  foreign key (seller_id) references public.profiles(id) on delete cascade;
