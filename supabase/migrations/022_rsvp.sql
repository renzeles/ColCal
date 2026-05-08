create table if not exists event_rsvps (
  event_id uuid references sent_events(id) on delete cascade,
  user_id  uuid references auth.users on delete cascade,
  status   text not null check (status in ('accepted', 'declined')),
  created_at timestamptz default now(),
  primary key (event_id, user_id)
);

alter table event_rsvps enable row level security;

-- Invited user can see their own RSVP; creator can see all RSVPs for their event
create policy "rsvps readable by participant or creator"
  on event_rsvps for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from sent_events e
      where e.id = event_id and e.creator_id = auth.uid()
    )
  );

create policy "rsvps insert as self"
  on event_rsvps for insert to authenticated
  with check (auth.uid() = user_id);

create policy "rsvps update as self"
  on event_rsvps for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
