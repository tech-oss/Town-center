-- ═══════════════════════════════════════════════════════════════════════════
-- Accommodation: a property's pending edits stay off the public site.
--
-- public_business_profiles serves every listing as last approved
-- (listing_as_approved — pending sections read from their snapshot). Two
-- property columns bypassed that and read the row as saved:
--
--   rooms           a property's rooms (name, sleeps, beds, description) went
--                   public the moment the company saved them
--   contact_source  switching between the company's and the property's own
--                   contact details did too
--
-- Both now come from the approved row, like every other column. The rest of
-- the view is exactly as it was (copied from the live definition).
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace view public.public_business_profiles as
 SELECT b.id AS business_id,
    COALESCE(NULLIF(l.name, ''::text), b.name) AS name,
    l.business_type,
    COALESCE(l.business_type_detail, '{}'::jsonb) AS business_type_detail,
        CASE
            WHEN e.paid THEN 'premium'::text
            ELSE 'free'::text
        END AS plan,
        CASE
            WHEN e.is_prop AND NOT e.paid THEN NULL::text
            ELSE l.hero_image
        END AS hero_image,
    l.address,
    l.postal_code,
        CASE
            WHEN e.is_prop THEN
            CASE
                WHEN e.own THEN COALESCE(NULLIF(l.phone, ''::text), cp.phone)
                ELSE cp.phone
            END
            ELSE l.phone
        END AS phone,
        CASE
            WHEN e.is_prop THEN
            CASE
                WHEN e.own THEN COALESCE(NULLIF(l.email, ''::text), cp.email)
                ELSE cp.email
            END
            ELSE l.email
        END AS email,
        CASE
            WHEN e.paid THEN l.tagline
            ELSE NULL::text
        END AS tagline,
        CASE
            WHEN e.paid THEN l.description
            ELSE NULL::text
        END AS description,
        CASE
            WHEN e.is_prop THEN cp.logo
            WHEN e.paid THEN l.logo
            ELSE NULL::text
        END AS logo,
        CASE
            WHEN e.paid THEN l.hours
            ELSE NULL::jsonb
        END AS hours,
        CASE
            WHEN e.paid THEN l.availability_info
            ELSE NULL::text
        END AS availability_info,
        CASE
            WHEN e.paid THEN l.gallery
            ELSE NULL::jsonb
        END AS gallery,
    l.lat,
    l.lng,
        CASE
            WHEN e.is_prop THEN
            CASE
                WHEN e.own THEN COALESCE(NULLIF(l.website, ''::text), cp.website)
                ELSE cp.website
            END
            WHEN e.paid THEN l.website
            ELSE NULL::text
        END AS website,
        CASE
            WHEN e.paid THEN l.booking_url
            ELSE NULL::text
        END AS booking_url,
        CASE
            WHEN e.is_prop THEN
            CASE
                WHEN e.own AND l.social IS NOT NULL AND l.social <> '{}'::jsonb THEN l.social
                ELSE cp.social
            END
            WHEN e.paid THEN l.social
            ELSE NULL::jsonb
        END AS social,
        CASE
            WHEN e.paid THEN l.faqs
            ELSE NULL::jsonb
        END AS faqs,
        CASE
            WHEN e.paid THEN l.services_list
            ELSE NULL::jsonb
        END AS services_list,
        CASE
            WHEN e.paid THEN l.areas_covered_list
            ELSE NULL::jsonb
        END AS areas_covered_list,
        CASE
            WHEN e.paid THEN l.why_choose_us
            ELSE NULL::jsonb
        END AS why_choose_us,
        CASE
            WHEN e.paid THEN l.stats
            ELSE NULL::jsonb
        END AS stats,
        CASE
            WHEN e.paid THEN l.skills
            ELSE NULL::jsonb
        END AS skills,
        CASE
            WHEN e.paid THEN l.portfolio
            ELSE NULL::jsonb
        END AS portfolio,
        CASE
            WHEN e.paid THEN l.working_with_me
            ELSE NULL::jsonb
        END AS working_with_me,
        CASE
            WHEN e.paid THEN l.amenities
            ELSE NULL::jsonb
        END AS amenities,
        CASE
            WHEN e.paid THEN l.star_rating
            ELSE NULL::integer
        END AS star_rating,
        CASE
            WHEN e.paid THEN l.check_in_time
            ELSE NULL::text
        END AS check_in_time,
        CASE
            WHEN e.paid THEN l.check_out_time
            ELSE NULL::text
        END AS check_out_time,
        CASE
            WHEN e.paid THEN COALESCE(l.early_checkin, false)
            ELSE false
        END AS early_checkin,
        CASE
            WHEN e.paid THEN COALESCE(l.late_checkout, false)
            ELSE false
        END AS late_checkout,
    l.updated_at,
    b.kind,
    b.parent_id,
        CASE
            WHEN e.paid THEN l.rooms
            ELSE NULL::jsonb
        END AS rooms
   FROM businesses b
     JOIN business_listings l0 ON l0.business_id = b.id
     CROSS JOIN LATERAL ( SELECT (x.a).business_id AS business_id,
            (x.a).name AS name,
            (x.a).tagline AS tagline,
            (x.a).description AS description,
            (x.a).logo AS logo,
            (x.a).hero_image AS hero_image,
            (x.a).hours AS hours,
            (x.a).availability_info AS availability_info,
            (x.a).gallery AS gallery,
            (x.a).address AS address,
            (x.a).lat AS lat,
            (x.a).lng AS lng,
            (x.a).phone AS phone,
            (x.a).email AS email,
            (x.a).website AS website,
            (x.a).booking_url AS booking_url,
            (x.a).social AS social,
            (x.a).faqs AS faqs,
            (x.a).services_list AS services_list,
            (x.a).areas_covered_list AS areas_covered_list,
            (x.a).amenities AS amenities,
            (x.a).other_amenities AS other_amenities,
            (x.a).properties AS properties,
            (x.a).approval_status AS approval_status,
            (x.a).updated_at AS updated_at,
            (x.a).category AS category,
            (x.a).subcategory AS subcategory,
            (x.a).business_type AS business_type,
            (x.a).business_type_detail AS business_type_detail,
            (x.a).rejection_reason AS rejection_reason,
            (x.a).why_choose_us AS why_choose_us,
            (x.a).stats AS stats,
            (x.a).availability_tag AS availability_tag,
            (x.a).working_with_me AS working_with_me,
            (x.a).skills AS skills,
            (x.a).portfolio AS portfolio,
            (x.a).star_rating AS star_rating,
            (x.a).postal_code AS postal_code,
            (x.a).pending_snapshot AS pending_snapshot,
            (x.a).edited_by AS edited_by,
            (x.a).check_in_time AS check_in_time,
            (x.a).check_out_time AS check_out_time,
            (x.a).early_checkin AS early_checkin,
            (x.a).late_checkout AS late_checkout,
            (x.a).rooms AS rooms,
            (x.a).contact_source AS contact_source
           FROM ( SELECT listing_as_approved(l0.*) AS a
                 OFFSET 0) x) l
     LEFT JOIN business_subscriptions s ON s.business_id = b.id
     LEFT JOIN businesses pb ON pb.id = b.parent_id
     LEFT JOIN business_subscriptions ps ON ps.business_id = b.parent_id
     LEFT JOIN accommodation_company_profiles cp ON cp.business_id = b.parent_id
     CROSS JOIN LATERAL ( SELECT b.kind = 'accommodation_property'::text AS is_prop,
            COALESCE(
                CASE
                    WHEN b.kind = 'accommodation_property'::text THEN ps.plan
                    ELSE s.plan
                END = 'premium'::text, false) AS paid,
            b.kind = 'accommodation_property'::text AND COALESCE(ps.plan = 'premium'::text, false) AND l.contact_source = 'own'::text AS own) e
  WHERE b.status = 'Approved'::text AND COALESCE(b.visible, true) AND b.kind <> 'accommodation_company'::text AND (b.kind <> 'accommodation_property'::text OR b.property_state = 'live'::text AND pb.status = 'Approved'::text AND COALESCE(pb.visible, true));

notify pgrst, 'reload schema';
