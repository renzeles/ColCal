-- ============================================================
-- MIGRATION 007: Group invites + avatars storage bucket
-- Run in Supabase → SQL Editor
-- ============================================================

-- Group invite links (per-group, per-role)
create table if not exists public.group_invites (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.groups on delete cascade,
  invited_by   uuid not null references public.profiles on delete cascade,
  role         text not null default 'guests',  -- 'guests' | 'admin'
  created_at   timestamptz default now(),
  expires_at   timestamptz default now() + interval '14 days',
  used_by      uuid references public.profiles on delete set null,
  used_at      timestamptz
);
create index if not exists group_invites_group_idx on public.group_invites(group_id);

alter table public.group_invites enable row level security;

-- Group creator or admin can read and create invites
create policy "group_invites read by group admin"
  on public.group_invites for select to authenticated
  using (
    invited_by = auth.uid()
    or exists (
      select 1 from public.group_members gm
      where gm.group_id = group_invites.group_id
        and gm.user_id = auth.uid()
        and gm.role = 'admin'
    )
  );

create policy "group_invites insert by group admin"
  on public.group_invites for insert to authenticated
  with check (
    invited_by = auth.uid()
    and (
      auth.uid() = (select created_by from public.groups where id = group_id)
      or exists (
        select 1 from public.group_members gm
        where gm.group_id = group_invites.group_id
          and gm.user_id = auth.uid()
          and gm.role = 'admin'
      )
    )
  );

-- ── RPCS ─────────────────────────────────────────────────────

-- Get group invite info (valid for anonymous users too, so SECURITY DEFINER)
create or replace function public.get_group_invite_info(_token uuid)
returns table (
  group_id uuid,
  group_name text,
  group_description text,
  inviter_name text,
  inviter_avatar text,
  role text,
  valid boolean,
  reason text
)
language plpgsql security definer as $$
declare
  _invite public.group_invites;
  _group  public.groups;
  _inviter public.profiles;
begin
  select * into _invite from public.group_invites where id = _token;
  if not found then
    return query select null::uuid, null::text, null::text, null::text, null::text,
                        null::text, false, 'not_found'::text;
    return;
  end if;
  if _invite.expires_at < now() then
    return query select null::uuid, null::text, null::text, null::text, null::text,
                        null::text, false, 'expired'::text;
    return;
  end if;
  if _invite.used_by is not null then
    return query select null::uuid, null::text, null::text, null::text, null::text,
                        null::text, false, 'used'::text;
    return;
  end if;
  -- Check if caller is already a member (only if logged in)
  if auth.uid() is not null and exists (
    select 1 from public.group_members
    where group_id = _invite.group_id and user_id = auth.uid()
  ) then
    return query select null::uuid, null::text, null::text, null::text, null::text,
                        null::text, false, 'self'::text;
    return;
  end if;

  select * into _group from public.groups where id = _invite.group_id;
  select * into _inviter from public.profiles where id = _invite.invited_by;

  return query select
    _group.id, _group.name, _group.description,
    _inviter.full_name, _inviter.avatar_url,
    _invite.role, true, null::text;
end;
$$;

-- Accept group invite (SECURITY DEFINER to bypass group_members RLS)
create or replace function public.accept_group_invite(_token uuid)
returns table (ok boolean, reason text)
language plpgsql security definer as $$
declare
  _caller uuid := auth.uid();
  _invite public.group_invites;
begin
  select * into _invite from public.group_invites where id = _token for update;
  if not found then return query select false, 'not_found'::text; return; end if;
  if _invite.expires_at < now() then return query select false, 'expired'::text; return; end if;
  if _invite.used_by is not null then return query select false, 'used'::text; return; end if;
  if exists (
    select 1 from public.group_members where group_id = _invite.group_id and user_id = _caller
  ) then return query select false, 'self'::text; return; end if;

  insert into public.group_members (group_id, user_id, role)
  values (_invite.group_id, _caller, _invite.role);

  update public.group_invites set used_by = _caller, used_at = now() where id = _token;

  return query select true, null::text;
end;
$$;

-- ── STORAGE: avatars bucket ───────────────────────────────────

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars authenticated upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars');

create policy "avatars owner delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and owner = auth.uid());
