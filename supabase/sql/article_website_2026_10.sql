-- ═══════════════════════════════════════════════════════════════════════════
-- News & offer articles get an optional website link, like events, guides
-- and feature articles have: a "Visit website" button on the article page.
--
--   business_articles.website   a business's own news/offer (business portal)
--   news_offers.website         a post admin writes about a business
--
-- Both public views gain the column at the end (nothing else changes).
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.business_articles add column if not exists website text;
alter table public.news_offers add column if not exists website text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'business_articles_website_len') then
    alter table public.business_articles add constraint business_articles_website_len check (website is null or length(website) <= 500);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'news_offers_website_len') then
    alter table public.news_offers add constraint news_offers_website_len check (website is null or length(website) <= 500);
  end if;
end $$;

create or replace view public.public_business_articles
with (security_invoker = false) as
select a.id, a.business_id, a.title, a.type, a.date, a.start_date, a.end_date,
       a.display_dates, a.hero_image, a.thumbnail, a.body, a.website
from public.business_articles a
join public.businesses b on b.id = a.business_id
join public.business_subscriptions s on s.business_id = a.business_id
where a.status = 'Live'
  and b.status = 'Approved'
  and coalesce(b.visible, true)
  and s.plan = 'premium';
grant select on public.public_business_articles to anon, authenticated;

create or replace view public.public_promoted_posts
with (security_invoker = false) as
 WITH promoted AS (
         SELECT DISTINCT p.content_kind,
            p.content_id
           FROM homepage_placements p
          WHERE p.status = 'approved'::text AND (p.slot_type = ANY (ARRAY['spotlight'::text, 'featured_article'::text])) AND (p.content_kind = ANY (ARRAY['business_article'::text, 'news_offer'::text]))
        )
 SELECT 'business_article'::text AS kind,
    a.id::text AS id,
    'live-'::text || a.id::text AS slug,
    a.business_id,
    COALESCE(NULLIF(l.name, ''::text), b.name) AS business_name,
    l.business_type,
    a.title,
        CASE
            WHEN lower(COALESCE(a.type, ''::text)) = 'offer'::text THEN 'Offer'::text
            ELSE 'News'::text
        END AS type,
    "left"(regexp_replace(COALESCE(a.body, ''::text), '\s+'::text, ' '::text, 'g'::text), 180) AS excerpt,
    a.body,
    COALESCE(a.hero_image, a.thumbnail) AS image,
    a.start_date::text AS start_date,
    a.end_date::text AS end_date,
    a.display_dates,
    a.date::text AS published_on,
    a.website
   FROM promoted pr
     JOIN business_articles a ON pr.content_kind = 'business_article'::text AND a.id::text = pr.content_id
     JOIN businesses b ON b.id = a.business_id
     LEFT JOIN business_listings l ON l.business_id = a.business_id
  WHERE a.status = 'Live'::text AND b.status = 'Approved'::text AND COALESCE(b.visible, true)
UNION ALL
 SELECT 'news_offer'::text AS kind,
    n.id::text AS id,
    n.slug,
    n.business_id,
    COALESCE(NULLIF(l.name, ''::text), n.business_name) AS business_name,
    l.business_type,
    n.title,
        CASE
            WHEN n.type = 'offer'::text OR n.category = 'Offer'::text THEN 'Offer'::text
            ELSE 'News'::text
        END AS type,
    n.excerpt,
    n.body,
    n.image,
    n.start_date::text AS start_date,
    n.end_date::text AS end_date,
    n.display_dates,
    n.created_at::date::text AS published_on,
    n.website
   FROM promoted pr
     JOIN news_offers n ON pr.content_kind = 'news_offer'::text AND n.id::text = pr.content_id
     LEFT JOIN business_listings l ON l.business_id = n.business_id
  WHERE n.status = 'Published'::text;
grant select on public.public_promoted_posts to anon, authenticated;

notify pgrst, 'reload schema';
