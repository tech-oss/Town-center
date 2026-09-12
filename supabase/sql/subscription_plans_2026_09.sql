-- ═══════════════════════════════════════════════════════════════════════════
-- Two subscription plans — Free and Premium (£39/month) — and the public read
-- path that lets the website and app show real registered businesses.
--
--   1. Every business gets a subscription row; every existing one is moved
--      to Free, and `plan` is constrained to the two values.
--   2. complete_claim_onboarding charges the new Premium price.
--   3. public_business_profiles: the only way the public site reads a
--      business. Approved + visible businesses only, and for a Free business
--      every premium-only column is withheld here in the database, so the
--      free rules can't be bypassed by a client.
--   4. public_business_articles: Live news & offers from Premium businesses.
--
-- Plan definitions in code: src/Data/plans.js (both branches).
-- NOT RUN YET.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Plans ───────────────────────────────────────────────────────────────

insert into public.business_subscriptions (business_id, plan, plan_status, monthly_fee, renewal_date)
select b.id, 'free', 'Active', 0, current_date + 30
from public.businesses b
where not exists (select 1 from public.business_subscriptions s where s.business_id = b.id);

-- Existing businesses move to Free, whatever plan they were on.
update public.business_subscriptions
set plan = 'free', monthly_fee = 0, upgrade_plan_key = 'free'
where plan is distinct from 'free' or monthly_fee is distinct from 0;

alter table public.business_subscriptions
  drop constraint if exists business_subscriptions_plan_check;
alter table public.business_subscriptions
  add constraint business_subscriptions_plan_check check (plan in ('free', 'premium'));


-- ── 2. Claim onboarding at the new price ───────────────────────────────────

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
  fee numeric := case when target_plan = 'premium' then 39 else 0 end;
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


-- ── 3. Public business profiles ────────────────────────────────────────────
-- A view owned by the migration role (security_invoker off) so anonymous
-- visitors can read it without any RLS policy on the underlying tables,
-- which stay private. Only these columns are exposed.

create or replace view public.public_business_profiles
with (security_invoker = false) as
select
  b.id                                   as business_id,
  coalesce(nullif(l.name, ''), b.name)   as name,
  l.business_type,
  coalesce(l.business_type_detail, '{}'::jsonb) as business_type_detail,
  case when s.plan = 'premium' then 'premium' else 'free' end as plan,
  -- Free plan: always shown
  l.hero_image,
  l.address,
  l.postal_code,
  l.phone,
  l.email,
  -- Premium only — withheld (null) for a Free business
  case when s.plan = 'premium' then l.tagline end            as tagline,
  case when s.plan = 'premium' then l.description end        as description,
  case when s.plan = 'premium' then l.logo end               as logo,
  case when s.plan = 'premium' then l.hours end              as hours,
  case when s.plan = 'premium' then l.availability_info end  as availability_info,
  case when s.plan = 'premium' then l.gallery end            as gallery,
  case when s.plan = 'premium' then l.lat end                as lat,
  case when s.plan = 'premium' then l.lng end                as lng,
  case when s.plan = 'premium' then l.website end            as website,
  case when s.plan = 'premium' then l.booking_url end        as booking_url,
  case when s.plan = 'premium' then l.social end             as social,
  case when s.plan = 'premium' then l.faqs end               as faqs,
  case when s.plan = 'premium' then l.services_list end      as services_list,
  case when s.plan = 'premium' then l.areas_covered_list end as areas_covered_list,
  case when s.plan = 'premium' then l.why_choose_us end      as why_choose_us,
  case when s.plan = 'premium' then l.stats end              as stats,
  case when s.plan = 'premium' then l.skills end             as skills,
  case when s.plan = 'premium' then l.portfolio end          as portfolio,
  case when s.plan = 'premium' then l.amenities end          as amenities,
  case when s.plan = 'premium' then l.star_rating end        as star_rating,
  l.updated_at
from public.businesses b
join public.business_listings l on l.business_id = b.id
left join public.business_subscriptions s on s.business_id = b.id
where b.status = 'Approved'
  and coalesce(b.visible, true);

grant select on public.public_business_profiles to anon, authenticated;


-- ── 4. Public news & offers — Premium businesses only ──────────────────────

create or replace view public.public_business_articles
with (security_invoker = false) as
select a.id, a.business_id, a.title, a.type, a.date, a.start_date, a.end_date,
       a.hero_image, a.thumbnail, a.body
from public.business_articles a
join public.businesses b on b.id = a.business_id
join public.business_subscriptions s on s.business_id = a.business_id
where a.status = 'Live'
  and b.status = 'Approved'
  and coalesce(b.visible, true)
  and s.plan = 'premium';

grant select on public.public_business_articles to anon, authenticated;
