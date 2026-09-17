-- ═══════════════════════════════════════════════════════════════════════════
-- Homepage slot bookings.
--
-- Every homepage placement — In the Spotlight, Featured Articles, What's On
-- and Featured Businesses — is now a booking with a start and end time:
--
--   homepage_slot_types   one row per kind of slot: how many run at once
--                         (capacity), how long a paid booking lasts and what it
--                         costs. Admin edits these.
--   homepage_placements   one row per booking. Admin can create any placement
--                         directly; a business buys one through Stripe.
--
-- A slot type with capacity N has N "lanes". An exclusion constraint makes it
-- impossible for two bookings to share a lane at overlapping times, so two
-- businesses can never be sold the same slot, however they race.
--
-- Booking flow (business):
--   book_homepage_slot()      reserves the next free slot as a 40-minute hold
--   stripe-checkout           opens Stripe for that hold (session lasts 30 min)
--   stripe-webhook            settle_homepage_payment() → awaiting_content
--   set_placement_content()   business picks its post / event → pending_approval
--   admin approves            → approved; it shows on the homepage between
--                               starts_at and ends_at, then drops off by itself.
--
-- The homepage reads public_homepage_placements; the legacy flags
-- (news_offers.featured_on_home, feature_articles.homepage,
-- business_events.homepage, businesses.featured) are copied into bookings
-- once below and are no longer read by the site.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists btree_gist;


-- ── 1. Slot types ─────────────────────────────────────────────────────────

create table if not exists public.homepage_slot_types (
  key                text primary key
                     check (key in ('spotlight', 'featured_article', 'whats_on', 'featured_business')),
  label              text not null,
  description        text,
  capacity           int  not null check (capacity between 1 and 50),
  -- Featured Businesses are counted per business type (10 Eat & Drink,
  -- 10 Shop, ...); the other slots share one homepage-wide pool.
  per_business_type  boolean not null default false,
  duration_days      int  not null check (duration_days between 1 and 365),
  price_pence        int  not null check (price_pence >= 0),
  bookable           boolean not null default true,
  updated_at         timestamptz not null default now()
);

insert into public.homepage_slot_types (key, label, description, capacity, per_business_type, duration_days, price_pence)
values
  ('spotlight',         'In the Spotlight',  'One of your news or offer posts in the homepage In the Spotlight section.', 4, false, 14, 4500),
  ('featured_article',  'Featured Article',  'One of your posts as a Featured Article on the homepage.',                  2, false,  7, 2000),
  ('whats_on',          'What''s On',        'One of your events in the homepage What''s On section.',                    3, false, 14, 3000),
  ('featured_business', 'Featured Business', 'Your business shown first in its category listings.',                    10, true,  30, 4000)
on conflict (key) do nothing;

alter table public.homepage_slot_types enable row level security;

drop policy if exists "anyone reads slot types" on public.homepage_slot_types;
create policy "anyone reads slot types" on public.homepage_slot_types
  for select using (true);

drop policy if exists "admins manage slot types" on public.homepage_slot_types;
create policy "admins manage slot types" on public.homepage_slot_types
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.homepage_slot_types to anon, authenticated;


-- ── 2. Placements ─────────────────────────────────────────────────────────

