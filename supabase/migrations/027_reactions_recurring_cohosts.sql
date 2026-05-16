-- Quick reactions on events
create table if not exists event_reactions (
  event_id uuid references sent_events(id) on delete cascade,
  user_id  uuid references auth.users on delete cascade,
  emoji    text not null,
  created_at timestamptz default now(),
  primary key (event_id, user_id, emoji)
);
alter table event_reactions enable row level security;

drop policy if exists "reactions_select" on event_reactions;
create policy "reactions_select" on event_reactions for select using (auth.uid() is not null);

drop policy if exists "reactions_insert" on event_reactions;
create policy "reactions_insert" on event_reactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "reactions_delete" on event_reactions;
create policy "reactions_delete" on event_reactions
  for delete using (auth.uid() = user_id);

-- Recurring events (simple): daily/weekly/monthly rule + end_date
alter table sent_events
  add column if not exists recurrence text check (recurrence in ('daily','weekly','monthly') or recurrence is null),
  add column if not exists recurrence_end date,
  add column if not exists co_hosts uuid[] default '{}';

create index if not exists sent_events_co_hosts_idx on sent_events using gin(co_hosts);
