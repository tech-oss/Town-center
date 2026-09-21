-- ═══════════════════════════════════════════════════════════════════════════
-- Two different kinds of date on a post, kept apart.
--
--   start_date / end_date  — INSTRUCTIONS TO THE SYSTEM. When the post goes
--                            live on the site and when it comes off again.
--                            Never shown to the public.
--
--   display_dates          — WHAT THE PUBLIC READS. Free text the business or
--                            admin types, e.g. "Offer only 1.11.26 to
--                            20.11.26". Optional; when it's empty the post
--                            simply shows no dates.
--
-- Until now the scheduling dates were printed on the article itself, so a post
-- scheduled 20/10/26–14/11/26 told readers the offer ran on those dates.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.news_offers       add column if not exists display_dates text;
alter table public.business_articles add column if not exists display_dates text;

-- news_offers already had a free-text `date_label`; carry anything set there
-- over so nothing that was deliberately written for readers is lost.
update public.news_offers
   set display_dates = date_label
 where display_dates is null and nullif(date_label, '') is not null;


-- ── Offers page view: carry the public dates, drop nothing else ───────────

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
  a.display_dates                                  as display_dates,
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
  n.display_dates,
  n.created_at::date::text
from promoted pr
join public.news_offers n on pr.content_kind = 'news_offer' and n.id::text = pr.content_id
left join public.business_listings l on l.business_id = n.business_id
where n.status = 'Published';

grant select on public.public_promoted_posts to anon, authenticated;

notify pgrst, 'reload schema';


-- ── Business posts view: same, so a business's own posts carry their public
--    dates through to its profile and the Offers page ──────────────────────

create or replace view public.public_business_articles
with (security_invoker = false) as
select a.id, a.business_id, a.title, a.type, a.date, a.start_date, a.end_date,
       a.display_dates, a.hero_image, a.thumbnail, a.body
from public.business_articles a
join public.businesses b on b.id = a.business_id
join public.business_subscriptions s on s.business_id = a.business_id
where a.status = 'Live'
  and b.status = 'Approved'
  and coalesce(b.visible, true)
  and s.plan = 'premium';

grant select on public.public_business_articles to anon, authenticated;

notify pgrst, 'reload schema';
