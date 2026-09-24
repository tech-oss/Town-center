-- ═══════════════════════════════════════════════════════════════════════════
-- A paid booking outranks admin's own homepage placement.
--
-- Admin fills the homepage with its own picks: a story, an event, a post. A
-- business then comes to buy that same slot and is told "No homepage slot is
-- free right now" — or, worse, is quietly given a start date weeks away,
-- because homepage_next_start looks for the first moment a lane frees up and
-- admin's placement runs until then.
--
-- Admin's placements are fillers. A business paying for the slot should get
-- it, and admin's item should step aside.
--
-- What happens now: booking a full slot bumps the admin placement whose own
-- run ends soonest — the least disruptive one, since it was closest to
-- finishing anyway. Bumped means:
--
--   • off the public site at once (public_homepage_placements shows only
--     'approved', so nothing else had to change for this);
--   • its lane is free, so the exclusion constraint and the lane helpers must
--     stop counting it — that is most of what follows;
--   • still on record, with when it happened and which booking displaced it,
--     so the admin screen can say why an item left the homepage.
--
-- A bumped item does NOT come back by itself when the paid booking ends. The
-- slot simply frees up and admin decides what goes in it.
--
-- Only admin's own placements are ever bumped. A business's paid booking is
-- never displaced — not by admin, not by another business.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. The new state ──────────────────────────────────────────────────────

alter table public.homepage_placements
  drop constraint if exists homepage_placements_status_check;

alter table public.homepage_placements
  add constraint homepage_placements_status_check
    check (status in ('held', 'awaiting_content', 'pending_approval',
                      'approved', 'rejected', 'cancelled', 'bumped'));

alter table public.homepage_placements
  add column if not exists bumped_at timestamptz,
  add column if not exists bumped_by uuid references public.homepage_placements(id) on delete set null;


-- ── 2. A bumped placement no longer holds its lane ────────────────────────
-- The exclusion constraint is what makes double-booking impossible. It
-- ignored 'cancelled'; it must ignore 'bumped' too, or the booking that did
-- the bumping cannot take the lane it just freed.

alter table public.homepage_placements
  drop constraint if exists homepage_placements_no_overlap;

alter table public.homepage_placements
  add constraint homepage_placements_no_overlap exclude using gist (
    slot_type with =,
    pool      with =,
    lane      with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status not in ('cancelled', 'bumped'));


create or replace function public.homepage_lane_is_free(
  p_slot_type text, p_pool text, p_lane int, p_start timestamptz, p_end timestamptz, p_ignore uuid default null
)
returns boolean
language sql stable security definer set search_path = public
as $$
  select not exists (
    select 1 from homepage_placements p
    where p.slot_type = p_slot_type
      and p.pool = p_pool
      and p.lane = p_lane
      and p.status not in ('cancelled', 'bumped')
      and p.id is distinct from p_ignore
      and tstzrange(p.starts_at, p.ends_at, '[)') && tstzrange(p_start, p_end, '[)')
  )
$$;


-- homepage_next_start tests "now" and every moment a booking ends. A bumped
-- booking's end is no longer a moment anything frees up, so it drops out.
create or replace function public.homepage_next_start(
  p_slot_type text, p_pool text, p_length interval, p_from timestamptz default now()
)
returns timestamptz
language plpgsql stable security definer set search_path = public
as $$
declare
  candidate timestamptz;
begin
  for candidate in
    select t from (
      select p_from as t
      union
      select p.ends_at from homepage_placements p
      where p.slot_type = p_slot_type and p.pool = p_pool
        and p.status not in ('cancelled', 'bumped') and p.ends_at > p_from
    ) s order by t
  loop
    if public.homepage_free_lane(p_slot_type, p_pool, candidate, candidate + p_length) is not null then
      return candidate;
    end if;
  end loop;
  return null;
end $$;


-- ── 3. Bumping ────────────────────────────────────────────────────────────
-- Steps aside the admin placement that overlaps the wanted window and whose
-- own run ends soonest. Returns its id, or null when there is nothing of
-- admin's to move — in which case the slot is genuinely full of paid
-- bookings and the business waits its turn like anyone else.

create or replace function public.homepage_bump_admin_placement(
  p_slot_type text, p_pool text, p_start timestamptz, p_end timestamptz, p_by uuid default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  select p.id into v_id
  from homepage_placements p
  where p.slot_type = p_slot_type
    and p.pool = p_pool
    and p.source = 'admin'
    and p.status in ('held', 'awaiting_content', 'pending_approval', 'approved')
    and tstzrange(p.starts_at, p.ends_at, '[)') && tstzrange(p_start, p_end, '[)')
  order by p.ends_at asc
  limit 1;

  if v_id is null then
    return null;
  end if;

  update homepage_placements
     set status = 'bumped', bumped_at = now(), bumped_by = p_by, updated_at = now()
   where id = v_id;

  return v_id;
end $$;

revoke all on function public.homepage_bump_admin_placement(text, text, timestamptz, timestamptz, uuid) from public, anon;


-- ── 4. Booking takes the slot it paid for ─────────────────────────────────
-- Same function as before, with one addition: if the slot cannot start now,
-- step admin's placements aside until it can. Each pass bumps at most one, so
-- a slot two-thirds full of paid bookings gives up only what it must.

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

  -- Paid beats admin's own. While the earliest free start is still in the
  -- future, move one of admin's placements out of the way and look again.
  -- The loop ends when the business can start now, or when there is nothing
  -- of admin's left to move.
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

  -- Now the booking exists, record what it displaced, so admin can see which
  -- booking took the slot rather than only that something did.
  update homepage_placements
     set bumped_by = v_row.id
   where slot_type = p_slot_type and pool = v_pool
     and status = 'bumped' and bumped_by is null
     and bumped_at > now() - interval '1 minute';

  return v_row;
end $$;

revoke all on function public.book_homepage_slot(text, text, uuid) from public, anon;
grant execute on function public.book_homepage_slot(text, text, uuid) to authenticated;

notify pgrst, 'reload schema';

-- What is on the homepage now, and what has been stepped aside.
select slot_type, status, source, count(*) as placements
from public.homepage_placements
where ends_at > now()
group by slot_type, status, source
order by slot_type, status;
