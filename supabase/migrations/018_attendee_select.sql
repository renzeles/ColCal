-- Allow users to see private events where they are listed as attendees (by email)
create policy "attendees can read events" on sent_events
  for select to authenticated
  using ((auth.jwt() ->> 'email') = any(attendee_emails));
