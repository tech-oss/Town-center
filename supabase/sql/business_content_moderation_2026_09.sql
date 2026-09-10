-- ═══════════════════════════════════════════════════════════════════════════
-- Makes the content approval queue actually able to show what changed.
--
-- business_listings has always overwritten its own columns in place on save —
-- approval_status flips a section to "Pending Approval", but the old value is
-- already gone by the time admin looks at it. approvals.js's toItem() says as
-- much in its own comment: "the business portal overwrites the live row in
-- place, so there is no stored 'before' to diff against — show the submitted
-- values instead." That's the gap this closes.
--
-- pending_snapshot: a map of section -> {field: old value}, captured by
-- saveBusinessListing() the moment BEFORE it overwrites those columns. Once
-- admin approves, the snapshot for that section is cleared (no longer
-- needed). Once admin rejects, the live columns are reverted to the
-- snapshot's values — previously a rejection just flipped a status flag and
-- left the declined content live indefinitely, which meant moderation didn't
-- actually gate anything.
--
-- edited_by: a map of section -> 'business' | 'admin'. Admin's own content
-- editor writes directly to live columns (admin approving their own edit is
-- meaningless) and tags the section 'admin' so the approval queue can filter
-- for it as "Auto Published" — visible for audit, no action needed.
--
-- Character limits on name/tagline/description are added here too, since
-- they're a property of the data, not just the form. Calibrated against
-- COCOBA Chocolate Café's real content on the live site (main branch,
-- src/Data/pages.js): name "COCOBA Chocolate Café" is 22 chars, its tagline
-- "Artisan chocolates & coffee" is 28 — limits give real headroom above that
-- rather than being tuned to exactly fit one example. The live site's
-- 5-paragraph Cocoba feature is bespoke editorial copy on that one page, not
-- what a business's own description field holds; description's limit is set
-- for a solid couple of paragraphs, not that entire feature.
--
-- NOT RUN YET.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.business_listings
  add column if not exists pending_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists edited_by         jsonb not null default '{}'::jsonb;

-- NOT VALID: two live rows already exceed these (one business apparently
-- pasted a full page of text into tagline and description). NOT VALID means
-- the constraint gates every INSERT and UPDATE from now on without requiring
-- — or failing on — a validation pass over existing data. Those two rows are
-- simply grandfathered until their own next edit, rather than being
-- truncated here.
alter table public.business_listings
  drop constraint if exists business_listings_name_length,
  drop constraint if exists business_listings_tagline_length,
  drop constraint if exists business_listings_description_length;

alter table public.business_listings
  add constraint business_listings_name_length        check (char_length(name) <= 60) not valid,
  add constraint business_listings_tagline_length      check (tagline is null or char_length(tagline) <= 80) not valid,
  add constraint business_listings_description_length  check (description is null or char_length(description) <= 600) not valid;
