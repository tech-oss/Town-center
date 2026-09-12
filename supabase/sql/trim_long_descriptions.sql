-- ═══════════════════════════════════════════════════════════════════════════
-- business_listings_description_length caps description at 600 characters,
-- but was added `not valid`, so rows seeded before it were left over-length.
-- Postgres re-checks the constraint on any UPDATE to such a row, so those
-- businesses can't save anything at all from the dashboard, and admin can't
-- edit their content either.
--
-- This shortens them to fit: at the last complete sentence within 600
-- characters, or failing that at the last whole word, with an ellipsis so the
-- cut is visible rather than looking like a mid-sentence glitch.
--
-- Both editors already cap new input at 600, so this is a one-off.
-- NOT RUN YET. Run step 1, read it, then run step 2.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Step 1: preview — what each description would become, and what is lost ──
with trimmed as (
  select
    business_id,
    name,
    char_length(description) as current_length,
    coalesce(
      substring(left(description, 600) from '^.*[.!?]'),
      rtrim(substring(left(description, 599) from '^.*\s')) || '…'
    ) as new_description
  from public.business_listings
  where char_length(description) > 600
)
select business_id, name, current_length,
       char_length(new_description) as new_length,
       current_length - char_length(new_description) as characters_removed,
       right(new_description, 120) as ends_with,
       new_description
from trimmed
order by current_length desc;


-- ── Step 2: apply ───────────────────────────────────────────────────────────
-- update public.business_listings
-- set description = coalesce(
--       substring(left(description, 600) from '^.*[.!?]'),
--       rtrim(substring(left(description, 599) from '^.*\s')) || '…'
--     )
-- where char_length(description) > 600;

-- ── Step 3: enforce it from here on ────────────────────────────────────────
-- With every row inside the limit, the constraint can be validated so it is
-- trusted for future writes rather than only checked on touched rows.
-- alter table public.business_listings validate constraint business_listings_description_length;
