-- ═══════════════════════════════════════════════════════════════════════════
-- business_listings has three length constraints — name <= 60, tagline <= 80,
-- description <= 600 — all added `not valid`, so rows seeded before them were
-- left over-length. Postgres re-checks on any UPDATE to such a row, so those
-- businesses can't save anything at all from the dashboard, and admin can't
-- edit their content either.
--
-- This shortens all three to fit: at the last complete sentence within the
-- limit where there is one, otherwise at the last whole word with an ellipsis
-- so the cut is visible rather than looking like a mid-sentence glitch.
--
-- Every editor already caps new input at these limits, so this is a one-off.
-- NOT RUN YET. Run step 1, read it, then run step 2 and step 3.
-- ═══════════════════════════════════════════════════════════════════════════

-- Longest prefix of `value` within `limit` that ends a sentence; failing
-- that, the last whole word plus an ellipsis.
create or replace function public.trim_to_length(value text, max_len int)
returns text
language sql
immutable
as $$
  select case
    when value is null or char_length(value) <= max_len then value
    else coalesce(
      substring(left(value, max_len) from '^.*[.!?]'),
      rtrim(substring(left(value, max_len - 1) from '^.*\s')) || '…',
      left(value, max_len - 1) || '…'
    )
  end;
$$;

-- ── Step 1: preview — what each field becomes, and what is lost ─────────────
select business_id, name,
       char_length(name) as name_len,
       char_length(tagline) as tagline_len,
       char_length(description) as description_len,
       public.trim_to_length(name, 60) as new_name,
       public.trim_to_length(tagline, 80) as new_tagline,
       public.trim_to_length(description, 600) as new_description
from public.business_listings
where char_length(name) > 60
   or char_length(tagline) > 80
   or char_length(description) > 600
order by business_id;


-- ── Step 2: apply ───────────────────────────────────────────────────────────
-- update public.business_listings
-- set name        = public.trim_to_length(name, 60),
--     tagline     = public.trim_to_length(tagline, 80),
--     description = public.trim_to_length(description, 600)
-- where char_length(name) > 60
--    or char_length(tagline) > 80
--    or char_length(description) > 600;


-- ── Step 3: enforce from here on ───────────────────────────────────────────
-- With every row inside the limits, the constraints can be validated so they
-- are trusted for future writes rather than only checked on touched rows.
-- alter table public.business_listings validate constraint business_listings_name_length;
-- alter table public.business_listings validate constraint business_listings_tagline_length;
-- alter table public.business_listings validate constraint business_listings_description_length;
