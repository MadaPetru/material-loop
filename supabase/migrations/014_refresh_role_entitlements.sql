-- Ensure seeded roles include marketing + roles.manage entitlements.

update public.roles
set entitlements = array[
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
]::text[]
where id = 'admin';

update public.roles
set entitlements = array[
  'app.access',
  'admin.users.read',
  'marketing.panel',
  'marketing.ads',
  'marketing.email'
]::text[]
where id = 'marketing';
