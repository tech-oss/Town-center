-- ═══════════════════════════════════════════════════════════════════════════
-- Backend for the September 2026 business-dashboard changes:
--
--   1. businesses.visible — the dashboard's "your business profile is live"
--      toggle. It has been client-only since it was built (there was a TODO
--      saying so in useBusinessAuth), meaning it reset on every reload and
--      never actually hid anything from the public site.
--   2. business_users.onboarding_completed_at — lets a business claimed from
--      the portal ask its new owner for a plan and terms acceptance on first
--      login, which a claim never collected.
--   3. A cap of 3 LIVE articles per business, enforced here rather than only
--      in the client, plus the RPC the onboarding step writes through.
--
-- NOT RUN YET.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Public visibility of a business profile ─────────────────────────────
alter table public.businesses
  add column if not exists visible boolean not null default true;


-- ── 2. Post-claim onboarding ───────────────────────────────────────────────
-- Null means "still owes us a plan and terms acceptance". Everyone who
-- already exists is backfilled as done — self-signup collects both during
-- registration, and admin-created owners had them entered on their behalf, so
-- only claims made from here on start out null.
alter table public.business_users
  add column if not exists onboarding_completed_at timestamptz;

update public.business_users
set onboarding_completed_at = now()
where onboarding_completed_at is null;


-- ── 3. At most 3 live articles per business ────────────────────────────────
-- Drafts are unlimited; the cap is on what's publicly visible. Enforced with
-- a trigger because it's a rule about the set, not about one row — and
-- because three separate paths write this column (the owner promoting a
-- draft, the owner swapping one in, and admin approving a submission), so a
-- check in any one of them would leave the other two unguarded.
--
-- The advisory lock is per-business, so two businesses publishing at the same
-- moment never wait on each other.
create or replace function public.enforce_live_article_limit()
returns trigger
language plpgsql
as $$
declare
  live_count integer;
begin
  if new.status is distinct from 'Live' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'Live' then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('live_articles:' || new.business_id));

  select count(*) into live_count
  from public.business_articles
  where business_id = new.business_id
    and status = 'Live'
    and id <> new.id;

  if live_count >= 3 then
    raise exception 'Live article limit reached: at most 3 articles can be live at once.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists business_articles_live_limit on public.business_articles;

create trigger business_articles_live_limit
  before insert or update of status on public.business_articles
  for each row execute function public.enforce_live_article_limit();


-- ── 4. Completing a claim's onboarding ─────────────────────────────────────
-- The claimer needs to write their chosen plan onto the business and mark
-- their own row as onboarded. Doing that with table policies would mean
-- granting them UPDATE on their own business_users row, which would also let
-- them set their own status to 'approved' and skip admin entirely. This does
-- exactly the two writes and nothing else.
--
-- The fee is derived here rather than taken from the caller, so the price of
-- a plan can't be chosen by whoever is posting the form.
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
  fee numeric;
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

  fee := case target_plan
           when 'premium'  then 79
           when 'standard' then 39
           else 0
         end;

  insert into public.business_subscriptions
    (business_id, plan, plan_status, monthly_fee, renewal_date, terms_accepted_at)
  values
    (target_business_id, target_plan, 'Active', fee, (current_date + 30), now())
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

grant execute on function public.complete_claim_onboarding(text, text) to authenticated;


-- ── 5. Owner controls their profile's visibility ───────────────────────────
-- Same reasoning as above: rather than opening businesses to owner UPDATE
-- (which would also expose status, name and featured), this flips one column
-- for a business the caller actually owns.
create or replace function public.set_business_visibility(
  target_business_id text,
  is_visible boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.business_users
    where business_id = target_business_id
      and auth_user_id = auth.uid()
      and status = 'approved'
  ) then
    raise exception 'Only an approved member of this business can change its visibility.';
  end if;

  update public.businesses
  set visible = is_visible
  where id = target_business_id;
end;
$$;

grant execute on function public.set_business_visibility(text, boolean) to authenticated;
