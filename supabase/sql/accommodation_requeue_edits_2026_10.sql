-- ═══════════════════════════════════════════════════════════════════════════
-- Accommodation: send property edits that skipped review to the approval queue.
--
-- The property editor saved a live property's changes with their "before"
-- snapshot but left the section marked "Up to Date" (the page passed the
-- status it had loaded, and the save kept it). The business was told the
-- change was submitted; admin never saw it, and the site showed it as
-- approved. Fixed in business-dashboard's saveBusinessListing.
--
-- A section holding a snapshot while not Pending Approval is exactly that
-- case (approval deletes the snapshot; auto-published saves never write one),
-- so each one is set back to Pending Approval: it appears in the Approval
-- Queue with its before/after, and the site shows the snapshot until admin
-- approves. Only accommodation properties were affected.
--
-- Except where the snapshot is older than the property's own approval: a
-- property is approved as a whole, and these two had sections whose
-- snapshot predates that (an empty gallery, no description). Queuing them
-- would blank the live page and show admin a meaningless "before", so their
-- stale snapshots are dropped instead (what an approval does) and the
-- content stays as it is.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

update public.business_listings l
   set pending_snapshot = (
         select coalesce(jsonb_object_agg(k, v), '{}'::jsonb)
           from jsonb_each(coalesce(l.pending_snapshot, '{}'::jsonb)) e(k, v)
          where coalesce(l.approval_status ->> k, '') = 'Pending Approval')
 where l.business_id in ('biz_bray-cottage-c86a3', 'biz_windsor-house-b9805');

update public.business_listings l
   set approval_status = coalesce(l.approval_status, '{}'::jsonb) || s.pending
  from (
    select l2.business_id, jsonb_object_agg(k.sec, 'Pending Approval') as pending
      from public.business_listings l2
      join public.businesses b on b.id = l2.business_id
      cross join lateral jsonb_object_keys(coalesce(l2.pending_snapshot, '{}'::jsonb)) as k(sec)
     where b.kind = 'accommodation_property'
       and b.property_state = 'live'
       and jsonb_typeof(l2.pending_snapshot -> k.sec) = 'object'
       and coalesce(l2.approval_status ->> k.sec, '') <> 'Pending Approval'
       and l2.edited_by ? k.sec
     group by l2.business_id
  ) s
 where l.business_id = s.business_id;
