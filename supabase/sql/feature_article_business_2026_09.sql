-- ═══════════════════════════════════════════════════════════════════════════
-- A featured story can belong to a business.
--
-- Admin writes homepage Featured Stories, What's On events and News & Offers
-- posts. Events and posts could already be attached to a registered business;
-- stories could not, so a story admin wrote about a business never reached
-- that business's profile or its analytics.
--
-- Optional: with no business attached the story is a town story, exactly as
-- before.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.feature_articles
  add column if not exists business_id text references public.businesses(id) on delete set null;

create index if not exists feature_articles_business_idx
  on public.feature_articles (business_id);

notify pgrst, 'reload schema';
