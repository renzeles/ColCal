-- Phase 1: Profile fields
alter table profiles
  add column if not exists username text unique,
  add column if not exists description text;

create index if not exists profiles_username_lower_idx on profiles(lower(username));

-- Auto-generate username on signup if missing (slug from email)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  base_username text;
  candidate text;
  suffix int := 0;
begin
  base_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]', '', 'g'));
  if base_username = '' or base_username is null then
    base_username := 'user';
  end if;
  candidate := base_username;
  while exists (select 1 from public.profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, email, full_name, avatar_url, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    candidate
  );
  return new;
end;
$$;

-- Backfill usernames for existing profiles missing one
do $$
declare
  p record;
  base_username text;
  candidate text;
  suffix int;
begin
  for p in select id, email from public.profiles where username is null loop
    base_username := lower(regexp_replace(split_part(coalesce(p.email, ''), '@', 1), '[^a-z0-9]', '', 'g'));
    if base_username = '' then base_username := 'user'; end if;
    candidate := base_username;
    suffix := 0;
    while exists (select 1 from public.profiles where username = candidate) loop
      suffix := suffix + 1;
      candidate := base_username || suffix::text;
    end loop;
    update public.profiles set username = candidate where id = p.id;
  end loop;
end $$;

-- Phase 2: Event visibility
alter table sent_events
  add column if not exists visibility text not null default 'private'
  check (visibility in ('public', 'private'));

-- Allow empty attendee_emails for public events
alter table sent_events
  alter column attendee_emails set default '{}';

-- Replace SELECT policy: creators see their own + everyone sees public
drop policy if exists "users see own events" on sent_events;

create policy "creator all access" on sent_events
  for all to authenticated
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

create policy "public events readable" on sent_events
  for select to authenticated
  using (visibility = 'public');

-- Phase 3: Follows (one-way, Twitter-style)
create table if not exists follows (
  follower_id uuid references auth.users on delete cascade,
  following_id uuid references auth.users on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

alter table follows enable row level security;

create policy "follows readable by authenticated"
  on follows for select to authenticated using (true);

create policy "follows insert as self"
  on follows for insert to authenticated
  with check (auth.uid() = follower_id);

create policy "follows delete as self"
  on follows for delete to authenticated
  using (auth.uid() = follower_id);

create index if not exists follows_follower_idx on follows(follower_id);
create index if not exists follows_following_idx on follows(following_id);
