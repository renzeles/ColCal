-- Contact requests (replaces direct follow in Contacts UI)
create table if not exists contact_requests (
  id         uuid primary key default gen_random_uuid(),
  from_id    uuid not null references auth.users on delete cascade,
  to_id      uuid not null references auth.users on delete cascade,
  status     text not null default 'pending'
               check (status in ('pending','accepted','rejected')),
  created_at timestamptz default now(),
  unique (from_id, to_id)
);
alter table contact_requests enable row level security;

create policy "cr_select" on contact_requests
  for select using (auth.uid() = from_id or auth.uid() = to_id);
create policy "cr_insert" on contact_requests
  for insert with check (auth.uid() = from_id);
create policy "cr_update" on contact_requests
  for update using (auth.uid() = to_id or auth.uid() = from_id);
create policy "cr_delete" on contact_requests
  for delete using (auth.uid() = from_id);

-- In-app notifications
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  type       text not null, -- 'contact_request' | 'contact_accepted' | 'event_invite'
  data       jsonb not null default '{}',
  read       boolean not null default false,
  created_at timestamptz default now()
);
alter table notifications enable row level security;

create policy "notif_select" on notifications
  for select using (auth.uid() = user_id);
create policy "notif_update" on notifications
  for update using (auth.uid() = user_id);
create policy "notif_insert" on notifications
  for insert with check (auth.uid() is not null);
