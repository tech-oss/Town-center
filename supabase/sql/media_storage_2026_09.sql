-- ═══════════════════════════════════════════════════════════════════════════
-- Media storage bucket for admin image uploads.
--
-- Every admin image field read the file with FileReader and stored the whole
-- thing as a base64 data URL in the column. That works, but it inflates each
-- row by roughly a third of the file size and lands inside jsonb documents —
-- a guide with a dozen section images would carry megabytes of base64 in one
-- row, and the same bytes ship again on every read of that row.
--
-- Uploads now go to this bucket and the column keeps a public URL instead.
--
-- Public read: these are images on a public website.
-- Writes are admin-only, matching every other content table.
-- Depends on admin_users.sql having been run (public.is_admin()).
-- ═══════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "public reads media" on storage.objects;
create policy "public reads media"
  on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists "admins upload media" on storage.objects;
create policy "admins upload media"
  on storage.objects for insert
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "admins update media" on storage.objects;
create policy "admins update media"
  on storage.objects for update
  using (bucket_id = 'media' and public.is_admin());

drop policy if exists "admins delete media" on storage.objects;
create policy "admins delete media"
  on storage.objects for delete
  using (bucket_id = 'media' and public.is_admin());
