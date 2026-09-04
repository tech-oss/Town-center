-- ═══════════════════════════════════════════════════════════════════════════
-- Analytics: profile views + content (news/offer) views.
--
-- NOT RUN YET. This is hand-off SQL for when tracking goes live — see
-- src/business/api/businessAnalytics.js for the read-side queries that
-- depend on it, and supabase/functions/track-view/index.ts for the
-- write-side Edge Function that inserts into this table.
--
-- content_type is 'profile' | 'article' | 'news' | 'offer'. Today's schema
-- only ever produces 'news' or 'offer' rows in business_articles (there is
-- no distinct "Article" content type yet) — 'article' is reserved for if
-- that changes later. content_id = business_id for 'profile' rows, and
-- business_articles.id for everything else.
-- ═══════════════════════════════════════════════════════════════════════════

create table public.analytics_events (
  id           uuid primary key default gen_random_uuid(),
  business_id  text not null references public.businesses(id) on delete cascade,
  content_type text not null check (content_type in ('profile', 'article', 'news', 'offer')),
  content_id   text not null,
  event_type   text not null check (event_type in ('view')),
  source       text not null check (source in ('web', 'app')),
  session_id   text,             -- anonymous, per-session dedup token — no PII
  created_at   timestamptz not null default now()
);

create index analytics_events_business_date_idx
  on public.analytics_events (business_id, content_type, created_at);
create index analytics_events_content_idx
  on public.analytics_events (business_id, content_type, content_id, created_at);

-- One row per (business, content, session, day) — the Edge Function checks
-- this before inserting so a refresh doesn't inflate the count, but the
-- constraint is the backstop against any other write path double-counting.
create unique index analytics_events_dedup_idx
  on public.analytics_events (business_id, content_type, content_id, session_id, (created_at::date))
  where session_id is not null;

alter table public.analytics_events enable row level security;

-- Reads: only an approved member of the business can see its own analytics.
-- Reuses is_approved_business_member(), already created for My Listing.
create policy "business members read their analytics"
  on public.analytics_events for select
  using (public.is_approved_business_member(business_id));

-- No public INSERT policy — writes only happen via the track-view Edge
-- Function, which uses the service_role key and bypasses RLS entirely.
-- This is deliberate: it's what stops a visitor from scripting fake views
-- for their own (or a competitor's) business from devtools.

-- ─── RPC: daily view counts for a date range ──────────────────────────────
-- Used for both the Profile Views chart (p_content_types = ['profile']) and
-- the combined Content Views chart (p_content_types = ['article','news','offer']),
-- and — passing p_content_id — for one content item's own detail chart.
-- p_until is inclusive of that whole day, so a custom range picked in the UI
-- (e.g. "1 Aug – 15 Aug") includes all of the 15th, not just up to midnight.
--
-- These run as security definer (so they can read analytics_events despite
-- there being no public SELECT policy on it), which means the authorization
-- check that RLS would normally provide has to happen explicitly inside the
-- function body instead — skipping it would let any authenticated user read
-- any business's analytics by just passing a different p_business_id.
create or replace function public.get_daily_view_counts(
  p_business_id text,
  p_content_types text[],
  p_content_id text,
  p_since timestamptz,
  p_until timestamptz default now()
)
returns table (day date, view_count bigint)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_approved_business_member(p_business_id) then
    raise exception 'not authorized for this business';
  end if;

  return query
    select e.created_at::date as day, count(*) as view_count
    from public.analytics_events e
    where e.business_id = p_business_id
      and e.content_type = any(p_content_types)
      and e.event_type = 'view'
      and e.created_at >= p_since
      and e.created_at < (p_until::date + 1)
      and (p_content_id is null or e.content_id = p_content_id)
    group by e.created_at::date
    order by day;
end;
$$;

-- ─── RPC: per-content totals, joined against business_articles for title/type ──
create or replace function public.get_content_breakdown(
  p_business_id text,
  p_since timestamptz,
  p_until timestamptz default now()
)
returns table (content_id text, title text, type text, view_count bigint)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_approved_business_member(p_business_id) then
    raise exception 'not authorized for this business';
  end if;

  return query
    select
      e.content_id,
      a.title,
      a.type,
      count(*) as view_count
    from public.analytics_events e
    join public.business_articles a on a.id::text = e.content_id
    where e.business_id = p_business_id
      and e.content_type in ('article', 'news', 'offer')
      and e.event_type = 'view'
      and e.created_at >= p_since
      and e.created_at < (p_until::date + 1)
    group by e.content_id, a.title, a.type
    order by view_count desc;
end;
$$;

-- Callers authenticate as the business owner/content manager (RLS on the
-- underlying table still applies inside these security definer functions
-- via is_approved_business_member checks on any direct table access
-- elsewhere) — grant execute to the authenticated role:
grant execute on function public.get_daily_view_counts(text, text[], text, timestamptz, timestamptz) to authenticated;
grant execute on function public.get_content_breakdown(text, timestamptz, timestamptz) to authenticated;
