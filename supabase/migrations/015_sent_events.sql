create table sent_events (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references auth.users not null,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  location text,
  description text,
  attendee_emails text[] not null,
  google_event_id text,
  created_at timestamptz default now()
);

alter table sent_events enable row level security;

create policy "users see own events" on sent_events
  for all using (auth.uid() = creator_id);
