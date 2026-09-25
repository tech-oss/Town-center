-- ═══════════════════════════════════════════════════════════════════════════
-- What Featured Business actually gets you, spelled out.
--
-- "Your business shown first in its category listings" was the whole
-- description on the Subscriptions & Billing purchase card. It undersold it
-- (no mention of the site's Featured dropdown or the app) and oversold it
-- ("shown first" isn't quite true — the slot guarantees a place in the top
-- 10, not necessarily position 1, since up to 10 businesses can hold it at
-- once per capacity).
--
-- homepage_slot_types.description is a single text column rendered as a
-- plain paragraph today; the business-dashboard side (HomepagePromotions.jsx)
-- now renders a description containing newlines as a bulleted list instead,
-- so this can be the actual list the wording calls for rather than one long
-- sentence.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

update public.homepage_slot_types
set description = 'Business name in the Featured dropdown menu on website
Guaranteed placement within the Top 10 listings on the relevant category page on the web and app
Featured placement indicator'
where key = 'featured_business';

notify pgrst, 'reload schema';

select key, label, description from public.homepage_slot_types where key = 'featured_business';
