-- Color de cada evento (para tintar la card en el feed/perfil)
alter table sent_events
  add column if not exists color text not null default 'zinc'
  check (color in ('zinc', 'red', 'orange', 'amber', 'emerald', 'sky', 'violet', 'pink'));
