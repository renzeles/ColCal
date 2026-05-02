-- Fix infinite recursion between events <-> event_shares policies
-- via SECURITY DEFINER helper for the creator check.

create or replace function public.is_event_creator(_event_id uuid, _user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.events where id = _event_id and creator_id = _user_id
  );
$$;

revoke all on function public.is_event_creator(uuid, uuid) from public;
grant execute on function public.is_event_creator(uuid, uuid) to authenticated;

drop policy if exists "event_shares read" on public.event_shares;
create policy "event_shares read"
  on public.event_shares for select to authenticated
  using (
    shared_with_user_id = auth.uid()
    or public.is_event_creator(event_id, auth.uid())
  );

drop policy if exists "event_shares managed by event creator" on public.event_shares;
create policy "event_shares managed by event creator"
  on public.event_shares for all to authenticated
  using (public.is_event_creator(event_id, auth.uid()))
  with check (public.is_event_creator(event_id, auth.uid()));
