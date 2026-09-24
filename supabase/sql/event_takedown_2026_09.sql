-- ═══════════════════════════════════════════════════════════════════════════
-- An event admin has taken off the site.
--
-- business_events.status allowed: Draft, Pending Approval, Live, Hidden and
-- Rejected. None of those says "this was live, and admin pulled it":
--
--   • Rejected is for something that never reached the site. Using it on a
--     live event would tell the business its submission was turned down,
--     months after it was approved.
--
--   • Hidden already belongs to the business. It is what its own Deactivate
--     button sets, and its dashboard shows a Make Live button beside it — so
--     an event admin hid as Hidden could be put straight back by the business
--     with one click, with no record that admin had decided otherwise.
--
-- 'Removed' is admin's. The business dashboard already knows the word: its
-- events list renders "Taken down: <reason>" for it and offers no button to
-- undo it. That branch has simply been unreachable, because the constraint
-- refused the value.
--
-- Nothing is rewritten — this only widens what the column will accept.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.business_events
  drop constraint if exists business_events_status_check;

alter table public.business_events
  add constraint business_events_status_check
    check (status in ('Draft', 'Pending Approval', 'Live', 'Hidden', 'Rejected', 'Removed'));

-- Added without `not valid`, so every existing row is checked as the
-- constraint is created. If this statement succeeds, nothing is grandfathered.

notify pgrst, 'reload schema';

-- What is on the table now, for reference.
select status, count(*) as events
from public.business_events
group by status
order by events desc;
