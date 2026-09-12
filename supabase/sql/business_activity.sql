-- ═══════════════════════════════════════════════════════════════════════════
-- business_activity — the feed behind "Recent Activity" on the business
-- dashboard. One row per meaningful change to a business: what the business
-- itself edited or submitted, and what admin approved or rejected.
--
-- Why a table rather than deriving it from the content tables: those carry a
-- single updated_at per row, so they can only ever describe the latest state
-- of an item, and admin's approve/reject writes don't touch updated_at at
-- all — an approval would be stamped with the time the business last edited
-- it. A log records each event when it happens, with who did it.
--
-- NOT RUN YET.
-- Write side: src/business/api/businessActivity.js (business dashboard) and
-- src/api/admin/activityLog.js (admin panel, admin-panel branch).
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.business_activity (
  id           uuid primary key default gen_random_uuid(),
  business_id  text not null references public.businesses(id) on delete cascade,
  -- Dotted verb, e.g. 'article.submitted', 'listing.approved'. The label
  -- shown to the business is built client-side from this plus `title`.
  action       text not null,
  entity_type  text,
  entity_id    text,
  title        text,
  detail       text,
  actor        text not null default 'business' check (actor in ('business', 'admin', 'system')),
  actor_name   text,
  created_at   timestamptz not null default now()
);

create index if not exists business_activity_business_idx
  on public.business_activity (business_id, created_at desc);

alter table public.business_activity enable row level security;

-- A business reads its own activity; admin reads and writes everyone's.
-- Inserts are never made on behalf of another business.
drop policy if exists "business members read their own activity" on public.business_activity;
create policy "business members read their own activity"
  on public.business_activity for select
  using (public.is_approved_business_member(business_id) or public.is_admin());

drop policy if exists "business members log their own activity" on public.business_activity;
create policy "business members log their own activity"
  on public.business_activity for insert
  with check (public.is_approved_business_member(business_id) or public.is_admin());

drop policy if exists "admins manage activity" on public.business_activity;
create policy "admins manage activity"
  on public.business_activity for all
  using (public.is_admin()) with check (public.is_admin());


-- ── Backfill ───────────────────────────────────────────────────────────────
-- So the feed isn't empty on day one. Each existing item contributes one row
-- describing its current state, timestamped with the best time the row has.
-- Guarded by the action+entity pair so re-running adds nothing.

insert into public.business_activity (business_id, action, entity_type, entity_id, title, actor, created_at)
select a.business_id,
       case a.status
         when 'Live' then 'article.approved'
         when 'Pending Approval' then 'article.submitted'
         when 'Rejected' then 'article.rejected'
         else 'article.updated'
       end,
       'article', a.id::text, a.title,
       case when a.status in ('Live', 'Rejected') then 'admin' else 'business' end,
       coalesce(a.updated_at, a.date::timestamptz, now())
from public.business_articles a
where not exists (
  select 1 from public.business_activity x
  where x.entity_type = 'article' and x.entity_id = a.id::text
);

insert into public.business_activity (business_id, action, entity_type, entity_id, title, actor, created_at)
select e.business_id,
       case e.status
         when 'Live' then 'event.approved'
         when 'Pending Approval' then 'event.submitted'
         when 'Rejected' then 'event.rejected'
         else 'event.updated'
       end,
       'event', e.id::text, e.title,
       case when e.status in ('Live', 'Rejected') then 'admin' else 'business' end,
       coalesce(e.updated_at, e.created_at, now())
from public.business_events e
where not exists (
  select 1 from public.business_activity x
  where x.entity_type = 'event' and x.entity_id = e.id::text
);

insert into public.business_activity (business_id, action, entity_type, entity_id, title, actor, created_at)
select l.business_id, 'listing.updated', 'listing', l.business_id, l.name, 'business',
       coalesce(l.updated_at, now())
from public.business_listings l
where not exists (
  select 1 from public.business_activity x
  where x.entity_type = 'listing' and x.business_id = l.business_id
);

insert into public.business_activity (business_id, action, entity_type, entity_id, title, actor, created_at)
select r.business_id, 'review.received', 'review', r.id::text, r.reviewer, 'system',
       coalesce(r.date::timestamptz, now())
from public.business_reviews r
where not exists (
  select 1 from public.business_activity x
  where x.entity_type = 'review' and x.entity_id = r.id::text
);