create table if not exists public.homepage_placements (
  id                    uuid primary key default gen_random_uuid(),
  slot_type             text not null references public.homepage_slot_types(key),
  pool                  text not null default 'all',
  lane                  int  not null check (lane >= 1),
  business_id           text references public.businesses(id) on delete cascade,
  content_kind          text check (content_kind in
                          ('news_offer', 'business_article', 'feature_article', 'business_event', 'business')),
  content_id            text,
  starts_at             timestamptz not null,
  ends_at               timestamptz not null,
  status                text not null check (status in
                          ('held', 'awaiting_content', 'pending_approval', 'approved', 'rejected', 'cancelled')),
  source                text not null check (source in ('admin', 'purchase')),
  hold_expires_at       timestamptz,
  amount_pence          int,
  stripe_session_id     text unique,
  stripe_payment_intent text,
  paid_at               timestamptz,
  rejection_reason      text,
  created_by            uuid default auth.uid(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint homepage_placements_time_order check (ends_at > starts_at),
  constraint homepage_placements_content_pair check ((content_kind is null) = (content_id is null)),
  -- The rule that makes double-booking impossible.
  constraint homepage_placements_no_overlap exclude using gist (
    slot_type with =,
    pool      with =,
    lane      with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status <> 'cancelled')
);

create index if not exists homepage_placements_live_idx
  on public.homepage_placements (slot_type, status, starts_at, ends_at);
create index if not exists homepage_placements_business_idx
  on public.homepage_placements (business_id, created_at desc);
create index if not exists homepage_placements_content_idx
  on public.homepage_placements (content_kind, content_id);

alter table public.homepage_placements enable row level security;

drop policy if exists "admins manage placements" on public.homepage_placements;
create policy "admins manage placements" on public.homepage_placements
  for all using (public.is_admin()) with check (public.is_admin());

-- A business sees its own bookings. It never writes them directly: every
-- change goes through the functions below, which check ownership and slots.
drop policy if exists "businesses read own placements" on public.homepage_placements;
create policy "businesses read own placements" on public.homepage_placements
  for select using (
    exists (
      select 1 from public.business_users u
      where u.business_id = homepage_placements.business_id
        and u.auth_user_id = auth.uid()
        and u.status = 'approved'
    )
  );

grant select, insert, update, delete on public.homepage_placements to authenticated;

create or replace function public.touch_homepage_placement()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists homepage_placements_touch on public.homepage_placements;
create trigger homepage_placements_touch
  before update on public.homepage_placements
  for each row execute function public.touch_homepage_placement();


-- ── 3. Helpers ────────────────────────────────────────────────────────────

-- Freelancers share the Services pages, so they share its featured slots.
create or replace function public.homepage_pool_for(p_slot_type text, p_business_id text)
returns text
language sql stable security definer set search_path = public
as $$
  select case
    when not coalesce((select per_business_type from homepage_slot_types where key = p_slot_type), false) then 'all'
    else coalesce((
      select case when l.business_type = 'freelancer' then 'services' else l.business_type end
      from business_listings l where l.business_id = p_business_id
    ), 'other')
  end
$$;

-- Whether one lane is free for the whole of [p_start, p_end).
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
      and p.status <> 'cancelled'
      and p.id is distinct from p_ignore
      and tstzrange(p.starts_at, p.ends_at, '[)') && tstzrange(p_start, p_end, '[)')
  )
$$;

-- The first lane free for the whole of [p_start, p_end), or null.
create or replace function public.homepage_free_lane(
  p_slot_type text, p_pool text, p_start timestamptz, p_end timestamptz, p_ignore uuid default null
)
returns int
language sql stable security definer set search_path = public
as $$
  select min(g.n)::int
  from generate_series(1, (select t.capacity from homepage_slot_types t where t.key = p_slot_type)) as g(n)
  where public.homepage_lane_is_free(p_slot_type, p_pool, g.n, p_start, p_end, p_ignore)
$$;

-- The earliest start at or after p_from with a lane free for p_length.
-- A lane frees up either now or when one of its bookings ends, so those are
-- the only times worth testing.
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
        and p.status <> 'cancelled' and p.ends_at > p_from
    ) c
    order by t
  loop
    if public.homepage_free_lane(p_slot_type, p_pool, candidate, candidate + p_length) is not null then
      return candidate;
    end if;
  end loop;
  return null;
end $$;

-- Unpaid holds whose checkout can no longer complete give their slot back.
create or replace function public.homepage_release_expired_holds(p_slot_type text, p_pool text)
returns void
language sql security definer set search_path = public
as $$
  delete from homepage_placements
  where slot_type = p_slot_type and pool = p_pool
    and status = 'held' and hold_expires_at < now()
$$;

-- Serialises every booking decision for one pool, so "find a free lane, then
-- take it" can't interleave between two buyers (the exclusion constraint is
-- the backstop).
create or replace function public.homepage_lock_pool(p_slot_type text, p_pool text)
returns void
language sql security definer set search_path = public
as $$
  select pg_advisory_xact_lock(hashtext('homepage_slots:' || p_slot_type || ':' || p_pool))
$$;

