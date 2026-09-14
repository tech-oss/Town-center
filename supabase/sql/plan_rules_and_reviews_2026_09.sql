-- ═══════════════════════════════════════════════════════════════════════════
-- Plan rules, admin-granted plans and review approval.
--
--   1. Admin-granted Visibility Plans are recorded as not paying (fee 0,
--      granted_by_admin = 'full'), so revenue and "paying" counts stay honest.
--   2. An approved business goes straight to its dashboard: the terms were
--      already accepted during signup / claim.
--   3. Free businesses get a map pin: lat/lng are public for every plan. Their
--      own page still hides the map (the site decides that from the plan).
--   4. Reviews need admin approval before they go live, and every edit a
--      business makes sends the review back for approval. Approved reviews of
--      Visibility Plan businesses are published through public_business_reviews.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Admin-granted plans aren't revenue ─────────────────────────────────

alter table public.business_subscriptions
  add column if not exists granted_by_admin text,
  add column if not exists granted_at       timestamptz;

-- Any Visibility Plan with no Stripe subscription behind it was given by admin.
update public.business_subscriptions
set monthly_fee      = 0,
    granted_by_admin = coalesce(granted_by_admin, 'full'),
    granted_at       = coalesce(granted_at, now())
where plan = 'premium'
  and stripe_subscription_id is null;

-- A business that later pays through Stripe is no longer a comp account.
update public.business_subscriptions
set granted_by_admin = null, granted_at = null
where stripe_subscription_id is not null
  and granted_by_admin is not null;


-- ── 2. No second terms step after approval ─────────────────────────────────

update public.business_users
set onboarding_completed_at = coalesce(requested_at, now())
where onboarding_completed_at is null;


-- ── 3. Map pins for every plan ─────────────────────────────────────────────
-- Same view as subscription_plans_2026_09.sql, with lat/lng no longer withheld.

create or replace view public.public_business_profiles
with (security_invoker = false) as
select
  b.id                                   as business_id,
  coalesce(nullif(l.name, ''), b.name)   as name,
  l.business_type,
  coalesce(l.business_type_detail, '{}'::jsonb) as business_type_detail,
  case when s.plan = 'premium' then 'premium' else 'free' end as plan,
  -- Every plan (a Free business's hero is the stock image admin uploads)
  l.hero_image,
  l.address,
  l.postal_code,
  l.phone,
  l.email,
  -- Visibility Plan only — withheld (null) for a Free business
  case when s.plan = 'premium' then l.tagline end            as tagline,
  case when s.plan = 'premium' then l.description end        as description,
  case when s.plan = 'premium' then l.logo end               as logo,
  case when s.plan = 'premium' then l.hours end              as hours,
  case when s.plan = 'premium' then l.availability_info end  as availability_info,
  case when s.plan = 'premium' then l.gallery end            as gallery,
  -- Every plan: used for the homepage map pin
  l.lat                                                      as lat,
  l.lng                                                      as lng,
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


-- ── 4. Reviews: approve before publishing ──────────────────────────────────

alter table public.business_reviews
  add column if not exists status          text not null default 'Pending Approval',
  add column if not exists moderation_note text;

alter table public.business_reviews drop constraint if exists business_reviews_status_check;
alter table public.business_reviews
  add constraint business_reviews_status_check
  check (status in ('Pending Approval', 'Visible', 'Rejected', 'Hidden'));
alter table public.business_reviews alter column status set default 'Pending Approval';

-- Only admin decides whether a review is live. Anything a business writes —
-- a new review or an edit to one — waits for approval.
create or replace function public.business_reviews_require_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'Pending Approval';
    new.moderation_note := null;
  elsif (new.reviewer, new.rating, new.date, new.text, new.verification_link)
        is distinct from (old.reviewer, old.rating, old.date, old.text, old.verification_link) then
    new.status := 'Pending Approval';
    new.moderation_note := null;
  else
    -- A business can't approve, hide or un-hide its own review.
    new.status := old.status;
    new.moderation_note := old.moderation_note;
  end if;
  return new;
end $$;

drop trigger if exists business_reviews_require_approval on public.business_reviews;
create trigger business_reviews_require_approval
  before insert or update on public.business_reviews
  for each row execute function public.business_reviews_require_approval();

-- Approved reviews of live Visibility Plan businesses, for the public site.
create or replace view public.public_business_reviews
with (security_invoker = false) as
select
  r.id,
  r.business_id,
  r.reviewer,
  r.rating,
  r.date,
  r.text,
  r.verification_link,
  case when r.reply->>'status' = 'Approved' then r.reply->>'text' end as reply
from public.business_reviews r
join public.businesses b on b.id = r.business_id
join public.business_subscriptions s on s.business_id = r.business_id
where r.status = 'Visible'
  and b.status = 'Approved'
  and coalesce(b.visible, true)
  and s.plan = 'premium';

grant select on public.public_business_reviews to anon, authenticated;

notify pgrst, 'reload schema';
