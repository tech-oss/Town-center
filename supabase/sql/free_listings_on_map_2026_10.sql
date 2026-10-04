-- Pins for every listing on the homepage map.
--
-- A Free listing used to have its latitude/longitude withheld here along with
-- the rest of the Visibility Plan content, so it never got a pin on the
-- homepage / Map-tab map. The coordinates are now public for every plan. A
-- Free business page still shows no map of its own and no website link --
-- those are withheld by the pages themselves, and website stays plan-gated
-- below.
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
     CROSS JOIN LATERAL ( SELECT (listing_as_approved(l0.*)).business_id AS business_id,
            (listing_as_approved(l0.*)).name AS name,
            (listing_as_approved(l0.*)).tagline AS tagline,
            (listing_as_approved(l0.*)).description AS description,
            (listing_as_approved(l0.*)).logo AS logo,
            (listing_as_approved(l0.*)).hero_image AS hero_image,
            (listing_as_approved(l0.*)).hours AS hours,
            (listing_as_approved(l0.*)).availability_info AS availability_info,
            (listing_as_approved(l0.*)).gallery AS gallery,
            (listing_as_approved(l0.*)).address AS address,
            (listing_as_approved(l0.*)).lat AS lat,
            (listing_as_approved(l0.*)).lng AS lng,
            (listing_as_approved(l0.*)).phone AS phone,
            (listing_as_approved(l0.*)).email AS email,
            (listing_as_approved(l0.*)).website AS website,
            (listing_as_approved(l0.*)).booking_url AS booking_url,
            (listing_as_approved(l0.*)).social AS social,
            (listing_as_approved(l0.*)).faqs AS faqs,
            (listing_as_approved(l0.*)).services_list AS services_list,
            (listing_as_approved(l0.*)).areas_covered_list AS areas_covered_list,
            (listing_as_approved(l0.*)).amenities AS amenities,
            (listing_as_approved(l0.*)).other_amenities AS other_amenities,
            (listing_as_approved(l0.*)).properties AS properties,
            (listing_as_approved(l0.*)).approval_status AS approval_status,
            (listing_as_approved(l0.*)).updated_at AS updated_at,
            (listing_as_approved(l0.*)).category AS category,
            (listing_as_approved(l0.*)).subcategory AS subcategory,
            (listing_as_approved(l0.*)).business_type AS business_type,
            (listing_as_approved(l0.*)).business_type_detail AS business_type_detail,
            (listing_as_approved(l0.*)).rejection_reason AS rejection_reason,
            (listing_as_approved(l0.*)).why_choose_us AS why_choose_us,
            (listing_as_approved(l0.*)).stats AS stats,
            (listing_as_approved(l0.*)).availability_tag AS availability_tag,
            (listing_as_approved(l0.*)).working_with_me AS working_with_me,
            (listing_as_approved(l0.*)).skills AS skills,
            (listing_as_approved(l0.*)).portfolio AS portfolio,
            (listing_as_approved(l0.*)).star_rating AS star_rating,
            (listing_as_approved(l0.*)).postal_code AS postal_code,
            (listing_as_approved(l0.*)).pending_snapshot AS pending_snapshot,
            (listing_as_approved(l0.*)).edited_by AS edited_by,
            (listing_as_approved(l0.*)).check_in_time AS check_in_time,
            (listing_as_approved(l0.*)).check_out_time AS check_out_time,
            (listing_as_approved(l0.*)).early_checkin AS early_checkin,
            (listing_as_approved(l0.*)).late_checkout AS late_checkout) l)
     LEFT JOIN business_subscriptions s ON ((s.business_id = b.id)))
  WHERE ((b.status = 'Approved'::text) AND COALESCE(b.visible, true));

notify pgrst, 'reload schema';
