-- ═══════════════════════════════════════════════════════════════════════════
-- Clears the Featured Business promotions nobody asked for.
--
-- 24 of the 25 live Featured Business bookings were never paid for:
--   • 14 were created by re-running homepage_slot_bookings_2026_09.sql, which
--     copied the retired businesses.featured column into live bookings. That
--     copy has been removed from the file, so it cannot happen again.
--   • 10 came from admin's own screens — the "Feature this business" box on
--     the registration form (now removed) and the "☆ Feature" button that sat
--     immediately beside "✓ Approve" (now approved-only and confirmed).
--
-- Only Service test 2's booking was actually bought, and it is kept.
--
-- Cancelling rather than deleting keeps the history, and the slots free up
-- immediately for businesses who pay for them.
-- ═══════════════════════════════════════════════════════════════════════════

update public.homepage_placements
   set status = 'cancelled',
       updated_at = now()
 where slot_type = 'featured_business'
   and status <> 'cancelled'
   and ends_at > now()
   and paid_at is null;

-- The retired flag behind the bulk copy, so nothing can read it as current.
update public.businesses set featured = false where featured is true;

-- What's left featured (should be paid bookings only).
select b.name, p.source, p.paid_at is not null as paid,
       to_char(p.ends_at at time zone 'Europe/London', 'DD/MM/YYYY HH24:MI') as until
from public.homepage_placements p
join public.businesses b on b.id = p.business_id
where p.slot_type = 'featured_business' and p.status <> 'cancelled' and p.ends_at > now()
order by p.ends_at;
