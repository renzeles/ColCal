-- Image column on sent_events
alter table sent_events add column if not exists image_url text;

-- Public bucket for event images (idempotent)
insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do nothing;

-- Public read
drop policy if exists "event images public read" on storage.objects;
create policy "event images public read"
  on storage.objects for select
  using (bucket_id = 'event-images');

-- Authenticated users can upload only into their own folder: {user_id}/...
drop policy if exists "event images authenticated upload" on storage.objects;
create policy "event images authenticated upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can delete their own files
drop policy if exists "event images authenticated delete" on storage.objects;
create policy "event images authenticated delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
