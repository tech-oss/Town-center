-- Freelancer profiles: expose Working With Me to the public site.
--
-- business_listings.working_with_me is what a freelancer fills in on the
-- "Working With Me" tab. It was never part of public_business_profiles, so
-- the website had nothing to show and the app fell back to example text.
--
-- Identical to checkin_times_2026_09.sql's view with that one column added.

drop view if exists public.public_business_profiles;

create view public.public_business_profiles
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
  -- A freelancer's Working With Me box (availability, how they work,
  -- response time, experience). Saved by the business portal all along but
  -- never in this view, so the site showed made-up example text instead.
  case when s.plan = 'premium' then l.working_with_me end    as working_with_me,
  case when s.plan = 'premium' then l.amenities end          as amenities,
  case when s.plan = 'premium' then l.star_rating end        as star_rating,
  -- Check-in and check-out (checkin_times_2026_09.sql). Nulled for a free
  -- listing so the page shows nothing there rather than empty labels.
  case when s.plan = 'premium' then l.check_in_time end      as check_in_time,
  case when s.plan = 'premium' then l.check_out_time end     as check_out_time,
  case when s.plan = 'premium' then coalesce(l.early_checkin, false) else false end as early_checkin,
  case when s.plan = 'premium' then coalesce(l.late_checkout, false) else false end as late_checkout,
  l.updated_at
from public.businesses b
join public.business_listings l0 on l0.business_id = b.id
cross join lateral (select (public.listing_as_approved(l0)).*) l
left join public.business_subscriptions s on s.business_id = b.id
where b.status = 'Approved'
  and coalesce(b.visible, true);

grant select on public.public_business_profiles to anon, authenticated;


notify pgrst, 'reload schema';
