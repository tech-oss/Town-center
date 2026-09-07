-- ═══════════════════════════════════════════════════════════════════════════
-- Fixes a real regression: business signup has been broken for every new
-- owner since the "new registrations start pending, not pre-approved" fix.
--
-- That change made src/business/api/businessRegistration.js insert the
-- owner's business_users row with status: "pending" instead of "approved" —
-- but the RLS INSERT policy allowing an owner to self-register (created ad
-- hoc, outside any checked-in migration, same as is_approved_business_member)
-- still only permitted status = 'approved'. Every self-signup since then has
-- been rejected at the database with "new row violates row-level security
-- policy for table business_users" — confirmed live.
--
-- Replaces that policy with one that matches current behaviour: an owner may
-- self-register only as 'pending' (never insert themselves pre-approved),
-- mirroring the sibling policy that already correctly allows a Content
-- Manager to self-register as 'pending'.
-- ═══════════════════════════════════════════════════════════════════════════

drop policy if exists "self-register as approved owner" on public.business_users;

create policy "self-register as pending owner"
  on public.business_users for insert
  with check (
    auth_user_id = auth.uid()
    and role = 'Owner'
    and status = 'pending'
  );
