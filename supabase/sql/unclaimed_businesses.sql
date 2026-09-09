-- ═══════════════════════════════════════════════════════════════════════════
-- "Claim Your Business" needs to show only businesses nobody has an owner
-- claim on yet. That's a business_users lookup, but business_users is (and
-- should stay) locked down by RLS — it holds real people's emails, roles and
-- approval status, and the claim page runs signed out, on the anon key.
--
-- This function returns id + name only, for businesses with no Owner row in
-- 'pending' or 'approved' state. Nothing about who claimed the others, or
-- any other business_users column, is exposed — same shape as the existing
-- is_admin() / is_approved_business_member() security-definer helpers.
--
-- NOT RUN YET. Read side: src/business/hooks/useUserRegistry.js's
-- listUnclaimedBusinesses().
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.unclaimed_businesses()
returns table (id text, name text)
language sql
security definer
set search_path = public
stable
as $$
  select b.id, b.name
  from public.businesses b
  where not exists (
    select 1 from public.business_users bu
    where bu.business_id = b.id
      and bu.role = 'Owner'
      and bu.status in ('pending', 'approved')
  )
  order by b.name;
$$;

grant execute on function public.unclaimed_businesses() to anon, authenticated;


-- ── The same RLS gap breaks every "is this slot already taken?" check ──────
-- hasContentManagerSlotTaken (pre-existing) and the Owner-claim equivalent
-- both run a `select count(*) from business_users where ...` on the anon key
-- before/without a session. RLS silently returns 0 rows for a query like that
-- rather than an error, so both checks have always reported "not taken" no
-- matter what — a duplicate content-manager or owner claim was only ever
-- actually stopped by the unique-constraint error on insert, not by this
-- pre-check. One function covers both roles.
create or replace function public.business_role_slot_taken(target_business_id text, target_role text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.business_users
    where business_id = target_business_id
      and role = target_role
      and status in ('pending', 'approved')
  );
$$;

grant execute on function public.business_role_slot_taken(text, text) to anon, authenticated;
