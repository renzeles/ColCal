-- Allow any authenticated user to discover channels (read-only)
-- Membership policies stay restricted (only see members of channels you're in)
drop policy if exists "channels_select" on channels;
create policy "channels_select" on channels
  for select using (auth.uid() is not null);
