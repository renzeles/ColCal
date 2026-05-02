-- Colcal initial schema
-- Run this in Supabase SQL Editor (Project → SQL → New query)

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  username    text unique,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now()
);

create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  creator_id   uuid not null references public.profiles on delete cascade,
  title        text not null,
  description  text,
  image_url    text,
  start_at     timestamptz not null,
  end_at       timestamptz,
  location     text,
  is_public    boolean default false,
  created_at   timestamptz default now()
);
create index if not exists events_creator_idx on public.events(creator_id);
create index if not exists events_start_idx on public.events(start_at);

create table if not exists public.groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  avatar_url   text,
  created_by   uuid not null references public.profiles on delete cascade,
  created_at   timestamptz default now()
);

create table if not exists public.group_members (
  group_id  uuid references public.groups on delete cascade,
  user_id   uuid references public.profiles on delete cascade,
  role      text default 'member',
  primary key (group_id, user_id)
);

create table if not exists public.friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.profiles on delete cascade,
  addressee_id  uuid not null references public.profiles on delete cascade,
  status        text default 'pending',
  created_at    timestamptz default now(),
  unique (requester_id, addressee_id)
);

create table if not exists public.event_shares (
  event_id              uuid references public.events on delete cascade,
  shared_with_user_id   uuid references public.profiles on delete cascade,
  shared_with_group_id  uuid references public.groups on delete cascade,
  primary key (event_id, shared_with_user_id, shared_with_group_id)
);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles      enable row level security;
alter table public.events        enable row level security;
alter table public.groups        enable row level security;
alter table public.group_members enable row level security;
alter table public.friendships   enable row level security;
alter table public.event_shares  enable row level security;

-- Profiles: anyone authenticated can read, only self can update
create policy "profiles read for authenticated"
  on public.profiles for select to authenticated using (true);

create policy "profiles update own"
  on public.profiles for update to authenticated
  using (auth.uid() = id);

-- Events: creator can do anything; others can SELECT if shared with them
create policy "events owner all"
  on public.events for all to authenticated
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

create policy "events shared select"
  on public.events for select to authenticated
  using (
    is_public
    or exists (
      select 1 from public.event_shares es
      where es.event_id = events.id
        and (
          es.shared_with_user_id = auth.uid()
          or es.shared_with_group_id in (
            select group_id from public.group_members where user_id = auth.uid()
          )
        )
    )
  );

-- Groups: members can read, creator can update/delete
create policy "groups read members"
  on public.groups for select to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.group_members
      where group_id = groups.id and user_id = auth.uid()
    )
  );

create policy "groups insert by self"
  on public.groups for insert to authenticated
  with check (created_by = auth.uid());

create policy "groups update by creator"
  on public.groups for update to authenticated
  using (created_by = auth.uid());

-- Group members: members read; creator manages
create policy "group_members read"
  on public.group_members for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.groups g
      where g.id = group_members.group_id and g.created_by = auth.uid()
    )
  );

create policy "group_members managed by creator"
  on public.group_members for all to authenticated
  using (
    exists (
      select 1 from public.groups g
      where g.id = group_members.group_id and g.created_by = auth.uid()
    )
  );

-- Friendships: both parties can read
create policy "friendships read involved"
  on public.friendships for select to authenticated
  using (auth.uid() in (requester_id, addressee_id));

create policy "friendships insert by requester"
  on public.friendships for insert to authenticated
  with check (auth.uid() = requester_id);

create policy "friendships update by addressee"
  on public.friendships for update to authenticated
  using (auth.uid() = addressee_id);

-- Event shares: event creator manages, target can read
create policy "event_shares read"
  on public.event_shares for select to authenticated
  using (
    shared_with_user_id = auth.uid()
    or exists (
      select 1 from public.events e
      where e.id = event_shares.event_id and e.creator_id = auth.uid()
    )
  );

create policy "event_shares managed by event creator"
  on public.event_shares for all to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_shares.event_id and e.creator_id = auth.uid()
    )
  );

-- ============================================================
-- STORAGE BUCKET FOR EVENT IMAGES
-- ============================================================
insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do nothing;

create policy "event images public read"
  on storage.objects for select
  using (bucket_id = 'event-images');

create policy "event images authenticated upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'event-images');
