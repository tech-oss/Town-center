-- ═══════════════════════════════════════════════════════════════════════════
-- Stripe billing for the Premium plan.
--
-- Payment happens on Stripe Checkout; Stripe then calls the stripe-webhook
-- Edge Function, which is the ONLY thing (besides admin) that can put a
-- business on a paid plan. Until now a business could set its own plan and
-- fee straight from the browser — the table let owners update their row, and
-- insert one with any plan at signup — so Premium could be taken for free.
--
--   1. Stripe identifiers on business_subscriptions and business_payments.
--   2. stripe_events: webhook deliveries already processed (Stripe retries).
--   3. Businesses can read their subscription and payments, never write the
--      plan. Signup may only create a Free row.
--
-- Run AFTER subscription_plans_2026_09.sql (admin-panel).
-- NOT RUN YET.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Stripe identifiers ───────────────────────────────────────────────────

alter table public.business_subscriptions
  add column if not exists stripe_customer_id     text unique,
  add column if not exists stripe_subscription_id text unique,
  add column if not exists current_period_end     timestamptz,
  add column if not exists cancel_at_period_end   boolean not null default false,
  add column if not exists updated_at             timestamptz;

alter table public.business_payments
  add column if not exists stripe_invoice_id text unique,
  add column if not exists invoice_url       text,
  add column if not exists invoice_pdf       text;


-- ── 2. Webhook idempotency ─────────────────────────────────────────────────
-- No policies: only the service role (the webhook) touches this table.

create table if not exists public.stripe_events (
  id          text primary key,
  type        text not null,
  received_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;


-- ── 3. Lock down who can set a plan ────────────────────────────────────────
-- The owner policies were created by hand, outside the repo, so their names
-- aren't known here: drop every non-admin write policy on both tables, then
-- recreate exactly what a business needs.

do $$
declare p record;
begin
  for p in
    select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('business_subscriptions', 'business_payments')
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
      and policyname not in ('admins manage subscriptions')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- Reading stays open to the business's approved members.
drop policy if exists "business members read their subscription" on public.business_subscriptions;
create policy "business members read their subscription"
  on public.business_subscriptions for select
  using (public.is_approved_business_member(business_id));

drop policy if exists "business members read their payments" on public.business_payments;
create policy "business members read their payments"
  on public.business_payments for select
  using (public.is_approved_business_member(business_id));

-- Self-signup still creates the starter row — but only a Free one.
create policy "owner creates their subscription"
  on public.business_subscriptions for insert
  with check (
    public.is_business_owner(business_id)
    and plan = 'free'
    and coalesce(monthly_fee, 0) = 0
  );

-- Admin keeps full control of payments too (comp grants, corrections).
drop policy if exists "admins manage payments" on public.business_payments;
create policy "admins manage payments"
  on public.business_payments for all
  using (public.is_admin()) with check (public.is_admin());
