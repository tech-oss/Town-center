-- ═══════════════════════════════════════════════════════════════════════════
-- A business asking for a push notification.
--
-- Push is sold as a Visibility Plan feature ("Access to in app push
-- notifications"), but only admin could ever send one: push_notifications is
-- admin-only by RLS, and the composer lives on the admin panel. A business
-- had no way to ask.
--
-- This is the request. A business composes exactly what admin composes —
-- title, message, link, channels, an optional attached article — and it waits
-- here until admin approves it. Approving is what sends it: admin's own
-- send path runs, a push_notifications row is written, and the request keeps
-- a pointer to it. Rejecting requires a reason, which the business reads on
-- its own page.
--
-- A business still cannot broadcast anything itself. Nothing here grants any
-- access to push_notifications or push_subscriptions; the only way a request
-- becomes a send is an admin acting on it.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. article_id holds a slug, not a uuid ────────────────────────────────
-- Found while building this. getAttachableContent() ids its rows by slug
-- ("christmas-menu", "guide-riverside", "story-…"), and sendPush writes that
-- straight into article_id — which is a uuid column, so every attempt to
-- attach an article to a push fails with "invalid input syntax for type
-- uuid". The attach feature has never worked. The ids are slugs by design
-- (they address the public page the push links to), so the column follows
-- the data rather than the other way round.
--
-- No rows are converted: a uuid casts to text cleanly, and there is nothing
-- to lose either way.
alter table public.push_notifications
  alter column article_id type text using article_id::text;


-- ── 2. The requests themselves ────────────────────────────────────────────

create table if not exists public.business_push_requests (
  id                uuid primary key default gen_random_uuid(),
  business_id       text not null references public.businesses(id) on delete cascade,

  -- The same fields admin's composer has, so an approved request can be sent
  -- verbatim with nothing re-keyed.
  title             text not null,
  body              text,
  url               text,
  audience          text not null default 'all',
  channels          jsonb not null default '[]'::jsonb,   -- ["Web","Mobile"]
  notif_type        text not null default 'simple' check (notif_type in ('simple', 'rich')),
  article_id        text,
  article_title     text,
  article_image     text,
  article_link      text,

  status            text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  -- Required when rejecting; the business is shown it.
  rejection_reason  text,

  requested_by      uuid,
  requested_name    text,
  created_at        timestamptz not null default now(),
  reviewed_at       timestamptz,
  reviewed_by       uuid,
  -- What was actually sent, once approved.
  notification_id   uuid references public.push_notifications(id) on delete set null
);

create index if not exists business_push_requests_status_idx
  on public.business_push_requests (status, created_at desc);
create index if not exists business_push_requests_business_idx
  on public.business_push_requests (business_id, created_at desc);

-- A rejection without a reason is just a silence the business can't act on.
alter table public.business_push_requests
  drop constraint if exists business_push_requests_reason_check;
alter table public.business_push_requests
  add constraint business_push_requests_reason_check
  check (status <> 'rejected' or coalesce(btrim(rejection_reason), '') <> '');


-- ── 3. Who can do what ────────────────────────────────────────────────────

alter table public.business_push_requests enable row level security;

-- Everyone approved on the business sees its requests, including whoever
-- raised one — the point is to read the outcome and the reason.
drop policy if exists "business reads its push requests" on public.business_push_requests;
create policy "business reads its push requests"
  on public.business_push_requests for select
  using (public.feature_article_member(business_id) or public.is_admin());

-- Raising one needs the Visibility Plan, the same gate every other paid
-- feature uses (business_is_subscribed, promotions_need_subscription_2026_09).
-- status is pinned to 'pending': a business cannot insert something already
-- approved.
drop policy if exists "subscribed business raises push requests" on public.business_push_requests;
create policy "subscribed business raises push requests"
  on public.business_push_requests for insert
  with check (
    status = 'pending'
    and rejection_reason is null
    and notification_id is null
    and requested_by = auth.uid()
    and public.feature_article_member(business_id)
    and public.business_is_subscribed(business_id)
  );

-- A business may withdraw a request it has not had answered yet, and nothing
-- else. Approving, rejecting and sending are admin's alone — there is
-- deliberately no business UPDATE policy.
drop policy if exists "business withdraws a pending push request" on public.business_push_requests;
create policy "business withdraws a pending push request"
  on public.business_push_requests for delete
  using (status = 'pending' and public.feature_article_member(business_id));

drop policy if exists "admins manage push requests" on public.business_push_requests;
create policy "admins manage push requests"
  on public.business_push_requests for all
  using (public.is_admin()) with check (public.is_admin());


notify pgrst, 'reload schema';

-- Nothing exists yet; this confirms the table and its policies are in place.
select
  (select count(*) from public.business_push_requests) as requests,
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'business_push_requests') as policies,
  (select data_type from information_schema.columns
    where table_schema = 'public' and table_name = 'push_notifications'
      and column_name = 'article_id') as push_article_id_type;
