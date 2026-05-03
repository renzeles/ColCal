-- ============================================================
-- MIGRATION 006: Privacy system + notifications
-- Run in Supabase → SQL Editor
-- ============================================================

-- Notifications
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles on delete cascade,
  type         text not null,  -- 'calendar_request' | 'calendar_approved' | 'calendar_rejected'
  from_user_id uuid references public.profiles on delete set null,
  data         jsonb default '{}',
  read         boolean default false,
  created_at   timestamptz default now()
);
create index if not exists notifications_user_idx
  on public.notifications(user_id, read, created_at desc);

-- Calendar access permissions
create table if not exists public.calendar_permissions (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles on delete cascade,
  viewer_id    uuid not null references public.profiles on delete cascade,
  status       text not null default 'pending',  -- 'pending' | 'approved' | 'rejected'
  created_at   timestamptz default now(),
  unique (owner_id, viewer_id)
);

-- ── RLS ──────────────────────────────────────────────────────

alter table public.notifications        enable row level security;
alter table public.calendar_permissions enable row level security;

create policy "notifications read own"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

create policy "notifications insert any"
  on public.notifications for insert to authenticated
  with check (true);

create policy "notifications update own"
  on public.notifications for update to authenticated
  using (user_id = auth.uid());

create policy "calendar_permissions read involved"
  on public.calendar_permissions for select to authenticated
  using (auth.uid() in (owner_id, viewer_id));

create policy "calendar_permissions insert by viewer"
  on public.calendar_permissions for insert to authenticated
  with check (viewer_id = auth.uid());

create policy "calendar_permissions update owner"
  on public.calendar_permissions for update to authenticated
  using (owner_id = auth.uid());

-- ── HELPERS ──────────────────────────────────────────────────

create or replace function public.are_friends(_a uuid, _b uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and ((requester_id = _a and addressee_id = _b)
           or (requester_id = _b and addressee_id = _a))
  );
$$;

-- ── RPCS ─────────────────────────────────────────────────────

-- Returns friend's events: all if permission approved, only public otherwise
create or replace function public.get_friend_events(_friend_id uuid)
returns table (
  id uuid, creator_id uuid, title text, description text,
  image_url text, start_at timestamptz, end_at timestamptz,
  location text, is_public boolean, created_at timestamptz
)
language plpgsql security definer as $$
declare
  _caller uuid := auth.uid();
  _has_permission boolean;
begin
  if not public.are_friends(_caller, _friend_id) then
    return;
  end if;

  select exists (
    select 1 from public.calendar_permissions
    where owner_id = _friend_id and viewer_id = _caller and status = 'approved'
  ) into _has_permission;

  if _has_permission then
    return query
      select e.id, e.creator_id, e.title, e.description,
             e.image_url, e.start_at, e.end_at, e.location, e.is_public, e.created_at
      from public.events e where e.creator_id = _friend_id order by e.start_at;
  else
    return query
      select e.id, e.creator_id, e.title, e.description,
             e.image_url, e.start_at, e.end_at, e.location, e.is_public, e.created_at
      from public.events e
      where e.creator_id = _friend_id and e.is_public = true order by e.start_at;
  end if;
end;
$$;

-- Returns 'none' | 'pending' | 'approved' | 'rejected'
create or replace function public.get_calendar_permission_status(_owner_id uuid)
returns text language plpgsql security definer as $$
declare _s text;
begin
  select status into _s from public.calendar_permissions
  where owner_id = _owner_id and viewer_id = auth.uid();
  return coalesce(_s, 'none');
end;
$$;

-- Viewer requests full access to owner's calendar
create or replace function public.request_calendar_access(_owner_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  _caller uuid := auth.uid();
  _existing text;
begin
  if _caller = _owner_id then
    return jsonb_build_object('ok', false, 'reason', 'self');
  end if;
  if not public.are_friends(_caller, _owner_id) then
    return jsonb_build_object('ok', false, 'reason', 'not_friends');
  end if;
  select status into _existing from public.calendar_permissions
  where owner_id = _owner_id and viewer_id = _caller;
  if _existing is not null then
    return jsonb_build_object('ok', false, 'reason', _existing);
  end if;

  insert into public.calendar_permissions (owner_id, viewer_id) values (_owner_id, _caller);
  insert into public.notifications (user_id, type, from_user_id)
    values (_owner_id, 'calendar_request', _caller);

  return jsonb_build_object('ok', true);
end;
$$;

-- Owner approves or rejects a viewer's request
create or replace function public.respond_calendar_request(_viewer_id uuid, _approved boolean)
returns jsonb language plpgsql security definer as $$
declare
  _caller uuid := auth.uid();
  _s text;
begin
  select status into _s from public.calendar_permissions
  where owner_id = _caller and viewer_id = _viewer_id;
  if _s is null then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if _s != 'pending' then return jsonb_build_object('ok', false, 'reason', 'already_responded'); end if;

  update public.calendar_permissions
  set status = case when _approved then 'approved' else 'rejected' end
  where owner_id = _caller and viewer_id = _viewer_id;

  insert into public.notifications (user_id, type, from_user_id)
    values (_viewer_id, case when _approved then 'calendar_approved' else 'calendar_rejected' end, _caller);

  return jsonb_build_object('ok', true);
end;
$$;

-- Get recent notifications with sender info
create or replace function public.get_notifications()
returns table (
  id uuid, type text, from_user_id uuid,
  from_user_name text, from_user_avatar text,
  read boolean, created_at timestamptz
)
language plpgsql security definer as $$
begin
  return query
    select n.id, n.type, n.from_user_id,
           p.full_name, p.avatar_url,
           n.read, n.created_at
    from public.notifications n
    left join public.profiles p on p.id = n.from_user_id
    where n.user_id = auth.uid()
    order by n.created_at desc
    limit 40;
end;
$$;

-- Mark all unread notifications as read
create or replace function public.mark_notifications_read()
returns void language sql security definer as $$
  update public.notifications set read = true
  where user_id = auth.uid() and read = false;
$$;