-- A short public title for whatever a placement shows.
create or replace function public.homepage_content_title(p_kind text, p_id text)
returns text
language sql stable security definer set search_path = public
as $$
  select case p_kind
    when 'news_offer'       then (select title from news_offers where id::text = p_id)
    when 'business_article' then (select title from business_articles where id::text = p_id)
    when 'feature_article'  then (select coalesce(card_heading, title) from feature_articles where id::text = p_id)
    when 'business_event'   then (select title from business_events where id::text = p_id)
    when 'business'         then (select coalesce(nullif(l.name, ''), b.name)
                                  from businesses b left join business_listings l on l.business_id = b.id
                                  where b.id = p_id)
  end
$$;

create or replace function public.homepage_is_owner(p_business_id text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from business_users u
    join businesses b on b.id = u.business_id
    where u.business_id = p_business_id
      and u.auth_user_id = auth.uid()
      and u.role = 'Owner'
      and u.status = 'approved'
      and b.status = 'Approved'
  )
$$;


-- ── 4. What a business sees before buying ─────────────────────────────────

create or replace function public.homepage_slot_availability(p_business_id text default null)
returns table (
  slot_type          text,
  label              text,
  description        text,
  capacity           int,
  duration_days      int,
  price_pence        int,
  bookable           boolean,
  pool               text,
  live_count         int,
  soonest_ending_at  timestamptz,
  soonest_ending     text,
  next_start         timestamptz,
  next_end           timestamptz
)
language plpgsql stable security definer set search_path = public
as $$
#variable_conflict use_column
declare
  t record;
  v_pool text;
  v_start timestamptz;
begin
  for t in select * from homepage_slot_types order by array_position(
    array['spotlight', 'featured_article', 'whats_on', 'featured_business'], key)
  loop
    v_pool := public.homepage_pool_for(t.key, p_business_id);
    v_start := public.homepage_next_start(t.key, v_pool, make_interval(days => t.duration_days));

    slot_type := t.key; label := t.label; description := t.description;
    capacity := t.capacity; duration_days := t.duration_days; price_pence := t.price_pence;
    bookable := t.bookable; pool := v_pool;
    next_start := v_start;
    next_end := v_start + make_interval(days => t.duration_days);

    -- Anything occupying the homepage now (booked, even if not yet approved),
    -- ignoring holds that have lapsed.
    select count(*)::int into live_count
    from homepage_placements p
    where p.slot_type = t.key and p.pool = v_pool
      and p.status not in ('cancelled')
      and not (p.status = 'held' and p.hold_expires_at < now())
      and now() >= p.starts_at and now() < p.ends_at;

    select p.ends_at, public.homepage_content_title(p.content_kind, p.content_id)
      into soonest_ending_at, soonest_ending
    from homepage_placements p
    where p.slot_type = t.key and p.pool = v_pool
      and p.status not in ('cancelled')
      and not (p.status = 'held' and p.hold_expires_at < now())
      and now() >= p.starts_at and now() < p.ends_at
    order by p.ends_at
    limit 1;

    return next;
    soonest_ending_at := null; soonest_ending := null;
  end loop;
end $$;

grant execute on function public.homepage_slot_availability(text) to anon, authenticated;


-- ── 5. Booking ────────────────────────────────────────────────────────────

-- Reserves the next free slot for a business as a 40-minute hold.
create or replace function public.book_homepage_slot(p_business_id text, p_slot_type text)
returns public.homepage_placements
language plpgsql security definer set search_path = public
as $$
declare
  t homepage_slot_types;
  v_pool text;
  v_start timestamptz;
  v_end timestamptz;
  v_lane int;
  v_row homepage_placements;
