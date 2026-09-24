-- ═══════════════════════════════════════════════════════════════════════════
-- Paid promotions are for subscribers.
--
-- Every homepage promotion is meant to be available only to a business on the
-- Visibility Plan. Two of the four were never actually gated, and the other
-- two only by accident:
--
--   • Featured Article and What's On are gated as a side effect. Booking one
--     requires a live Featured Article or a live event, and
--     addon_slot_allowance() returns 0 for both unless the business is on
--     'premium'. So a free business cannot create the content, and therefore
--     cannot book the slot. It works, but nothing says so — the refusal the
--     business sees talks about content, not about subscribing.
--
--   • In the Spotlight requires a live news or offer post, and the allowance
--     for those is 3 REGARDLESS of plan. Five free businesses on this
--     database have live posts today, so five free businesses can buy the
--     homepage's most prominent slot.
--
--   • Featured Business has no precondition at all. Any free business could
--     buy it — and it is the one promotion that makes least sense for them,
--     because public_business_profiles withholds a free listing's
--     description, logo, hours, gallery and socials. It would send people to
--     a page with nothing on it.
--
-- So the gate is stated once, here, for all four, instead of being a
-- side effect of three different content rules. A business that is not
-- subscribed is told to subscribe, rather than told to publish a post it is
-- not allowed to publish either.
--
-- This changes nothing for bookings already made: existing placements are
-- untouched, and a business that lapses keeps what it has paid for until it
-- runs out.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. One place that answers "is this business subscribed?" ──────────────
-- 'premium' is the Visibility Plan everywhere: database, Stripe metadata and
-- code (src/Data/plans.js). Anything else — free, or a retired value like
-- standard or vip — is not subscribed, the same defaulting isPremium() does.

create or replace function public.business_is_subscribed(p_business_id text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from business_subscriptions s
    where s.business_id = p_business_id
      and s.plan = 'premium'
  )
$$;

grant execute on function public.business_is_subscribed(text) to anon, authenticated;


-- ── 2. Booking requires it ────────────────────────────────────────────────
-- The whole of book_homepage_slot, with the subscription check added ahead of
-- the content checks — so an unsubscribed business is told the useful thing
-- first, instead of being sent to publish a post it cannot publish.

drop function if exists public.book_homepage_slot(text, text);
drop function if exists public.book_homepage_slot(text, text, uuid);

create function public.book_homepage_slot(
  p_business_id text, p_slot_type text, p_package_id uuid default null
)
returns public.homepage_placements
language plpgsql security definer set search_path = public
as $$
declare
  t homepage_slot_types;
  k homepage_slot_packages;
  v_pool text;
  v_start timestamptz;
  v_end timestamptz;
  v_lane int;
  v_len interval;
  v_bumped uuid;
  v_row homepage_placements;
begin
  if not public.homepage_is_owner(p_business_id) then
    raise exception 'Only the approved owner of this business can book a homepage slot.' using errcode = '42501';
  end if;

  -- The gate. Every promotion on the homepage is a Visibility Plan feature.
  if not public.business_is_subscribed(p_business_id) then
    raise exception 'Homepage promotions are part of the Visibility Plan. Subscribe first, then you can book this slot.'
      using errcode = 'P0001';
  end if;

  select * into t from homepage_slot_types where key = p_slot_type;
  if not found or not t.bookable then
    raise exception 'This homepage slot is not available to book.' using errcode = 'P0001';
  end if;

  if p_package_id is not null then
    select * into k from homepage_slot_packages
    where id = p_package_id and slot_type = p_slot_type and active;
  else
    select * into k from homepage_slot_packages
    where slot_type = p_slot_type and active order by price_pence limit 1;
  end if;
  if not found then
    raise exception 'Choose one of the packages offered for this slot.' using errcode = 'P0001';
  end if;

  -- Don't take money for a slot the business has nothing to put in.
  if p_slot_type = 'spotlight' and not exists (
    select 1 from business_articles a where a.business_id = p_business_id and a.status = 'Live'
  ) then
    raise exception 'Publish a news or offer post first — that''s what this slot shows.' using errcode = 'P0001';
  end if;
  if p_slot_type = 'featured_article' and not exists (
    select 1 from feature_articles f where f.business_id = p_business_id and f.status = 'Live'
  ) then
    raise exception 'Publish a Featured Article first — that''s what this slot shows.' using errcode = 'P0001';
  end if;
  if p_slot_type = 'whats_on' and not exists (
    select 1 from business_events e where e.business_id = p_business_id and e.status = 'Live'
  ) then
    raise exception 'Get an event approved first — that''s what this slot shows.' using errcode = 'P0001';
  end if;

  v_pool := public.homepage_pool_for(p_slot_type, p_business_id);
  perform public.homepage_lock_pool(p_slot_type, v_pool);
  perform public.homepage_release_expired_holds(p_slot_type, v_pool);

  delete from homepage_placements
  where business_id = p_business_id and slot_type = p_slot_type and status = 'held';

  v_len := make_interval(days => k.duration_days);
  v_start := public.homepage_next_start(p_slot_type, v_pool, v_len);

  -- Paid beats admin's own (homepage_paid_overrides_2026_09.sql).
  while v_start is null or v_start > now() + interval '1 minute' loop
    v_bumped := public.homepage_bump_admin_placement(
      p_slot_type, v_pool, now(), now() + v_len, null);
    exit when v_bumped is null;
    v_start := public.homepage_next_start(p_slot_type, v_pool, v_len);
  end loop;

  if v_start is null then
    raise exception 'No homepage slot is free right now. Please try again later.' using errcode = 'P0001';
  end if;

  v_end := v_start + v_len;
  v_lane := public.homepage_free_lane(p_slot_type, v_pool, v_start, v_end);

  insert into homepage_placements (
    slot_type, pool, lane, business_id, starts_at, ends_at,
    status, source, hold_expires_at, amount_pence, created_by
  ) values (
    p_slot_type, v_pool, v_lane, p_business_id, v_start, v_end,
    'held', 'purchase', now() + interval '40 minutes', k.price_pence, auth.uid()
  )
  returning * into v_row;

  update homepage_placements
     set bumped_by = v_row.id
   where slot_type = p_slot_type and pool = v_pool
     and status = 'bumped' and bumped_by is null
     and bumped_at > now() - interval '1 minute';

  return v_row;
end $$;

revoke all on function public.book_homepage_slot(text, text, uuid) from public, anon;
grant execute on function public.book_homepage_slot(text, text, uuid) to authenticated;


-- ── 3. The dashboard can ask before offering ──────────────────────────────
-- homepage_package_availability() is what the business dashboard lists the
-- slots from. It now says whether this business may book, so the page can
-- show the slots locked with an explanation rather than letting someone pick
-- a package, reach the checkout and be refused there.

create or replace function public.homepage_slots_bookable_by(p_business_id text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.business_is_subscribed(p_business_id)
$$;

grant execute on function public.homepage_slots_bookable_by(text) to anon, authenticated;


notify pgrst, 'reload schema';

-- Who holds a promotion today, and whether they are subscribed. Anything with
-- subscribed = false was booked before this rule existed; it keeps running to
-- its end date, which is what was paid for.
select p.slot_type,
       p.business_id,
       public.business_is_subscribed(p.business_id) as subscribed,
       p.status,
       p.ends_at
from public.homepage_placements p
where p.source = 'purchase'
  and p.status not in ('cancelled', 'rejected', 'bumped')
  and p.ends_at > now()
order by subscribed, p.slot_type;
