-- ═══════════════════════════════════════════════════════════════════════════
-- Business login/access requires two independent approvals: the person's own
-- business_users.status, and the business's own businesses.status. Admin
-- grants each separately (Business Registrations vs. Users) — approving the
-- business does not approve its owner, and vice versa. Previously
-- is_approved_business_member() only checked the person's own status, so a
-- business owner whose business was Suspended/Rejected — but whose own
-- account row was still 'approved' from before — could still read/write
-- everything the function gates. This closes that gap at the database level,
-- not just in the client's own login check (src/business/hooks/useBusinessAuth.js).
--
-- NOT RUN YET.
-- Depends on businesses.status existing (supabase/sql/business_admin_status.sql,
-- admin-panel branch) and is_approved_business_member() already existing
-- (created ad hoc, same as before — see supabase/sql/analytics_events.sql's
-- header note on admin-panel for how that was discovered).
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.is_approved_business_member(target_business_id text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.business_users bu
    join public.businesses b on b.id = bu.business_id
    where bu.business_id = target_business_id
      and bu.auth_user_id = auth.uid()
      and bu.status = 'approved'
      and b.status = 'Approved'
  );
$$;
