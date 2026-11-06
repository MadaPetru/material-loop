-- Track SMS-verified phone numbers on profiles.
alter table profiles
  add column if not exists phone_verified_at timestamptz;

-- Only store verified phones going forward; clear unverified leftovers.
update profiles
set phone = null
where phone is not null and phone_verified_at is null;
