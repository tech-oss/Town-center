-- ═══════════════════════════════════════════════════════════════════════════
-- Review moderation. business_reviews had no moderation state at all, so an
-- abusive or fake review could only be deleted outright. Hiding keeps the row
-- on record (reversible, and an audit trail) while pulling it off the listing.
--
-- NOT RUN YET.
-- Read/write side lives in src/api/admin/contentModeration.js.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.business_reviews
  add column if not exists status          text not null default 'Visible'
    check (status in ('Visible', 'Hidden')),
  add column if not exists moderation_note text;
