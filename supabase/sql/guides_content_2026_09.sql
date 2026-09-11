-- ═══════════════════════════════════════════════════════════════════════════
-- Neighbourhood guide page content.
--
-- neighbourhood_guides held a single flat `body text` column, while the public
-- guide page (/guides/:slug) renders a nested document: an intro, a run of
-- place sections each with their own image, address and copy, plus optional
-- "more spots", cheat sheet, combinations and closing panels. None of that had
-- anywhere to live, so the admin editor could not touch what the site shows.
--
-- `content` holds that document as jsonb — the same approach site_content uses
-- for the Getting Here and The Future pages — keeping the existing columns for
-- identity and listing (slug, title, hero_image, thumbnail, status, sort_order).
-- `thumbnail` is the card image the listing grid already expects.
--
-- The /guides index page's own chrome (eyebrow, title, subtitle, hero crops)
-- is page furniture rather than a guide, so it lives in a site_content row
-- keyed "guides-index", seeded by supabase/seed/seed_guides.js.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.neighbourhood_guides
  add column if not exists content jsonb not null default '{}'::jsonb;
