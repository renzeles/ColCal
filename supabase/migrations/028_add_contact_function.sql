-- Auto-mutual follow via SECURITY DEFINER (bypasses RLS for the reverse direction)
-- Without this, follows.insert blocked reverse direction because RLS requires follower_id = auth.uid()

create or replace function public.add_contact(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'Not authenticated';
  end if;
  if target_id = caller_id then
    return;
  end if;
  insert into follows (follower_id, following_id)
    values (caller_id, target_id)
    on conflict do nothing;
  insert into follows (follower_id, following_id)
    values (target_id, caller_id)
    on conflict do nothing;
end;
$$;

revoke all on function public.add_contact(uuid) from public;
revoke all on function public.add_contact(uuid) from anon;
grant execute on function public.add_contact(uuid) to authenticated;


-- Bulk version for event-invite auto-friending
create or replace function public.add_contacts_bulk(target_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  t uuid;
begin
  if caller_id is null then
    raise exception 'Not authenticated';
  end if;
  foreach t in array target_ids loop
    if t is not null and t <> caller_id then
      insert into follows (follower_id, following_id)
        values (caller_id, t)
        on conflict do nothing;
      insert into follows (follower_id, following_id)
        values (t, caller_id)
        on conflict do nothing;
    end if;
  end loop;
end;
$$;

revoke all on function public.add_contacts_bulk(uuid[]) from public;
revoke all on function public.add_contacts_bulk(uuid[]) from anon;
grant execute on function public.add_contacts_bulk(uuid[]) to authenticated;
