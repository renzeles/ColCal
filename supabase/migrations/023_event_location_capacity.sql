alter table sent_events
  add column if not exists latitude  float8,
  add column if not exists longitude float8,
  add column if not exists capacity  int check (capacity > 0),
  add column if not exists is_online boolean not null default false;
