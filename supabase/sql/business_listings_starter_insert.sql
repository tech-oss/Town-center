-- ═══════════════════════════════════════════════════════════════════════════
-- Self-signup's Review step ("Confirm & Submit") fails with "new row violates
-- row-level security policy for table 'business_listings'" for every new
-- registration. Root cause: the INSERT policy on business_listings
-- ("owner creates their starter listing") gates on is_approved_owner(), which
-- requires business_users.status = 'approved'. Self-signup inserts
-- business_users with status = 'pending' (fixed earlier — see this file's
-- sibling migrations from the same investigation), so the very next insert in
-- the same signup flow — the starter listing row — has been impossible ever
-- since, for every self-registered business. This was never caught because
-- that earlier fix was verified by reproducing just the business_users
-- insert, not the full multi-table signup transaction.
--
-- Fix: the starter listing only needs to prove the caller OWNS this business
-- (a business_users row with role = 'Owner', any status) — not that it's
-- already been approved. Approval still gates every read/update via the
-- existing is_approved_business_member()-backed policies below this one,
-- which are unchanged; this only affects the one-time initial insert.
--
-- NOT RUN YET.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.is_business_owner(target_business_id text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.business_users
    where business_id = target_business_id
      and auth_user_id = auth.uid()
      and role = 'Owner'
  );
$$;

drop policy if exists "owner creates their starter listing" on public.business_listings;

create policy "owner creates their starter listing"
on public.business_listings
for insert
with check (public.is_business_owner(business_id));
