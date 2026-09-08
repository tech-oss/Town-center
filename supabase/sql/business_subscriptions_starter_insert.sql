-- ═══════════════════════════════════════════════════════════════════════════
-- Same bug as business_listings_starter_insert.sql, one table further down
-- the self-signup transaction: "owner creates their subscription" on
-- business_subscriptions also gates on is_approved_owner(), which requires
-- business_users.status = 'approved'. Self-signup's owner row is inserted as
-- 'pending', so the starter subscription row (created in the same signup
-- flow, right after the listing) has been rejected too.
--
-- Same fix: the starter subscription only needs to prove the caller OWNS
-- this business, not that they're already approved. Every other
-- business_subscriptions policy (read, update) is unchanged and still
-- requires full approval via is_approved_business_member()/is_approved_owner().
--
-- Depends on is_business_owner() from business_listings_starter_insert.sql
-- (same migration set, run first).
--
-- NOT RUN YET.
-- ═══════════════════════════════════════════════════════════════════════════

drop policy if exists "owner creates their subscription" on public.business_subscriptions;

create policy "owner creates their subscription"
on public.business_subscriptions
for insert
with check (public.is_business_owner(business_id));
