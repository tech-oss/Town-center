-- ═══════════════════════════════════════════════════════════════════════════
-- A Content Manager's own Terms of Use / Privacy Policy acceptance.
--
-- Until now the only terms acceptance the platform recorded was
-- business_subscriptions.terms_accepted_at — one row per BUSINESS, signed
-- once by whoever set up its plan. A Content Manager invited later, or one
-- who self-registers and is approved by the owner, never personally saw or
-- accepted anything — they just inherited the business's existing plan
-- terms. This gives each person their own record.
--
-- Approving a Content Manager is the business owner's job either way — by
-- inviting them directly, or by approving their join request — never
-- Maidenhead admin's (see admin_pending_counts_2026_09.sql, re-run alongside
-- this, and src/admin/pages/UsersPage.jsx / UserDetailPage.jsx). Admin still
-- sees every Content Manager's details either way.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.business_users
  add column if not exists terms_accepted_at timestamptz;

-- Backfill: everyone already active inherited the business's plan terms
-- under the old model, so they are not asked again retroactively.
update public.business_users
set terms_accepted_at = coalesce(terms_accepted_at, approved_at, requested_at, now())
where terms_accepted_at is null
  and status = 'approved';

-- Whether this login has ever had its own password set. Every existing way
-- of creating a business_users row already collects one up front (self
-- registration, an owner's claim or signup, admin's Register a User) — the
-- default backfills all of those as done. Only invite-content-manager leaves
-- it null: an invited email gets a Supabase Auth account with no password at
-- all, and the portal (a plain email+password login) needs to ask for one
-- once, on the invite link, before anything else.
alter table public.business_users
  add column if not exists password_set_at timestamptz not null default now();

-- The one write an invited Content Manager is allowed to make to their own
-- row for this — same narrow shape as accept_own_terms() below.
create or replace function public.mark_own_password_set()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.business_users
  set password_set_at = now()
  where auth_user_id = auth.uid()
    and password_set_at is null;
end;
$$;

grant execute on function public.mark_own_password_set() to authenticated;

-- The one write a Content Manager (or anyone) is allowed to make to their own
-- business_users row: recording that they personally read and accepted the
-- terms. Same narrow-RPC shape as complete_claim_onboarding — no general
-- UPDATE grant, so this can't be used to touch status or anything else.
create or replace function public.accept_own_terms()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.business_users
  set terms_accepted_at = now()
  where auth_user_id = auth.uid()
    and terms_accepted_at is null;
end;
$$;

grant execute on function public.accept_own_terms() to authenticated;

notify pgrst, 'reload schema';
