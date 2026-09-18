-- ═══════════════════════════════════════════════════════════════════════════
-- Every post that has been on the homepage (In the Spotlight or Featured
-- Article), for the Offers page — the site's main library.
--
-- public_business_articles only lists Visibility Plan businesses' posts, and
-- admin posts are read from news_offers, so a post promoted for a Free
-- business (or one whose plan later lapsed) could be on the homepage but
-- missing from Offers. This view lists every live post that has had an
-- approved Spotlight / Featured Article booking, whatever the plan.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace view public.public_promoted_posts
with (security_invoker = false) as
with promoted as (
  select distinct p.content_kind, p.content_id
  from public.homepage_placements p
  where p.status = 'approved'
    and p.slot_type in ('spotlight', 'featured_article')
    and p.content_kind in ('business_article', 'news_offer')
)
select
  'business_article'::text                         as kind,
  a.id::text                                       as id,
  'live-' || a.id::text                            as slug,
  a.business_id,
  coalesce(nullif(l.name, ''), b.name)             as business_name,
  l.business_type,
  a.title,
  case when lower(coalesce(a.type, '')) = 'offer' then 'Offer' else 'News' end as type,
  left(regexp_replace(coalesce(a.body::text, ''), '\s+', ' ', 'g'), 180) as excerpt,
  a.body::text                                     as body,
  coalesce(a.hero_image, a.thumbnail)              as image,
  a.start_date::text                               as start_date,
  a.end_date::text                                 as end_date,
  a.date::text                                     as published_on
from promoted pr
join public.business_articles a on pr.content_kind = 'business_article' and a.id::text = pr.content_id
join public.businesses b on b.id = a.business_id
left join public.business_listings l on l.business_id = a.business_id
where a.status = 'Live'
  and b.status = 'Approved'
  and coalesce(b.visible, true)
union all
select
  'news_offer'::text,
  n.id::text,
  n.slug,
  n.business_id,
  coalesce(nullif(l.name, ''), n.business_name),
  l.business_type,
  n.title,
  case when n.type = 'offer' or n.category = 'Offer' then 'Offer' else 'News' end,
  n.excerpt::text,
  n.body::text,
  n.image,
  n.start_date::text,
  n.end_date::text,
  n.created_at::date::text
from promoted pr
join public.news_offers n on pr.content_kind = 'news_offer' and n.id::text = pr.content_id
left join public.business_listings l on l.business_id = n.business_id
where n.status = 'Published';

grant select on public.public_promoted_posts to anon, authenticated;

notify pgrst, 'reload schema';
