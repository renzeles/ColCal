-- Friend invitations via shareable link.

create table if not exists public.friend_invites (
  id          uuid primary key default gen_random_uuid(),
  inviter_id  uuid not null references public.profiles on delete cascade,
  created_at  timestamptz default now(),
  expires_at  timestamptz default (now() + interval '14 days'),
  used_by     uuid references public.profiles,
  used_at     timestamptz
);

create index if not exists friend_invites_inviter_idx on public.friend_invites(inviter_id);

alter table public.friend_invites enable row level security;

drop policy if exists "friend_invites read own" on public.friend_invites;
create policy "friend_invites read own"
  on public.friend_invites for select to authenticated
  using (inviter_id = auth.uid());

drop policy if exists "friend_invites insert own" on public.friend_invites;
create policy "friend_invites insert own"
  on public.friend_invites for insert to authenticated
  with check (inviter_id = auth.uid());

drop policy if exists "friend_invites delete own" on public.friend_invites;
create policy "friend_invites delete own"
  on public.friend_invites for delete to authenticated
  using (inviter_id = auth.uid());

-- ============================================================
-- RPC: get_invite_info — anyone authenticated can preview an invite
-- ============================================================
create or replace function public.get_invite_info(_token uuid)
returns table (
  inviter_id   uuid,
  inviter_name text,
  inviter_avatar text,
  valid        boolean,
  reason       text
)
language plpgsql
security definer
stable
as $$
declare
  inv public.friend_invites%rowtype;
  prof public.profiles%rowtype;
begin
  select * into inv from public.friend_invites where id = _token;
  if not found then
    return query select null::uuid, null::text, null::text, false, 'not_found';
    return;
  end if;
  if inv.used_at is not null then
    return query select inv.inviter_id, null::text, null::text, false, 'used';
    return;
  end if;
  if inv.expires_at < now() then
    return query select inv.inviter_id, null::text, null::text, false, 'expired';
    return;
  end if;
  select * into prof from public.profiles where id = inv.inviter_id;
  return query select inv.inviter_id, prof.full_name, prof.avatar_url, true, null::text;
end;
$$;

revoke all on function public.get_invite_info(uuid) from public;
grant execute on function public.get_invite_info(uuid) to authenticated;

-- ============================================================
-- RPC: accept_invite — creates friendship and marks invite used
-- ============================================================
create or replace function public.accept_invite(_token uuid)
returns table (ok boolean, reason text, friend_id uuid)
language plpgsql
security definer
volatile
as $$
declare
  inv public.friend_invites%rowtype;
  uid uuid := auth.uid();
begin
  if uid is null then
    return query select false, 'unauthenticated', null::uuid;
    return;
  end if;

  select * into inv from public.friend_invites where id = _token for update;
  if not found then
    return query select false, 'not_found', null::uuid;
    return;
  end if;
  if inv.used_at is not null then
    return query select false, 'used', null::uuid;
    return;
  end if;
  if inv.expires_at < now() then
    return query select false, 'expired', null::uuid;
    return;
  end if;
  if inv.inviter_id = uid then
    return query select false, 'self', null::uuid;
    return;
  end if;

  -- Idempotent friendship insert (handles either direction)
  insert into public.friendships (requester_id, addressee_id, status)
  values (inv.inviter_id, uid, 'accepted')
  on conflict (requester_id, addressee_id) do update
    set status = 'accepted';

  update public.friend_invites
     set used_by = uid, used_at = now()
   where id = _token;

  return query select true, null::text, inv.inviter_id;
end;
$$;

revoke all on function public.accept_invite(uuid) from public;
grant execute on function public.accept_invite(uuid) to authenticated;

-- ============================================================
-- RPC: list_friends — returns the user's accepted friends with profile info
-- (avoids self-join / RLS complexity in the client)
-- ============================================================
create or replace function public.list_friends()
returns table (id uuid, full_name text, avatar_url text)
language sql
security definer
stable
as $$
  select p.id, p.full_name, p.avatar_url
  from public.friendships f
  join public.profiles p
    on p.id = case
      when f.requester_id = auth.uid() then f.addressee_id
      else f.requester_id
    end
  where f.status = 'accepted'
    and (f.requester_id = auth.uid() or f.addressee_id = auth.uid());
$$;

revoke all on function public.list_friends() from public;
grant execute on function public.list_friends() to authenticated;
