-- ═══════════════════════════════════════════════════════════════════════════
-- Raise the database's text ceilings on business_listings.
--
-- The limits that matter to the product are the ones the dashboard enforces:
-- 60 characters for a name, 80 for a tagline, 600 for a description, counted
-- in the editor as you type. Those stay exactly as they are.
--
-- The database constraints were set to the same numbers, which made them a
-- second copy of the product rule rather than a backstop against abuse. They
-- were added `not valid`, so rows written before them were grandfathered —
-- but a CHECK is re-evaluated over the whole row on any UPDATE, so a
-- grandfathered row could not be edited at all. Changing one field failed on
-- a different field's length.
--
-- One row is in that state: biz_my-bike-shop-xtvfe, whose description is
-- 1,142 characters and tagline 191. It also holds a 486 KB logo stored as
-- base64 inside the row, and that logo cannot be moved to Storage while any
-- update to the row is refused.
--
-- The ceilings become what they should have been: generous limits that stop
-- something absurd reaching the database, well clear of what the editor
-- allows. Both are validated afterwards, so every existing row is known to
-- be inside them and the constraints are trusted from here on.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.business_listings
  drop constraint if exists business_listings_name_length,
  drop constraint if exists business_listings_tagline_length,
  drop constraint if exists business_listings_description_length;

alter table public.business_listings
  add constraint business_listings_name_length
    check (char_length(name) <= 200),
  add constraint business_listings_tagline_length
    check (tagline is null or char_length(tagline) <= 400),
  add constraint business_listings_description_length
    check (description is null or char_length(description) <= 4000);

-- Added without `not valid`, so Postgres checks every existing row as it
-- creates them. If this statement succeeds, nothing is grandfathered any
-- more and no row is stuck unable to be edited.

notify pgrst, 'reload schema';

-- What is left over the editor's own limits, for reference. These are fine in
-- the database; they simply came from somewhere other than the dashboard.
select business_id,
       char_length(name)        as name_chars,
       char_length(tagline)     as tagline_chars,
       char_length(description) as description_chars
from public.business_listings
where char_length(name) > 60
   or char_length(tagline) > 80
   or char_length(description) > 600
order by description_chars desc nulls last;
