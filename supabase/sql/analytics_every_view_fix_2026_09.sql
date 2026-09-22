-- ═══════════════════════════════════════════════════════════════════════════
-- Analytics: every page view is counted. For real this time.
--
-- analytics_every_view_2026_09.sql removed the "one view per session per day"
-- check from record_view(), but the same rule was ALSO enforced underneath it
-- by a unique index, analytics_events_dedup_idx, on
--   (business_id, content_type, content_id, session_id, created_at::date).
-- So the first visit of the day from a browser counted, and every repeat
-- visit hit the index, failed with 23505 / HTTP 409, and was discarded — the
-- browser swallowed the error, so nothing visibly broke and the numbers
-- simply stopped moving.
--
-- This drops that index (and any other uniqueness on the table beyond its
-- primary key), so every valid page load is its own row: no per-minute,
-- per-session, per-device or per-day deduplication of any kind.
--
-- It also adds Featured Articles as something a view can be recorded for —
-- the longer editorial pieces businesses now write — so they show in the
-- business's analytics alongside its posts and events.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. No deduplication at the database level ─────────────────────────────

drop index if exists public.analytics_events_dedup_idx;

-- Any other unique index or constraint on the table, whatever it was named,
-- apart from the primary key.
do $$
declare r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.analytics_events'::regclass
      and c.contype = 'u'
  loop
    execute format('alter table public.analytics_events drop constraint %I', r.conname);
  end loop;

  for r in
    select i.relname as index_name
    from pg_index x
    join pg_class i on i.oid = x.indexrelid
    where x.indrelid = 'public.analytics_events'::regclass
      and x.indisunique
      and not x.indisprimary
  loop
    execute format('drop index if exists public.%I', r.index_name);
  end loop;
end $$;


-- ── 2. Featured Articles are a trackable type ─────────────────────────────

do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.analytics_events'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%content_type%'
  loop
    execute format('alter table public.analytics_events drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.analytics_events add constraint analytics_events_content_type_check
  check (content_type in ('profile', 'article', 'news', 'offer', 'event', 'featured'));


-- ── 3. Recording a view ───────────────────────────────────────────────────

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
begin
  if p_business_id is null or p_content_id is null
     or v_type not in ('profile', 'news', 'offer', 'event', 'featured')
     or p_source not in ('web', 'app') then
    return;
  end if;

  -- Only real, public content of that business is counted, so nobody can
  -- post views for made-up items.
  if v_type = 'profile' then
    if p_content_id <> p_business_id or not exists (
      select 1 from businesses b where b.id = p_business_id and b.status = 'Approved'
    ) then return; end if;
  elsif v_type = 'event' then
    if not exists (
      select 1 from business_events e
      where e.id::text = p_content_id and e.business_id = p_business_id and e.status = 'Live'
    ) then return; end if;
  elsif v_type = 'featured' then
    if not exists (
      select 1 from feature_articles f
      where f.id::text = p_content_id and f.business_id = p_business_id and f.status = 'Live'
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

  -- Every valid view is its own row. No deduplication of any kind.
  insert into analytics_events (business_id, content_type, content_id, event_type, source, session_id)
  values (p_business_id, v_type, p_content_id, 'view', p_source, nullif(p_session_id, ''));
end $$;

revoke all on function public.record_view(text, text, text, text, text) from public;
grant execute on function public.record_view(text, text, text, text, text) to anon, authenticated;


-- ── 4. Per-item breakdown, now naming Featured Articles too ───────────────

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
           coalesce(max(a.title), max(n.title), max(ev.title), max(f.title), 'Removed item') as title,
           count(*) as view_count
    from analytics_events e
    left join business_articles a on e.content_type in ('news', 'offer', 'article') and a.id::text = e.content_id
    left join news_offers n       on e.content_type in ('news', 'offer') and n.id::text = e.content_id
    left join business_events ev  on e.content_type = 'event' and ev.id::text = e.content_id
    left join feature_articles f  on e.content_type = 'featured' and f.id::text = e.content_id
    where e.business_id = p_business_id
      and e.content_type in ('news', 'offer', 'article', 'event', 'featured')
      and e.created_at >= (p_from::timestamp at time zone 'Europe/London')
      and e.created_at <  ((p_to + 1)::timestamp at time zone 'Europe/London')
    group by e.content_id
    order by view_count desc;
end $$;

revoke all on function public.analytics_content_breakdown(text, date, date) from public, anon;
grant execute on function public.analytics_content_breakdown(text, date, date) to authenticated;

notify pgrst, 'reload schema';
