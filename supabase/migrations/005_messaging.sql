-- Buyer ↔ seller conversations tied to a listing

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  buyer_id uuid not null references profiles(id) on delete cascade,
  seller_id uuid not null references profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id),
  check (buyer_id <> seller_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists conversations_buyer_idx on conversations (buyer_id, last_message_at desc);
create index if not exists conversations_seller_idx on conversations (seller_id, last_message_at desc);
create index if not exists messages_conversation_idx on messages (conversation_id, created_at asc);

alter table conversations enable row level security;
alter table messages enable row level security;

drop policy if exists "Participants read conversations" on conversations;
create policy "Participants read conversations" on conversations for select using (
  auth.uid() = buyer_id or auth.uid() = seller_id
);

drop policy if exists "Buyers create conversations" on conversations;
create policy "Buyers create conversations" on conversations for insert with check (
  auth.uid() = buyer_id and buyer_id <> seller_id
);

drop policy if exists "Participants update conversations" on conversations;
create policy "Participants update conversations" on conversations for update using (
  auth.uid() = buyer_id or auth.uid() = seller_id
);

drop policy if exists "Participants read messages" on messages;
create policy "Participants read messages" on messages for select using (
  exists (
    select 1 from conversations c
    where c.id = conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);

drop policy if exists "Participants send messages" on messages;
create policy "Participants send messages" on messages for insert with check (
  auth.uid() = sender_id
  and exists (
    select 1 from conversations c
    where c.id = conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);
