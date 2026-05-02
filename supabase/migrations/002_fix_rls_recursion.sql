-- Fix infinite recursion between groups <-> group_members <-> events policies
-- by using a SECURITY DEFINER helper function that bypasses RLS for the
-- internal membership check.

create or replace function public.is_group_member(_group_id uuid, _user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = _group_id and user_id = _user_id
  );
$$;

revoke all on function public.is_group_member(uuid, uuid) from public;
grant execute on function public.is_group_member(uuid, uuid) to authenticated;

-- Replace recursive policies

drop policy if exists "groups read members" on public.groups;
create policy "groups read members"
  on public.groups for select to authenticated
  using (
    created_by = auth.uid()
    or public.is_group_member(id, auth.uid())
  );

drop policy if exists "events shared select" on public.events;
create policy "events shared select"
  on public.events for select to authenticated
  using (
    is_public
    or exists (
      select 1 from public.event_shares es
      where es.event_id = events.id
        and (
          es.shared_with_user_id = auth.uid()
          or public.is_group_member(es.shared_with_group_id, auth.uid())
        )
    )
  );
