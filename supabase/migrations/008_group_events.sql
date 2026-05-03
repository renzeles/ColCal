-- ============================================================
-- MIGRATION 008: group_id on events + group RPCs
-- Run in Supabase → SQL Editor
-- ============================================================

-- Add group_id to events
alter table public.events
  add column if not exists group_id uuid references public.groups on delete set null;
create index if not exists events_group_idx on public.events(group_id);

-- Group members can view events in their groups
create policy "events group member select"
  on public.events for select to authenticated
  using (
    group_id is not null
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = events.group_id and gm.user_id = auth.uid()
    )
  );

-- ── RPCs ─────────────────────────────────────────────────────

-- List groups the current user belongs to
create or replace function public.list_my_groups()
returns table (
  id uuid, name text, description text, avatar_url text,
  member_count bigint, my_role text
)
language plpgsql security definer as $$
begin
  return query
    select g.id, g.name, g.description, g.avatar_url,
           (select count(*) from public.group_members where group_id = g.id)::bigint,
           gm.role
    from public.groups g
    join public.group_members gm on gm.group_id = g.id and gm.user_id = auth.uid()
    order by g.name;
end;
$$;

-- Get events for a group (only members can call this)
create or replace function public.get_group_events(_group_id uuid)
returns table (
  id uuid, creator_id uuid, title text, description text,
  image_url text, start_at timestamptz, end_at timestamptz,
  location text, is_public boolean, group_id uuid, created_at timestamptz
)
language plpgsql security definer as $$
begin
  if not exists (
    select 1 from public.group_members
    where group_id = _group_id and user_id = auth.uid()
  ) then return; end if;

  return query
    select e.id, e.creator_id, e.title, e.description,
           e.image_url, e.start_at, e.end_at, e.location, e.is_public, e.group_id, e.created_at
    from public.events e
    where e.group_id = _group_id
    order by e.start_at;
end;
$$;

-- Get members of a group (only members can call this)
create or replace function public.get_group_members(_group_id uuid)
returns table (
  id uuid, full_name text, avatar_url text, role text
)
language plpgsql security definer as $$
begin
  if not exists (
    select 1 from public.group_members
    where group_id = _group_id and user_id = auth.uid()
  ) then return; end if;

  return query
    select p.id, p.full_name, p.avatar_url, gm.role
    from public.group_members gm
    join public.profiles p on p.id = gm.user_id
    where gm.group_id = _group_id
    order by gm.role desc, p.full_name;
end;
$$;

-- Create a group event (validates membership server-side)
create or replace function public.create_group_event(
  _group_id uuid,
  _title text,
  _description text,
  _image_url text,
  _start_at timestamptz,
  _end_at timestamptz,
  _location text,
  _is_public boolean default false
)
returns setof public.events
language plpgsql security definer as $$
declare _caller uuid := auth.uid();
begin
  if not exists (
    select 1 from public.group_members where group_id = _group_id and user_id = _caller
  ) then
    raise exception 'Not a member of this group';
  end if;

  return query
    insert into public.events (creator_id, group_id, title, description, image_url, start_at, end_at, location, is_public)
    values (_caller, _group_id, _title, _description, _image_url, _start_at, _end_at, _location, _is_public)
    returning *;
end;
$$;
