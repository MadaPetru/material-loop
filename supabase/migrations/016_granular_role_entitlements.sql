-- Expand role seeds to action-specific entitlements.
-- App code also expands legacy coarse IDs (listings.manage_own, messages.use, …).

update public.roles
set entitlements = array[
  'app.access',
  'listings.create',
  'listings.edit_own',
  'listings.status_own',
  'listings.delete_own',
  'listings.read_own',
  'favorites.read',
  'favorites.write',
  'messages.read',
  'messages.send',
  'messages.start',
  'profile.edit',
  'profile.phone',
  'account.delete'
]::text[]
where id = 'user';

update public.roles
set entitlements = array[
  'app.access',
  'listings.create',
  'listings.edit_own',
  'listings.status_own',
  'listings.delete_own',
  'listings.read_own',
  'favorites.read',
  'favorites.write',
  'messages.read',
  'messages.send',
  'messages.start',
  'profile.edit',
  'profile.phone',
  'account.delete',
  'admin.panel',
  'admin.users.read',
  'admin.users.roles',
  'admin.users.deactivate',
  'admin.users.email',
  'admin.analytics',
  'admin.roles.read',
  'admin.roles.write',
  'admin.roles.delete',
  'marketing.panel',
  'marketing.ads.read',
  'marketing.ads.write',
  'marketing.ads.delete',
  'marketing.email'
]::text[]
where id = 'admin';

update public.roles
set entitlements = array[
  'app.access',
  'admin.users.read',
  'admin.users.email',
  'marketing.panel',
  'marketing.ads.read',
  'marketing.ads.write',
  'marketing.ads.delete',
  'marketing.email'
]::text[]
where id = 'marketing';

-- Marketing ads RLS: write/delete (legacy marketing.ads still accepted via app expand).
drop policy if exists "Marketers manage marketing ads" on public.marketing_ads;
create policy "Marketers manage marketing ads" on public.marketing_ads
  for all to authenticated
  using (
    public.profile_has_entitlement('marketing.ads.write')
    or public.profile_has_entitlement('marketing.ads.delete')
    or public.profile_has_entitlement('marketing.ads')
  )
  with check (
    public.profile_has_entitlement('marketing.ads.write')
    or public.profile_has_entitlement('marketing.ads')
  );
