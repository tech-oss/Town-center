-- ═══════════════════════════════════════════════════════════════════════════
-- The paid plan becomes the Visibility Plan: £29.99/month or £329/year.
--
-- It keeps the key 'premium' in the database, so nothing else changes shape.
--   1. Which billing option a subscription is on, and what it actually
--      charges. monthly_fee stays the monthly equivalent (£329 / 12 for
--      annual) so revenue figures compare like for like.
--   2. Claim onboarding charges the new monthly price.
--
-- Run AFTER stripe_billing_2026_09.sql. NOT RUN YET. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.business_subscriptions
  add column if not exists billing_interval text check (billing_interval in ('month', 'year')),
  add column if not exists price_amount     numeric;

create or replace function public.complete_claim_onboarding(
  target_business_id text,
  target_plan text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen text := case when target_plan = 'premium' then 'premium' else 'free' end;
  fee numeric := case when target_plan = 'premium' then 29.99 else 0 end;
begin
  if not exists (
    select 1 from public.business_users
    where business_id = target_business_id
      and auth_user_id = auth.uid()
      and role = 'Owner'
      and status = 'approved'
  ) then
    raise exception 'Only the approved owner of this business can complete its setup.';
  end if;

  insert into public.business_subscriptions
    (business_id, plan, plan_status, monthly_fee, renewal_date, terms_accepted_at)
  values
    (target_business_id, chosen, 'Active', fee, (current_date + 30), now())
  on conflict (business_id) do update
    set plan              = excluded.plan,
        plan_status       = 'Active',
        monthly_fee       = excluded.monthly_fee,
        renewal_date      = excluded.renewal_date,
        terms_accepted_at = excluded.terms_accepted_at;

  update public.business_users
  set onboarding_completed_at = now()
  where business_id = target_business_id
    and auth_user_id = auth.uid();
end;
$$;

notify pgrst, 'reload schema';
