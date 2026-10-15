-- ═══════════════════════════════════════════════════════════════════════════
-- Accommodation: count a company's posts per property in Analytics.
--
-- A management company's articles, news, offers, events and Featured
-- Articles appear on every one of its property pages. Opened from a property
-- page, the site now records the view under that property (lib/trackView.js
-- `via`), so a property's Analytics shows how its visitors read them, and the
-- company-wide figures (analytics_scope: the company plus its properties)
-- still add everything up.
--
-- record_view only accepted content owned by the business the view was
-- recorded for, so every such view was dropped — the per-property content
-- figures stayed at 0. It now also accepts a property recording a view of
-- its own company's content. Everything else is unchanged.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.record_view(p_business_id text, p_content_type text, p_content_id text, p_source text, p_session_id text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_type text := lower(coalesce(p_content_type, ''));
  -- The businesses whose content a view recorded for p_business_id may be
  -- of: itself, and for an accommodation property its company.
  v_owners text[];
begin
  if p_business_id is null or p_content_id is null
     or v_type not in ('profile', 'news', 'offer', 'event', 'featured')
     or p_source not in ('web', 'app') then
    return;
  end if;

  select array_remove(array[b.id, case when b.kind = 'accommodation_property' then b.parent_id end], null)
    into v_owners
    from businesses b
   where b.id = p_business_id;
  if v_owners is null then return; end if;

  if v_type = 'profile' then
    if p_content_id <> p_business_id or not exists (
      select 1 from businesses b where b.id = p_business_id and b.status = 'Approved'
    ) then return; end if;
  elsif v_type = 'event' then
    if not exists (select 1 from business_events e
      where e.id::text = p_content_id and e.business_id = any (v_owners) and e.status = 'Live'
    ) then return; end if;
  elsif v_type = 'featured' then
    if not exists (select 1 from feature_articles f
      where f.id::text = p_content_id and f.business_id = any (v_owners) and f.status = 'Live'
    ) then return; end if;
  else
    if not exists (select 1 from business_articles a
      where a.id::text = p_content_id and a.business_id = any (v_owners) and a.status = 'Live'
    ) and not exists (select 1 from news_offers n
      where n.id::text = p_content_id and n.business_id = any (v_owners) and n.status = 'Published'
    ) then return; end if;
  end if;

  insert into analytics_events (business_id, content_type, content_id, event_type, source, session_id)
  values (p_business_id, v_type, p_content_id, 'view', p_source, nullif(p_session_id, ''));
end $function$;
