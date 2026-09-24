-- ═══════════════════════════════════════════════════════════════════════════
-- Check-in and check-out times for hotels and accommodation.
--
-- Today a hotel has one free-text box, availability_info, holding whatever it
-- wants to say about arriving — "Check-in from 3pm. 24-hour reception." It
-- reads fine on the page and is useless for anything else: nothing can sort
-- by it, filter on it, or show it in its own row, because it is prose.
--
-- So the two facts every guest actually looks for get their own columns:
--
--   check_in_time   free text  — "From 3pm", "2pm–10pm", "Any time"
--   check_out_time  free text  — "By 11am"
--
-- Free text, not a time column, deliberately. Real answers are ranges,
-- conditions and words ("late arrivals by arrangement"), and a time picker
-- would force every one of those back into availability_info anyway.
--
-- And the two options a guest filters on:
--
--   early_checkin   the hotel will let guests in before the standard time
--   late_checkout   the hotel will let guests stay past the standard time
--
-- These are booleans because they are the filter. A guest arriving off an
-- early train wants the list narrowed to hotels that will take them, which
-- prose cannot do.
--
-- availability_info stays exactly as it is, for everything these four don't
-- cover. Nothing is migrated out of it: it is prose, and guessing at which
-- half of a sentence is the check-in time would put wrong times on live
-- hotel pages. Hotels fill the new boxes in themselves, and until one does,
-- the site shows what it shows today.
--
-- Premium-gated, like availability_info and star_rating beside it. A free
-- listing shows nothing where these go rather than showing blanks — the same
-- rule the star rating now follows.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. The columns ────────────────────────────────────────────────────────

alter table public.business_listings
  add column if not exists check_in_time  text,
  add column if not exists check_out_time text,
  add column if not exists early_checkin  boolean not null default false,
  add column if not exists late_checkout  boolean not null default false;

-- Short enough to sit on one line of a listing card. The dashboard says the
-- same thing before you can save, so this is the backstop, not the message.
alter table public.business_listings
  drop constraint if exists business_listings_check_in_time_len;
alter table public.business_listings
  add constraint business_listings_check_in_time_len
  check (check_in_time is null or length(check_in_time) <= 60);

alter table public.business_listings
  drop constraint if exists business_listings_check_out_time_len;
alter table public.business_listings
  add constraint business_listings_check_out_time_len
  check (check_out_time is null or length(check_out_time) <= 60);

comment on column public.business_listings.check_in_time is
  'Hotels/accommodation: free-text arrival time, e.g. "From 3pm".';
comment on column public.business_listings.check_out_time is
  'Hotels/accommodation: free-text departure time, e.g. "By 11am".';
comment on column public.business_listings.early_checkin is
  'Hotel offers early check-in. Drives the Live & Stay filter.';
comment on column public.business_listings.late_checkout is
  'Hotel offers late check-out. Drives the Live & Stay filter.';


-- ── 2. The public view ────────────────────────────────────────────────────
-- Rebuilt rather than replaced: a create-or-replace can only append columns,
-- and this view is dropped and rebuilt by every migration that touches it.
-- Identical to listing_edits_await_approval_2026_09.sql with four columns
-- added, so it keeps reading through listing_as_approved() — an edit still
-- waiting on admin is not served to the public.

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

-- Hotels and accommodation, and what each has filled in so far. Everything
-- reads null/false immediately after running this — the columns are new and
-- nothing was migrated out of availability_info on purpose.
select p.name,
       p.plan,
       p.business_type_detail ->> 'hotelKind' as kind,
       p.check_in_time,
       p.check_out_time,
       p.early_checkin,
       p.late_checkout,
       p.availability_info
from public.public_business_profiles p
where p.business_type = 'hotel'
order by p.plan desc, p.name;
