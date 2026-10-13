-- ═══════════════════════════════════════════════════════════════════════════
-- Accommodation module — Phase 6: property and company-wide analytics.
--
-- Views are recorded per business id (lib/trackView.js): a property's page,
-- and the articles, offers and events opened from it, count under the
-- property. The analytics functions now read a SCOPE instead of one id:
--
--   an accommodation company  → the company and every one of its properties
--                               (the company-wide figures)
--   anything else             → that one business (a property on its own,
--                               or any standard business — unchanged)
--
-- A company's users can read the company scope and each of its properties.
-- Same results as before for every standard business.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.analytics_scope(p_business_id text)
returns text[]
language sql stable security definer
set search_path = public
as $$
  select case
    when exists (select 1 from businesses where id = p_business_id and kind = 'accommodation_company')
      then array[p_business_id] || coalesce((select array_agg(id) from businesses where parent_id = p_business_id), '{}')
    else array[p_business_id]
  end
$$;

create or replace function public.analytics_can_read(p_business_id text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from business_users u
    where u.auth_user_id = auth.uid()
      and u.status = 'approved'
      and (
        u.business_id = p_business_id
        -- A company's users read each of its properties.
        or u.business_id = (select b.parent_id from businesses b
                            where b.id = p_business_id and b.kind = 'accommodation_property')
      )
  )
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
           coalesce(max(a.title), max(n.title), max(ev.title), max(f.title), 'Removed item') as title,
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
    order by view_count desc;
end $$;

notify pgrst, 'reload schema';