begin
  if not public.homepage_is_owner(p_business_id) then
    raise exception 'Only the approved owner of this business can book a homepage slot.' using errcode = '42501';
  end if;

  select * into t from homepage_slot_types where key = p_slot_type;
  if not found or not t.bookable then
    raise exception 'This homepage slot is not available to book.' using errcode = 'P0001';
  end if;

  -- Don't take money for a slot the business has nothing to put in.
  if p_slot_type in ('spotlight', 'featured_article') and not exists (
    select 1 from business_articles a where a.business_id = p_business_id and a.status = 'Live'
  ) then
    raise exception 'Publish a news or offer post first — that''s what this slot shows.' using errcode = 'P0001';
  end if;
  if p_slot_type = 'whats_on' and not exists (
    select 1 from business_events e where e.business_id = p_business_id and e.status = 'Live'
  ) then
    raise exception 'Get an event approved first — that''s what this slot shows.' using errcode = 'P0001';
  end if;

  v_pool := public.homepage_pool_for(p_slot_type, p_business_id);
  perform public.homepage_lock_pool(p_slot_type, v_pool);
  perform public.homepage_release_expired_holds(p_slot_type, v_pool);

  -- Starting a new checkout replaces this business's unpaid hold for the same slot.
  delete from homepage_placements
  where business_id = p_business_id and slot_type = p_slot_type and status = 'held';

  v_start := public.homepage_next_start(p_slot_type, v_pool, make_interval(days => t.duration_days));
  if v_start is null then
    raise exception 'No homepage slot is free right now. Please try again later.' using errcode = 'P0001';
  end if;
  v_end := v_start + make_interval(days => t.duration_days);
  v_lane := public.homepage_free_lane(p_slot_type, v_pool, v_start, v_end);

  insert into homepage_placements (
    slot_type, pool, lane, business_id, starts_at, ends_at,
    status, source, hold_expires_at, amount_pence, created_by
  ) values (
    p_slot_type, v_pool, v_lane, p_business_id, v_start, v_end,
    'held', 'purchase', now() + interval '40 minutes', t.price_pence, auth.uid()
  )
  returning * into v_row;

  return v_row;
end $$;

revoke all on function public.book_homepage_slot(text, text) from public, anon;
grant execute on function public.book_homepage_slot(text, text) to authenticated;

