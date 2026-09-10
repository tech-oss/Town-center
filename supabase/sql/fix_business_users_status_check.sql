-- ═══════════════════════════════════════════════════════════════════════════
-- Fixes a real bug: Suspend (and Reject) on the admin Users page have been
-- silently failing. business_users_status_check — created ad hoc, outside any
-- checked-in migration, same as several other constraints on this table —
-- only allows ('pending', 'approved', 'declined'). Admin's suspendUser writes
-- 'suspended' and rejectUser writes 'rejected', both of which the database
-- rejects with a check-constraint violation (23514). Confirmed live: a direct
-- update to 'suspended' or 'rejected' errors; 'declined' succeeds.
--
-- 'declined' is a distinct, legitimate value — it's what a business owner
-- writes when declining a Content Manager's join request
-- (business-dashboard's useUserRegistry.js declineRequest), not something
-- admin uses. It stays in the allowed set alongside the values admin needs.
--
-- NOT RUN YET.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.business_users
  drop constraint if exists business_users_status_check;

alter table public.business_users
  add constraint business_users_status_check
  check (status in ('pending', 'approved', 'rejected', 'suspended', 'declined'));
