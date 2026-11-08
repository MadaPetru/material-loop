-- Per-participant last-read timestamps for unread badges

alter table conversations
  add column if not exists buyer_last_read_at timestamptz,
  add column if not exists seller_last_read_at timestamptz;
