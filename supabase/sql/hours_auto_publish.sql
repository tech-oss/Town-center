-- ═══════════════════════════════════════════════════════════════════════════
-- Opening hours no longer need admin approval — a business's saved hours go
-- live immediately (see AUTO_PUBLISH_SECTIONS in business-dashboard's
-- src/business/api/businessListing.js).
--
-- The live columns already hold whatever the business last saved, so any
-- hours section still sitting at "Pending Approval" is simply a queue item
-- with nothing left to decide. This clears those states and drops the
-- now-pointless before/after snapshot for them.
--
-- Code on both branches already ignores a pending 'hours' state, so this is
-- tidy-up rather than a prerequisite. NOT RUN YET. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

update public.business_listings
set approval_status = jsonb_set(approval_status, '{hours}', '"Up to Date"'::jsonb),
    pending_snapshot = pending_snapshot - 'hours',
    rejection_reason = rejection_reason - 'hours'
where approval_status->>'hours' in ('Pending Approval', 'Changes Rejected');
