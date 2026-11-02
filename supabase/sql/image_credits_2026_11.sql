-- ═══════════════════════════════════════════════════════════════════════════
-- Image credits: an optional line of text under an article or guide picture
-- ("Photo: Jane Smith"). Shown only when filled in.
--
-- Main pictures get a column; pictures inside an article's or guide's
-- sections keep their credit next to the picture in the existing jsonb
-- (feature_articles.body[].imageCredit, neighbourhood_guides.content).
-- A guide's main picture credit is content.heroImageCredit.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.feature_articles  add column if not exists hero_image_credit text;
alter table public.business_articles add column if not exists hero_image_credit text;
alter table public.news_offers       add column if not exists image_credit text;

-- The public view of business posts gains the credit (added at the end, as
-- CREATE OR REPLACE VIEW requires).
create or replace view public.public_business_articles as
 SELECT a.id,
    a.business_id,
    a.title,
    a.type,
    a.date,
    a.start_date,
    a.end_date,
    a.display_dates,
    a.hero_image,
    a.thumbnail,
    a.body,
    a.website,
    a.hero_image_credit
   FROM business_articles a
     JOIN businesses b ON b.id = a.business_id
     JOIN business_subscriptions s ON s.business_id = a.business_id
  WHERE a.status = 'Live'::text AND b.status = 'Approved'::text AND COALESCE(b.visible, true) AND s.plan = 'premium'::text;
