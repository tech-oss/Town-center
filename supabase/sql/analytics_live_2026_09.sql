-- ═══════════════════════════════════════════════════════════════════════════
-- Business analytics, live.
--
-- The website and app call record_view() whenever someone opens a business
-- page, one of its posts, or one of its events. The business dashboard (and
-- admin's per-business analytics) read the counts back with
-- analytics_daily_views() and analytics_content_breakdown().
--
--   • One view per visitor per item per UK day: the browser sends an
--     anonymous session token (no personal data), and a repeat from the same
--     session that day isn't counted again.
--   • record_view() checks the item really exists and belongs to that
--     business, so nobody can post views for made-up content.
--   • Days are UK days (Europe/London), so "today" matches the clock the
--     business sees.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.analytics_events (
  id           uuid primary key default gen_random_uuid(),
  business_id  text not null references public.businesses(id) on delete cascade,
  content_type text not null,
  content_id   text not null,
  event_type   text not null default 'view',
  source       text not null,
  session_id   text,
  created_at   timestamptz not null default now()
);

-- Posts written by admin or for a homepage slot, and events, count too.
-- Drop whatever checks the table was first created with (names can differ).
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.analytics_events'::regclass and contype = 'c'
      and (pg_get_constraintdef(oid) ilike '%content_type%' or pg_get_constraintdef(oid) ilike '%source%')
  loop
    execute format('alter table public.analytics_events drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.analytics_events add constraint analytics_events_content_type_check
  check (content_type in ('profile', 'article', 'news', 'offer', 'event'));
alter table public.analytics_events add constraint analytics_events_source_check
  check (source in ('web', 'app'));

create index if not exists analytics_events_business_date_idx
  on public.analytics_events (business_id, content_type, created_at);
create index if not exists analytics_events_content_idx
  on public.analytics_events (business_id, content_type, content_id, created_at);
create index if not exists analytics_events_session_idx
  on public.analytics_events (business_id, content_id, session_id, created_at);

alter table public.analytics_events enable row level security;
-- No direct reads or writes: everything goes through the functions below.
drop policy if exists "business members read their analytics" on public.analytics_events;


-- Whether the signed-in user may see this business's analytics.
create or replace function public.analytics_can_read(p_business_id text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from business_users u
    where u.business_id = p_business_id
      and u.auth_user_id = auth.uid()
      and u.status = 'approved'
  )
$$;


-- ── Recording a view (website and app, signed in or not) ──────────────────

create or replace function public.record_view(
  p_business_id text,
  p_content_type text,
  p_content_id text,
  p_source text,
  p_session_id text
)
returns void
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_type text := lower(coalesce(p_content_type, ''));
  v_day_start timestamptz := (date_trunc('day', now() at time zone 'Europe/London')) at time zone 'Europe/London';
begin
  if p_business_id is null or p_content_id is null
     or v_type not in ('profile', 'news', 'offer', 'event')
     or p_source not in ('web', 'app')
     or length(coalesce(p_session_id, '')) not between 8 and 64 then
    return;
  end if;

  -- Only real, public content of that business is counted.
  if v_type = 'profile' then
    if p_content_id <> p_business_id or not exists (
      select 1 from businesses b where b.id = p_business_id and b.status = 'Approved'
    ) then return; end if;
  elsif v_type = 'event' then
    if not exists (
      select 1 from business_events e
      where e.id::text = p_content_id and e.business_id = p_business_id and e.status = 'Live'
    ) then return; end if;
  else
    if not exists (
      select 1 from business_articles a
      where a.id::text = p_content_id and a.business_id = p_business_id and a.status = 'Live'
    ) and not exists (
      select 1 from news_offers n
      where n.id::text = p_content_id and n.business_id = p_business_id and n.status = 'Published'
    ) then return; end if;
  end if;

  -- One view per session per item per UK day.
  if exists (
    select 1 from analytics_events e
    where e.business_id = p_business_id and e.content_id = p_content_id
      and e.session_id = p_session_id and e.created_at >= v_day_start
  ) then
    return;
  end if;

  insert into analytics_events (business_id, content_type, content_id, event_type, source, session_id)
  values (p_business_id, v_type, p_content_id, 'view', p_source, p_session_id);
end $$;

revoke all on function public.record_view(text, text, text, text, text) from public;
grant execute on function public.record_view(text, text, text, text, text) to anon, authenticated;


-- ── Daily counts for a date range (UK days, inclusive) ────────────────────
-- p_content_types: ['profile'] for page views, ['news','offer','event'] for
-- content; p_content_id narrows to one item.

create or replace function public.analytics_daily_views(
  p_business_id text,
  p_content_types text[],
  p_content_id text,
  p_from date,
  p_to date
)
returns table (day date, view_count bigint, web_count bigint, app_count bigint)
language plpgsql stable security definer set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.analytics_can_read(p_business_id) then
    raise exception 'Not authorised for this business.' using errcode = '42501';
  end if;

  return query
    select (e.created_at at time zone 'Europe/London')::date as day,
           count(*) as view_count,
           count(*) filter (where e.source = 'web') as web_count,
           count(*) filter (where e.source = 'app') as app_count
    from analytics_events e
    where e.business_id = p_business_id
      and e.content_type = any(p_content_types)
      and (p_content_id is null or e.content_id = p_content_id)
      and e.created_at >= (p_from::timestamp at time zone 'Europe/London')
      and e.created_at <  ((p_to + 1)::timestamp at time zone 'Europe/London')
    group by 1
    order by 1;
end $$;

revoke all on function public.analytics_daily_views(text, text[], text, date, date) from public, anon;
grant execute on function public.analytics_daily_views(text, text[], text, date, date) to authenticated;


-- ── Views per post / event in a date range ────────────────────────────────

create or replace function public.analytics_content_breakdown(
  p_business_id text,
  p_from date,
  p_to date
)
returns table (content_id text, content_type text, title text, view_count bigint)
language plpgsql stable security definer set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.analytics_can_read(p_business_id) then
    raise exception 'Not authorised for this business.' using errcode = '42501';
  end if;

  return query
    select e.content_id,
           max(e.content_type) as content_type,
           coalesce(max(a.title), max(n.title), max(ev.title), 'Removed item') as title,
           count(*) as view_count
    from analytics_events e
    left join business_articles a on e.content_type in ('news', 'offer', 'article') and a.id::text = e.content_id
    left join news_offers n       on e.content_type in ('news', 'offer') and n.id::text = e.content_id
    left join business_events ev  on e.content_type = 'event' and ev.id::text = e.content_id
    where e.business_id = p_business_id
      and e.content_type in ('news', 'offer', 'article', 'event')
      and e.created_at >= (p_from::timestamp at time zone 'Europe/London')
      and e.created_at <  ((p_to + 1)::timestamp at time zone 'Europe/London')
    group by e.content_id
    order by view_count desc;
end $$;

revoke all on function public.analytics_content_breakdown(text, date, date) from public, anon;
grant execute on function public.analytics_content_breakdown(text, date, date) to authenticated;

notify pgrst, 'reload schema';
