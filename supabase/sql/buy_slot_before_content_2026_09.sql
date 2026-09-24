-- ═══════════════════════════════════════════════════════════════════════════
-- Buy the slot first, fill it afterwards.
--
-- Booking In the Spotlight, Featured Article or What's On refused unless the
-- business already had a live post, Featured Article or event: "Publish a
-- news or offer post first — that's what this slot shows."
--
-- It was there so nobody paid for a slot they had nothing to put in. But it
-- makes the order of work backwards. A business that wants the homepage has
-- to go away, write something, wait for it to be approved, and come back —
-- by which time the slot it was looking at may be gone. Nothing is lost by
-- letting it pay first: payment leaves the booking in 'awaiting_content',
-- the dashboard says the slot is reserved and points at the tab to write in,
-- and public_homepage_placements only shows rows that are 'approved' AND
-- have a content_id, so an unfilled slot simply shows nothing until it is
-- filled and approved.
--
-- The slot still runs on its own dates either way, which the dashboard has
-- always said.
--
-- Also fixes a mismatch that this makes much more likely to be hit. The
-- dashboard offers a business's posts that are Live *or* waiting for
-- approval — and says so: "A post that's still waiting for approval is
-- approved together with your slot." set_placement_content took Live only,
-- so choosing one of those pending posts failed with "Choose one of your own
-- live items for this slot." Before, few businesses reached that state;
-- now the normal path is buy → write → come straight back, with the post
-- still pending.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Booking no longer asks for content up front ────────────────────────

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

  -- Every promotion on the homepage is a Visibility Plan feature
  -- (promotions_need_subscription_2026_09.sql).
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

  -- No content check. The booking lands in 'awaiting_content' after payment
  -- and shows nothing on the homepage until something is chosen and approved.

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


-- ── 2. A post still waiting for approval can be chosen ────────────────────
-- It reaches the homepage only when admin approves the booking, and
-- approving the booking publishes the post with it, so nothing unapproved
-- can appear. Featured Articles and events stay Live-only: those are
-- approved on their own tabs first, and the dashboard offers only live ones.

create or replace function public.set_placement_content(p_placement_id uuid, p_kind text, p_content_id text)
returns public.homepage_placements
language plpgsql security definer set search_path = public
as $$
declare
  v_row homepage_placements;
  v_ok boolean;
begin
  select * into v_row from homepage_placements where id = p_placement_id;
  if not found or not public.homepage_is_owner(v_row.business_id) then
    raise exception 'Not your booking.' using errcode = '42501';
  end if;
  if v_row.status not in ('awaiting_content', 'pending_approval', 'rejected', 'approved') then
    raise exception 'This booking can''t be changed.' using errcode = 'P0001';
  end if;
  if v_row.ends_at <= now() then
    raise exception 'This booking has already finished.' using errcode = 'P0001';
  end if;

  v_ok := case
    when v_row.slot_type = 'spotlight' and p_kind = 'business_article' then
      exists (select 1 from business_articles a where a.id::text = p_content_id
              and a.business_id = v_row.business_id
              and a.status in ('Live', 'Pending Approval'))
    -- Featured Articles only — a news or offer post is not one.
    when v_row.slot_type = 'featured_article' and p_kind = 'feature_article' then
      exists (select 1 from feature_articles f where f.id::text = p_content_id
              and f.business_id = v_row.business_id and f.status = 'Live')
    when v_row.slot_type = 'whats_on' and p_kind = 'business_event' then
      exists (select 1 from business_events e where e.id::text = p_content_id
              and e.business_id = v_row.business_id and e.status = 'Live')
    else false
  end;
  if not v_ok then
    raise exception 'Choose one of your own items for this slot.' using errcode = 'P0001';
  end if;

  update homepage_placements
  set content_kind = p_kind, content_id = p_content_id,
      status = 'pending_approval', rejection_reason = null
  where id = p_placement_id
  returning * into v_row;
  return v_row;
end $$;

revoke all on function public.set_placement_content(uuid, text, text) from public, anon;
grant execute on function public.set_placement_content(uuid, text, text) to authenticated;


notify pgrst, 'reload schema';

-- Paid bookings with nothing in them yet. This is a normal state now, not a
-- fault: the slot is reserved, runs on its dates, and shows nothing until it
-- is filled and approved.
select p.slot_type, p.business_id, p.status, p.starts_at, p.ends_at
from public.homepage_placements p
where p.source = 'purchase'
  and p.content_id is null
  and p.ends_at > now()
  and p.status not in ('cancelled', 'rejected')
order by p.ends_at;
