-- Public (anon + authenticated) read access for profiles, public events, and follows
-- so that profile pages and event detail pages work without auth and links can be shared

-- Profiles: anyone can read basic profile info
drop policy if exists "profiles read for authenticated" on profiles;
drop policy if exists "profiles readable by anyone" on profiles;
create policy "profiles readable by anyone"
  on profiles for select using (true);

-- Public events: anyone can read events with visibility = 'public'
drop policy if exists "public events readable" on sent_events;
drop policy if exists "public events readable by anyone" on sent_events;
create policy "public events readable by anyone"
  on sent_events for select using (visibility = 'public');

-- Follows: anyone can read (for follower/following counts on public profiles)
drop policy if exists "follows readable by authenticated" on follows;
drop policy if exists "follows readable by anyone" on follows;
create policy "follows readable by anyone"
  on follows for select using (true);
