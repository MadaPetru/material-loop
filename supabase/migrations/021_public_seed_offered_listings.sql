-- Allow public read of fake (is_seed) listings that are already offered,
-- while organic sold/given_away listings stay private to the seller.

drop policy if exists "Active listings are public" on listings;
create policy "Active listings are public" on listings for select using (
  status = 'active'
  or seller_id = auth.uid()
  or (
    is_seed = true
    and status in ('sold', 'given_away')
  )
);
