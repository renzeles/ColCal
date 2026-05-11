-- Source column to distinguish events you created vs joined from Discover
alter table sent_events
  add column if not exists source text not null default 'created';

-- ── Channels (Slack-style event groups) ────────────────────────────────────
create table if not exists channels (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  emoji       text default '🥐',
  created_by  uuid not null references auth.users on delete cascade,
  created_at  timestamptz default now()
);
alter table channels enable row level security;

create table if not exists channel_members (
  channel_id uuid references channels on delete cascade,
  user_id    uuid references auth.users on delete cascade,
  role       text not null default 'member' check (role in ('admin','member')),
  joined_at  timestamptz default now(),
  primary key (channel_id, user_id)
);
alter table channel_members enable row level security;

-- Channel policies
create policy "channels_insert" on channels
  for insert with check (auth.uid() = created_by);

create policy "channels_select" on channels for select using (
  id in (select channel_id from channel_members where user_id = auth.uid())
);

create policy "channels_update" on channels for update using (
  id in (select channel_id from channel_members where user_id = auth.uid() and role = 'admin')
);

create policy "channels_delete" on channels for delete using (
  created_by = auth.uid()
);

-- Member policies
create policy "members_select" on channel_members for select using (
  channel_id in (select channel_id from channel_members cm where cm.user_id = auth.uid())
);

create policy "members_insert" on channel_members for insert with check (
  user_id = auth.uid()
);

create policy "members_delete" on channel_members for delete using (
  user_id = auth.uid()
);
