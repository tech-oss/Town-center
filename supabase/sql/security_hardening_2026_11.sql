-- ═══════════════════════════════════════════════════════════════════════════
-- Security hardening, from Supabase's Security Advisor and a review of every
-- view, function, access rule and storage rule the public API can reach.
--
-- Fixed here:
--
-- 1. Public views could be WRITTEN by anyone. Supabase grants anon and
--    authenticated every privilege on new views, and these views run with
--    their owner's rights (postgres, which bypasses row-level security).
--    public_homepage_placements is a simple view, so anyone holding the
--    site's public key could edit or delete every approved homepage booking
--    (checked: 63 rows). All views are now read-only.
--
-- 2. "Security Definer View" (Security Advisor, critical). The seven public_*
--    views exist to show the public a safe slice of locked tables — e.g.
--    public_business_profiles withholds a free listing's paid fields — so
--    they have to read past those tables' row-level security. That part now
--    lives in a schema the API doesn't serve (private), and the public views
--    are plain views over it that run with the visitor's own rights. What the
--    public can read is exactly as before; nothing else is reachable.
--
-- 3. Anyone could delete every push subscription (the "unsubscribe" rule
--    allowed any row; checked: all 14). Unsubscribing is now
--    push_unsubscribe(endpoint): only the device that knows its own
--    address can remove it.
--
-- 4. Business sign-up could insert a business already "Approved" or
--    featured. A self-registered business must start Pending.
--
-- 5. businesses.admin_note (rejection and suspension reasons) was readable
--    by anyone. Signed-out visitors now read only the public columns.
--
-- 6. Storage: any signed-in business could delete or overwrite any other
--    business's pictures, and upload into admin's media folder; anyone could
--    list every file. Files stay public by link (every picture keeps
--    working), but changing one needs to be its uploader or an admin, and
--    listing is limited to your own uploads.
--
-- 7. 50 owner-rights functions callable by signed-out visitors that only
--    signed-in users, triggers or other functions use: no longer callable
--    signed out. Trigger functions can't be called directly by anyone.
--
-- 8. Functions without a fixed search_path, and the btree_gist extension in
--    the public schema (Security Advisor warnings).
--
-- Runs as one transaction: all of it applies, or none.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── 1 + 2. Views ────────────────────────────────────────────────────────────

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

do $$
declare
  v text;
  cols text;
begin
  foreach v in array array[
    'public_accommodation_companies', 'public_business_articles', 'public_business_profiles',
    'public_business_reviews', 'public_homepage_placements', 'public_promoted_posts', 'public_push_feed'
  ] loop
    if to_regclass('public.' || v) is null then
      continue;  -- already moved by an earlier run
    end if;
    execute format('alter view public.%I set schema private', v);
    execute format('revoke all on private.%I from public, anon, authenticated', v);
    execute format('grant select on private.%I to anon, authenticated, service_role', v);

    select string_agg(format('%I', attname), ', ' order by attnum) into cols
      from pg_attribute where attrelid = format('private.%I', v)::regclass and attnum > 0 and not attisdropped;
    execute format(
      'create view public.%I with (security_invoker = true) as select %s from private.%I%s',
      v, cols, v, case when v = 'public_push_feed' then ' order by sent_at desc' else '' end);
    execute format('revoke all on public.%I from public, anon, authenticated', v);
    execute format('grant select on public.%I to anon, authenticated, service_role', v);
  end loop;
end $$;


-- ── 3. Push subscriptions ───────────────────────────────────────────────────

drop policy if exists "anyone can unsubscribe their own" on public.push_subscriptions;

create or replace function public.push_unsubscribe(p_endpoint text)
returns void
language sql volatile security definer
set search_path = public
as $$
  delete from public.push_subscriptions where endpoint = p_endpoint and coalesce(p_endpoint, '') <> '';
$$;
revoke all on function public.push_unsubscribe(text) from public;
grant execute on function public.push_unsubscribe(text) to anon, authenticated, service_role;


