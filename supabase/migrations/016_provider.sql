-- Track which calendar provider each event was sent through
alter table sent_events
  add column if not exists provider text not null default 'google'
  check (provider in ('google', 'microsoft'));

-- Rename google_event_id to be provider-agnostic
alter table sent_events
  rename column google_event_id to provider_event_id;
