-- Faster public_business_profiles.
--
-- The view called listing_as_approved() once for every column it exposes —
-- about 45 times per business — so reading the directory cost more the bigger
-- it got (about 0.7s for 1,000 rows at 1,700 businesses, and every page of
-- every request paid it again). Under a burst of requests (a page refresh)
-- that was enough to time out, leaving the map empty. The function is now
-- called once per row. Same columns, same rows; about six times faster.
--
-- Safe to run more than once.

create or replace view public.public_business_profiles as
 SELECT b.id AS business_id,
    COALESCE(NULLIF(l.name, ''::text), b.name) AS name,
    l.business_type,
    COALESCE(l.business_type_detail, '{}'::jsonb) AS business_type_detail,
        CASE
            WHEN (s.plan = 'premium'::text) THEN 'premium'::text
            ELSE 'free'::text
        END AS plan,
    l.hero_image,
    l.address,
    l.postal_code,
    l.phone,
    l.email,
        CASE
            WHEN (s.plan = 'premium'::text) THEN l.tagline
            ELSE NULL::text
        END AS tagline,
        CASE
            WHEN (s.plan = 'premium'::text) THEN l.description
            ELSE NULL::text
        END AS description,
        CASE
            WHEN (s.plan = 'premium'::text) THEN l.logo
            ELSE NULL::text
        END AS logo,
        CASE
            WHEN (s.plan = 'premium'::text) THEN l.hours
            ELSE NULL::jsonb
        END AS hours,
        CASE
            WHEN (s.plan = 'premium'::text) THEN l.availability_info
            ELSE NULL::text
        END AS availability_info,
        CASE
            WHEN (s.plan = 'premium'::text) THEN l.gallery
            ELSE NULL::jsonb
        END AS gallery,
    l.lat,
    l.lng,
        CASE
            WHEN (s.plan = 'premium'::text) THEN l.website
            ELSE NULL::text
        END AS website,
        CASE
            WHEN (s.plan = 'premium'::text) THEN l.booking_url
            ELSE NULL::text
        END AS booking_url,
        CASE
            WHEN (s.plan = 'premium'::text) THEN l.social
            ELSE NULL::jsonb
        END AS social,
        CASE
            WHEN (s.plan = 'premium'::text) THEN l.faqs
            ELSE NULL::jsonb
        END AS faqs,
        CASE
            WHEN (s.plan = 'premium'::text) THEN l.services_list
            ELSE NULL::jsonb
        END AS services_list,
        CASE
            WHEN (s.plan = 'premium'::text) THEN l.areas_covered_list
            ELSE NULL::jsonb
        END AS areas_covered_list,
        CASE
            WHEN (s.plan = 'premium'::text) THEN l.why_choose_us
            ELSE NULL::jsonb
        END AS why_choose_us,
        CASE
            WHEN (s.plan = 'premium'::text) THEN l.stats
            ELSE NULL::jsonb
        END AS stats,
        CASE
            WHEN (s.plan = 'premium'::text) THEN l.skills
            ELSE NULL::jsonb
        END AS skills,
        CASE
            WHEN (s.plan = 'premium'::text) THEN l.portfolio
            ELSE NULL::jsonb
        END AS portfolio,
        CASE
            WHEN (s.plan = 'premium'::text) THEN l.working_with_me
            ELSE NULL::jsonb
        END AS working_with_me,
        CASE
            WHEN (s.plan = 'premium'::text) THEN l.amenities
            ELSE NULL::jsonb
        END AS amenities,
        CASE
            WHEN (s.plan = 'premium'::text) THEN l.star_rating
            ELSE NULL::integer
        END AS star_rating,
        CASE
            WHEN (s.plan = 'premium'::text) THEN l.check_in_time
            ELSE NULL::text
        END AS check_in_time,
        CASE
            WHEN (s.plan = 'premium'::text) THEN l.check_out_time
            ELSE NULL::text
        END AS check_out_time,
        CASE
            WHEN (s.plan = 'premium'::text) THEN COALESCE(l.early_checkin, false)
            ELSE false
        END AS early_checkin,
        CASE
            WHEN (s.plan = 'premium'::text) THEN COALESCE(l.late_checkout, false)
            ELSE false
        END AS late_checkout,
    l.updated_at
   FROM (((businesses b
     JOIN business_listings l0 ON ((l0.business_id = b.id)))
     CROSS JOIN LATERAL ( SELECT (x.a).* FROM ( SELECT listing_as_approved(l0.*) AS a OFFSET 0) x) l)
     LEFT JOIN business_subscriptions s ON ((s.business_id = b.id)))
  WHERE ((b.status = 'Approved'::text) AND COALESCE(b.visible, true));

notify pgrst, 'reload schema';
