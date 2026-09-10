-- ═══════════════════════════════════════════════════════════════════════════
-- Tracks when a subscription's current state was granted directly by admin
-- (a comp trial or free full access) rather than being a real paid plan —
-- there was previously no way to tell the two apart. grantTrial and
-- grantFullAccess (src/api/admin/subscriptions.js) now set this.
--
-- NOT RUN YET.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.business_subscriptions
  add column if not exists granted_by_admin text check (granted_by_admin in ('trial', 'full')),
  add column if not exists granted_at        timestamptz;
