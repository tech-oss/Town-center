-- ═══════════════════════════════════════════════════════════════════════════
-- Neighbourhood guide categories: the canonical ten (see
-- src/Data/guideCategories.js). Only one stored value differs from the new
-- list — "Family" is now "Family & Kids" — so that's all this renames.
--
-- The category lives inside the row's `content` jsonb, which is why this is a
-- jsonb_set rather than a plain column update.
--
-- NOT RUN YET. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

update public.neighbourhood_guides
set content = jsonb_set(content, '{category}', '"Family & Kids"'::jsonb)
where content->>'category' = 'Family';

-- Anything still outside the canonical list after this needs a human
-- decision — this lists them rather than guessing.
select id, title, content->>'category' as category
from public.neighbourhood_guides
where content->>'category' is not null
  and content->>'category' not in (
    'History & Heritage', 'Food & Drink', 'Things to Do',
    'Hidden Gems & Local Favourites', 'Outdoors & Walks', 'Shopping & Retail',
    'Family & Kids', 'Health, Fitness & Wellbeing', 'Local Life & Community',
    'Seasonal & Special Occasions'
  );
