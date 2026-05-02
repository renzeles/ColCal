-- Temporarily drop the "events shared select" policy. The recursion between
-- it and event_shares (even with SECURITY DEFINER helpers) was unblocking
-- single-user usage. We'll reintroduce sharing with a clean, non-recursive
-- design when the friends/groups feature is wired up.
drop policy if exists "events shared select" on public.events;
