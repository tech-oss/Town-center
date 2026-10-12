-- ═══════════════════════════════════════════════════════════════════════════
-- Accommodation module — Phase 5: public reviews for properties.
--
-- public_business_reviews showed a business's approved reviews only when that
-- business itself was on a paid plan. An accommodation property has no plan
-- of its own — its company has — so its reviews never reached the site. A
-- property's reviews now follow its company's plan, and show only while the
-- property is live and its company approved and visible. Same columns, same
-- rows for every other business.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace view public.public_business_reviews as
 SELECT r.id,
    r.business_id,
    r.reviewer,
    r.rating,
    r.date,
    r.text,
    r.verification_link,
        CASE
            WHEN (r.reply ->> 'status'::text) = 'Approved'::text THEN r.reply ->> 'text'::text
            ELSE NULL::text
        END AS reply
   FROM business_reviews r
     JOIN businesses b ON b.id = r.business_id
     -- A property is billed through its company.
     JOIN business_subscriptions s ON s.business_id = COALESCE(b.parent_id, b.id)
     LEFT JOIN businesses pb ON pb.id = b.parent_id
  WHERE r.status = 'Visible'::text
    AND b.status = 'Approved'::text
    AND COALESCE(b.visible, true)
    AND s.plan = 'premium'::text
    AND (b.kind <> 'accommodation_property'
         OR (b.property_state = 'live' AND pb.status = 'Approved' AND COALESCE(pb.visible, true)));

grant select on public.public_business_reviews to anon, authenticated;

notify pgrst, 'reload schema';