-- ── 4. Business self-registration ───────────────────────────────────────────

drop policy if exists "authenticated users create a business" on public.businesses;
create policy "authenticated users create a business"
  on public.businesses for insert to authenticated
  with check (
    status = 'Pending'
    and coalesce(featured, false) = false
    and kind in ('standard', 'accommodation_company')
    and parent_id is null
    and replaces_id is null
    and property_state is null
    and admin_note is null
  );


-- ── 5. Public columns of businesses ─────────────────────────────────────────

revoke select on public.businesses from anon;
grant select (id, name, status, submitted_at, featured, visible, kind, parent_id, property_state, replaces_id)
  on public.businesses to anon;


-- ── 6. Storage ──────────────────────────────────────────────────────────────

drop policy if exists "signed-in upload business-media" on storage.objects;
drop policy if exists "public read business-media" on storage.objects;
drop policy if exists "public reads media" on storage.objects;
drop policy if exists "authenticated delete business-media" on storage.objects;
drop policy if exists "authenticated update business-media" on storage.objects;

drop policy if exists "uploaders and admins read uploads" on storage.objects;
create policy "uploaders and admins read uploads"
  on storage.objects for select to authenticated
  using (bucket_id in ('business-media', 'media') and (owner_id = auth.uid()::text or (select public.is_admin())));

drop policy if exists "uploaders and admins change business-media" on storage.objects;
create policy "uploaders and admins change business-media"
  on storage.objects for update to authenticated
  using (bucket_id = 'business-media' and (owner_id = auth.uid()::text or (select public.is_admin())))
  with check (bucket_id = 'business-media');

drop policy if exists "uploaders and admins delete business-media" on storage.objects;
create policy "uploaders and admins delete business-media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'business-media' and (owner_id = auth.uid()::text or (select public.is_admin())));


-- ── 7. Who can call the owner-rights functions ──────────────────────────────
-- Signed-out visitors keep only what the public site calls (record_view,
-- push_mark_seen, push_unsubscribe, unclaimed_businesses,
-- business_role_slot_taken) and what access rules evaluate for them.

do $$
declare
  f record;
  keep_for_anon text[] := array[
    'record_view', 'push_mark_seen', 'push_unsubscribe', 'unclaimed_businesses', 'business_role_slot_taken',
    'is_admin', 'is_approved_business_member', 'is_approved_owner', 'is_business_owner', 'legal_is_member',
    'homepage_is_owner', 'feature_article_member', 'business_is_subscribed', 'push_notification_balance'
  ];
begin
  for f in
    select p.oid::regprocedure as sig, p.proname, p.prosecdef,
           p.prorettype = 'trigger'::regtype as is_trigger
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f'
       and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')  -- not extension-owned
  loop
    if f.is_trigger then
      execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
    elsif f.prosecdef and not (f.proname = any (keep_for_anon)) then
      execute format('revoke execute on function %s from public, anon', f.sig);
      execute format('grant execute on function %s to authenticated, service_role', f.sig);
    end if;
  end loop;
end $$;


-- ── 8. search_path and extension schema ─────────────────────────────────────

alter function public.businesses_start_hidden() set search_path = public;
alter function public.coord_in_range(text, numeric, numeric) set search_path = public;
alter function public.enforce_featured_limit() set search_path = public;
alter function public.homepage_slot_max_capacity(text) set search_path = public;
alter function public.homepage_slot_packages_limit() set search_path = public;
alter function public.homepage_slot_types_clamp() set search_path = public;
alter function public.listing_as_approved(public.business_listings) set search_path = public;
alter function public.listing_snapshot_column(text) set search_path = public;
alter function public.touch_homepage_placement() set search_path = public;
alter function public.trim_to_length(text, integer) set search_path = public;

alter extension btree_gist set schema extensions;

notify pgrst, 'reload schema';

commit;
