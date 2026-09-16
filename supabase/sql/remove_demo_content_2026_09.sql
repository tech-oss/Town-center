-- ═══════════════════════════════════════════════════════════════════════════
-- Removes the seeded demo content from the database.
--
--   1. The 4 demo featured stories (COCOBA, Jetts, The Fat Duck, Esquires).
--      "Did Maidenhead Inspire The Wind in the Willows?" is kept.
--   2. The 11 demo What's On events — the ones with no business attached.
--      Events businesses submitted (Flower show, Sunday Market, …) are kept.
--
-- Neighbourhood guides are deliberately left alone.
-- Demo business listings, and the demo map pins, live in the site's code and
-- are removed there, not here.
-- ═══════════════════════════════════════════════════════════════════════════

delete from public.feature_articles
where slug in (
  'cocoba-chocolate-cafe-story',
  'jetts-maidenhead',
  'the-fat-duck',
  'esquires-coffee-maidenhead'
);

delete from public.business_events
where business_id is null;
