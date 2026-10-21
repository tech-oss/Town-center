-- ═══════════════════════════════════════════════════════════════════════════
-- Analytics: leave out posts and events that have been deleted.
--
-- Views are kept per item (analytics_events). When a business deleted an
-- article, offer, event or Featured Article, its views still counted and
-- the "Your content" list showed it as "Removed item". Deleted items are now
-- left out of the analytics everywhere — the list, and the News, Offers &
-- Events totals and chart — so the figures only cover what the business
-- still has. The recorded views themselves are kept.
--
-- Page (profile) views are unaffected. Same as accommodation_analytics_2026_10.sql
-- otherwise.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

-- Whether the post or event a content view was for still exists.
create or replace function public.analytics_content_exists(p_type text, p_id text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select case
    when p_type = 'event' then exists (select 1 from business_events x where x.id::text = p_id)
    when p_type = 'featured' then exists (select 1 from feature_articles x where x.id::text = p_id)
    when p_type in ('news', 'offer', 'article') then
      exists (select 1 from business_articles x where x.id::text = p_id)
      or exists (select 1 from news_offers x where x.id::text = p_id)
    else true
  end
$$;

create or replace function public.analytics_daily_views(p_business_id text, p_content_types text[], p_content_id text, p_from date, p_to date)
returns table(day date, view_count bigint, web_count bigint, app_count bigint)
language plpgsql stable security definer
set search_path = public
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
    where e.business_id = any (public.analytics_scope(p_business_id))
      and e.content_type = any(p_content_types)
      and (p_content_id is null or e.content_id = p_content_id)
      and (e.content_type = 'profile' or public.analytics_content_exists(e.content_type, e.content_id))
      and e.created_at >= (p_from::timestamp at time zone 'Europe/London')
      and e.created_at <  ((p_to + 1)::timestamp at time zone 'Europe/London')
    group by 1
    order by 1;
end $$;

create or replace function public.analytics_content_breakdown(p_business_id text, p_from date, p_to date)
returns table(content_id text, content_type text, title text, view_count bigint)
language plpgsql stable security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.analytics_can_read(p_business_id) then
    raise exception 'Not authorised for this business.' using errcode = '42501';
  end if;
  return query
    select e.content_id, max(e.content_type) as content_type,
           coalesce(max(a.title), max(n.title), max(ev.title), max(f.title)) as title,
           count(*) as view_count
    from analytics_events e
    left join business_articles a on e.content_type in ('news', 'offer', 'article') and a.id::text = e.content_id
    left join news_offers n       on e.content_type in ('news', 'offer') and n.id::text = e.content_id
    left join business_events ev  on e.content_type = 'event' and ev.id::text = e.content_id
    left join feature_articles f  on e.content_type = 'featured' and f.id::text = e.content_id
    where e.business_id = any (public.analytics_scope(p_business_id))
      and e.content_type in ('news', 'offer', 'article', 'event', 'featured')
      and e.created_at >= (p_from::timestamp at time zone 'Europe/London')
      and e.created_at <  ((p_to + 1)::timestamp at time zone 'Europe/London')
    group by e.content_id
    -- A deleted item has no title left: it is left out.
    having coalesce(max(a.title), max(n.title), max(ev.title), max(f.title)) is not null
    order by view_count desc;
end $$;

notify pgrst, 'reload schema';