-- A business letting go of a hold (e.g. it closed Stripe).
create or replace function public.release_homepage_hold(p_placement_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_business text;
begin
  select business_id into v_business from homepage_placements where id = p_placement_id and status = 'held';
  if v_business is null then return; end if;
  if not public.homepage_is_owner(v_business) then
    raise exception 'Not your booking.' using errcode = '42501';
  end if;
  delete from homepage_placements where id = p_placement_id and status = 'held';
end $$;

revoke all on function public.release_homepage_hold(uuid) from public, anon;
grant execute on function public.release_homepage_hold(uuid) to authenticated;

-- Called by stripe-webhook (service role) once Stripe confirms payment. If the
-- hold somehow lapsed, the business is given the next free slot instead of
-- losing what it paid for.
create or replace function public.settle_homepage_payment(
  p_placement_id uuid,
  p_business_id text,
  p_slot_type text,
  p_session_id text,
  p_payment_intent text,
  p_amount_pence int
)
returns public.homepage_placements
language plpgsql security definer set search_path = public
as $$
declare
  t homepage_slot_types;
  v_row homepage_placements;
  v_pool text;
  v_start timestamptz;
  v_end timestamptz;
  v_lane int;
  v_next_status text;
begin
  -- Already settled (Stripe retries): nothing to do.
  select * into v_row from homepage_placements where stripe_session_id = p_session_id and paid_at is not null;
  if found then return v_row; end if;

  select * into t from homepage_slot_types where key = p_slot_type;
  v_pool := public.homepage_pool_for(p_slot_type, p_business_id);
  perform public.homepage_lock_pool(p_slot_type, v_pool);

  -- A featured business shows its own listing, so it goes straight to review.
  v_next_status := case when p_slot_type = 'featured_business' then 'pending_approval' else 'awaiting_content' end;

  update homepage_placements
  set status = v_next_status,
      content_kind = case when p_slot_type = 'featured_business' then 'business' else content_kind end,
      content_id   = case when p_slot_type = 'featured_business' then p_business_id else content_id end,
      hold_expires_at = null,
      stripe_session_id = p_session_id,
      stripe_payment_intent = p_payment_intent,
      amount_pence = p_amount_pence,
      paid_at = now()
  where id = p_placement_id and status = 'held'
  returning * into v_row;
  if found then return v_row; end if;

  -- The hold is gone: book the next free slot for them.
  perform public.homepage_release_expired_holds(p_slot_type, v_pool);
  v_start := public.homepage_next_start(p_slot_type, v_pool, make_interval(days => t.duration_days));
  if v_start is null then
    raise exception 'Paid homepage booking % could not be placed: no free slot.', p_session_id;
  end if;
  v_end := v_start + make_interval(days => t.duration_days);
  v_lane := public.homepage_free_lane(p_slot_type, v_pool, v_start, v_end);

  insert into homepage_placements (
    slot_type, pool, lane, business_id, starts_at, ends_at, status, source,
    content_kind, content_id,
    amount_pence, stripe_session_id, stripe_payment_intent, paid_at, created_by
  ) values (
    p_slot_type, v_pool, v_lane, p_business_id, v_start, v_end, v_next_status, 'purchase',
    case when p_slot_type = 'featured_business' then 'business' end,
    case when p_slot_type = 'featured_business' then p_business_id end,
    p_amount_pence, p_session_id, p_payment_intent, now(), null
  )
  returning * into v_row;
  return v_row;
end $$;

revoke all on function public.settle_homepage_payment(uuid, text, text, text, text, int) from public, anon, authenticated;
grant execute on function public.settle_homepage_payment(uuid, text, text, text, text, int) to service_role;


-- ── 6. Choosing what the slot shows ───────────────────────────────────────

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
    when v_row.slot_type in ('spotlight', 'featured_article') and p_kind = 'business_article' then
      exists (select 1 from business_articles a where a.id::text = p_content_id
              and a.business_id = v_row.business_id and a.status = 'Live')
    when v_row.slot_type = 'whats_on' and p_kind = 'business_event' then
      exists (select 1 from business_events e where e.id::text = p_content_id
              and e.business_id = v_row.business_id and e.status = 'Live')
    else false
  end;
  if not v_ok then
    raise exception 'Choose one of your own live posts or events for this slot.' using errcode = 'P0001';
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


-- ── 7. Admin scheduling ───────────────────────────────────────────────────

-- Creates or moves an approved placement. Picks a free lane for the requested
-- time; raises if the slot type is full then.
create or replace function public.admin_schedule_placement(
  p_id uuid,
  p_slot_type text,
  p_kind text,
  p_content_id text,
  p_business_id text,
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
returns public.homepage_placements
language plpgsql security definer set search_path = public
as $$
declare
  v_pool text;
  v_lane int;
  v_row homepage_placements;
  v_business text := p_business_id;
begin
  if not public.is_admin() then
    raise exception 'Admins only.' using errcode = '42501';
  end if;
  if p_ends_at <= p_starts_at then
    raise exception 'The end must be after the start.' using errcode = 'P0001';
  end if;

  if v_business is null and p_kind = 'business' then v_business := p_content_id; end if;
  if v_business is null and p_kind = 'business_article' then
    select business_id into v_business from business_articles where id::text = p_content_id;
  end if;
  if v_business is null and p_kind = 'business_event' then
    select business_id into v_business from business_events where id::text = p_content_id;
  end if;
  if v_business is null and p_kind = 'news_offer' then
    select business_id into v_business from news_offers where id::text = p_content_id;
  end if;
  if p_id is not null then
    select coalesce(v_business, business_id) into v_business from homepage_placements where id = p_id;
  end if;

  v_pool := public.homepage_pool_for(p_slot_type, v_business);
  perform public.homepage_lock_pool(p_slot_type, v_pool);
  perform public.homepage_release_expired_holds(p_slot_type, v_pool);

  -- Keep the lane a placement already has when it's still free.
  select lane into v_lane from homepage_placements
  where id = p_id and slot_type = p_slot_type and pool = v_pool;
  if v_lane is null or not public.homepage_lane_is_free(p_slot_type, v_pool, v_lane, p_starts_at, p_ends_at, p_id) then
    v_lane := public.homepage_free_lane(p_slot_type, v_pool, p_starts_at, p_ends_at, p_id);
  end if;
  if v_lane is null then
    raise exception 'SLOT_FULL: every % slot is taken for part of that time.',
      (select label from homepage_slot_types where key = p_slot_type) using errcode = 'P0001';
  end if;

  if p_id is null then
    insert into homepage_placements (
      slot_type, pool, lane, business_id, content_kind, content_id,
      starts_at, ends_at, status, source
    ) values (
      p_slot_type, v_pool, v_lane, v_business, p_kind, p_content_id,
      p_starts_at, p_ends_at, 'approved', 'admin'
    )
    returning * into v_row;
  else
    update homepage_placements
    set slot_type = p_slot_type, pool = v_pool, lane = v_lane,
        business_id = v_business,
        content_kind = coalesce(p_kind, content_kind),
        content_id = coalesce(p_content_id, content_id),
        starts_at = p_starts_at, ends_at = p_ends_at,
        -- Admin choosing the content approves it; moving dates alone doesn't.
        status = case when p_kind is not null then 'approved' else status end,
        rejection_reason = case when p_kind is not null then null else rejection_reason end
    where id = p_id
    returning * into v_row;
  end if;
  return v_row;
end $$;

revoke all on function public.admin_schedule_placement(uuid, text, text, text, text, timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_schedule_placement(uuid, text, text, text, text, timestamptz, timestamptz) to authenticated;


-- ── 8. What the public site reads ─────────────────────────────────────────

-- Approved placements, current and past; the site keeps only those live now
-- (starts_at <= now < ends_at) and re-checks when the next one starts or ends.
create or replace view public.public_homepage_placements
with (security_invoker = false) as
select p.id, p.slot_type, p.pool, p.lane, p.business_id,
       p.content_kind, p.content_id, p.starts_at, p.ends_at
from public.homepage_placements p
where p.status = 'approved'
  and p.content_id is not null;

grant select on public.public_homepage_placements to anon, authenticated;


-- ── 9. Live updates ───────────────────────────────────────────────────────

do $$
declare t text;
begin
  foreach t in array array['homepage_placements', 'homepage_slot_types', 'news_offers'] loop
    execute format('drop trigger if exists broadcast_site_update on public.%I', t);
    execute format(
      'create trigger broadcast_site_update after insert or update or delete on public.%I
         for each statement execute function public.broadcast_site_update()', t);
  end loop;
end $$;


-- ── 10. Move today's homepage picks into bookings (once) ──────────────────
-- Each current pick runs from now for its slot type's normal length; admin
-- can change the dates in Homepage Slots.

do $$
declare
  r record;
  v_len interval;
  v_pool text;
  v_lane int;
begin
  for r in
    select 'spotlight' as slot_type, 'news_offer' as kind, n.id::text as content_id, n.business_id
      from news_offers n where n.featured_on_home and n.status = 'Published'
    union all
    select 'featured_article', 'feature_article', f.id::text, null
      from feature_articles f where f.homepage
    union all
    select 'whats_on', 'business_event', e.id::text, e.business_id
      from business_events e where e.homepage and e.status = 'Live'
    union all
    select 'featured_business', 'business', b.id, b.id
      from businesses b where b.featured and b.status = 'Approved'
  loop
    if exists (select 1 from homepage_placements p
               where p.content_kind = r.kind and p.content_id = r.content_id and p.status <> 'cancelled') then
      continue;
    end if;
    select make_interval(days => duration_days) into v_len from homepage_slot_types where key = r.slot_type;
    v_pool := public.homepage_pool_for(r.slot_type, r.business_id);
    v_lane := public.homepage_free_lane(r.slot_type, v_pool, now(), now() + v_len);
    if v_lane is null then
      raise notice 'No free % slot for % %, skipped', r.slot_type, r.kind, r.content_id;
      continue;
    end if;
    insert into homepage_placements (slot_type, pool, lane, business_id, content_kind, content_id,
                                     starts_at, ends_at, status, source, created_by)
    values (r.slot_type, v_pool, v_lane, r.business_id, r.kind, r.content_id,
            date_trunc('minute', now()), date_trunc('minute', now()) + v_len, 'approved', 'admin', null);
  end loop;
end $$;


-- ── 11. Every live admin news post is public (the Offers page lists them) ──

drop policy if exists "public reads published news_offers" on public.news_offers;
create policy "public reads published news_offers" on public.news_offers
  for select using (status = 'Published');

notify pgrst, 'reload schema';
