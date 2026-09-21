-- ═══════════════════════════════════════════════════════════════════════════
-- Support ticket attachments.
--
-- A business attached a screenshot to a ticket and admin saw nothing. The
-- message carried the URL, but the object behind it was not readable: the
-- business-media bucket is where the upload lands, and anything not marked
-- public needs a read policy before the URL resolves.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

update storage.buckets set public = true where id in ('business-media', 'media');

-- Reading is open (these are pictures that end up on the public site anyway);
-- writing still requires a signed-in user.
drop policy if exists "public read business-media" on storage.objects;
create policy "public read business-media" on storage.objects
  for select using (bucket_id in ('business-media', 'media'));

drop policy if exists "signed-in upload business-media" on storage.objects;
create policy "signed-in upload business-media" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('business-media', 'media'));

notify pgrst, 'reload schema';
