-- ═══════════════════════════════════════════════════════════════════════════
-- A listing edit does not reach the public site until admin approves it.
--
-- business_listings is both the working copy and the live copy: saving a tab
-- writes the new values straight into the live columns and only marks that
-- section "Pending Approval". So a Content Manager's gallery change was on the
-- website immediately, and the approval queue was reviewing something the
-- public could already see.
--
-- Nothing about how edits are saved changes. What changes is what the public
-- views read: for any section still awaiting approval, they serve the values
-- from pending_snapshot — the last approved state, which the save already
-- captures for the approval queue's before/after. Approving clears the
-- section's status, and the new values appear at that moment; rejecting
-- reverts the columns as it always has.
--
-- Admin and the business's own dashboard keep reading business_listings
-- directly, so both still see the edit under review.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════


-- The snapshot is keyed by the dashboard's camelCase field names
-- ("heroImage"); the table's columns are snake_case ("hero_image").
create or replace function public.listing_snapshot_column(p_field text)
returns text
language sql immutable strict
as $$
  select lower(regexp_replace(p_field, '([A-Z])', '_\1', 'g'))
$$;


-- One listing row as the public should see it: live values, except where a
-- section is awaiting approval, in which case that section's fields come from
-- the snapshot taken before the edit.
create or replace function public.listing_as_approved(l public.business_listings)
returns public.business_listings
language plpgsql immutable
as $$
declare
  j   jsonb := to_jsonb(l);
  sec text;
  fld text;
  col text;
begin
  if l.pending_snapshot is null or l.approval_status is null then
    return l;
  end if;

  for sec in select jsonb_object_keys(l.pending_snapshot) loop
    -- Only a section actually waiting on admin is held back. An approved or
    -- rejected section's snapshot is just history.
    continue when coalesce(l.approval_status ->> sec, '') <> 'Pending Approval';
    continue when jsonb_typeof(l.pending_snapshot -> sec) <> 'object';

    for fld in select jsonb_object_keys(l.pending_snapshot -> sec) loop
      col := public.listing_snapshot_column(fld);
      -- Ignore anything that isn't a real column, so an older snapshot
      -- written before a rename can never break the view.
      continue when not (j ? col);
      j := jsonb_set(j, array[col], l.pending_snapshot -> sec -> fld, false);
    end loop;
  end loop;

  return jsonb_populate_record(null::public.business_listings, j);
end $$;


-- ── The public profile view, now reading approved values ──────────────────

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
join public.business_listings l0 on l0.business_id = b.id
cross join lateral (select (public.listing_as_approved(l0)).*) l
left join public.business_subscriptions s on s.business_id = b.id
where b.status = 'Approved'
  and coalesce(b.visible, true);

grant select on public.public_business_profiles to anon, authenticated;

notify pgrst, 'reload schema';
