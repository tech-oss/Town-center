-- ═══════════════════════════════════════════════════════════════════════════
-- Homepage slot PACKAGES.
--
-- Until now each homepage slot type had exactly one price and one length, and
-- admin could also change how many slots ran at once. That's now split in two:
--
--   • How many slots exist is FIXED in the database — 4 In the Spotlight,
--     4 Featured Articles, 6 What's On (Featured Business keeps 10 per
--     business type). Admin can't raise it from the panel any more.
--
--   • What a business PAYS is a package: a name, a price and a length. Each
--     slot type can offer up to three active packages, and the business picks
--     one at the point of buying.
--
-- Each package is mirrored into Stripe as a product + price by the
-- stripe-slot-package edge function, so the catalogue in Stripe matches what
-- the site offers.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Slot counts are fixed ──────────────────────────────────────────────

create or replace function public.homepage_slot_max_capacity(p_key text)
returns int
language sql immutable
as $$
  select case p_key
    when 'spotlight'         then 4
    when 'featured_article'  then 4
    when 'whats_on'          then 6
    when 'featured_business' then 10
    else 4
  end
$$;

update public.homepage_slot_types
set capacity = public.homepage_slot_max_capacity(key), updated_at = now()
where capacity is distinct from public.homepage_slot_max_capacity(key);

-- Nothing — not the admin panel, not a stray script — can put the capacity
-- above the fixed number for that slot.
create or replace function public.homepage_slot_types_clamp()
returns trigger language plpgsql as $$
begin
  if new.capacity <> public.homepage_slot_max_capacity(new.key) then
    raise exception 'The number of % slots is fixed at %.',
      new.label, public.homepage_slot_max_capacity(new.key) using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists homepage_slot_types_clamp on public.homepage_slot_types;
create trigger homepage_slot_types_clamp
  before insert or update on public.homepage_slot_types
  for each row execute function public.homepage_slot_types_clamp();


-- ── 2. The packages ───────────────────────────────────────────────────────

create table if not exists public.homepage_slot_packages (
  id                uuid primary key default gen_random_uuid(),
  slot_type         text not null references public.homepage_slot_types(key) on delete cascade,
  name              text not null,
  price_pence       int  not null check (price_pence >= 0),
  duration_days     int  not null check (duration_days between 1 and 365),
  active            boolean not null default true,
  sort_order        int  not null default 0,
  -- The matching Stripe catalogue entries, written by stripe-slot-package.
  stripe_product_id text,
  stripe_price_id   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists homepage_slot_packages_type_idx
  on public.homepage_slot_packages (slot_type, active, sort_order);

-- Three active packages per slot type, no more.
create or replace function public.homepage_slot_packages_limit()
returns trigger language plpgsql as $$
begin
  if new.active and (
    select count(*) from public.homepage_slot_packages
    where slot_type = new.slot_type and active and id is distinct from new.id
  ) >= 3 then
    raise exception 'Each slot can offer three packages. Delete or deactivate one first.'
      using errcode = 'P0001';
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists homepage_slot_packages_limit on public.homepage_slot_packages;
create trigger homepage_slot_packages_limit
  before insert or update on public.homepage_slot_packages
  for each row execute function public.homepage_slot_packages_limit();

alter table public.homepage_slot_packages enable row level security;

drop policy if exists "anyone reads active packages" on public.homepage_slot_packages;
create policy "anyone reads active packages" on public.homepage_slot_packages
  for select using (active or public.is_admin());

drop policy if exists "admins manage packages" on public.homepage_slot_packages;
create policy "admins manage packages" on public.homepage_slot_packages
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.homepage_slot_packages to anon, authenticated;
grant insert, update, delete on public.homepage_slot_packages to authenticated;


-- Seed three packages per slot type, the first matching what that slot
-- charged before. Only ever runs when a slot type has none.
insert into public.homepage_slot_packages (slot_type, name, price_pence, duration_days, sort_order)
select t.key, p.name, p.price_pence, p.duration_days, p.sort_order
from public.homepage_slot_types t
cross join lateral (values
    (t.label || ' · ' || t.duration_days || ' days',     t.price_pence,                    t.duration_days,     1),
    (t.label || ' · ' || (t.duration_days * 2) || ' days', round(t.price_pence * 1.8)::int, t.duration_days * 2, 2),
    (t.label || ' · ' || (t.duration_days * 4) || ' days', round(t.price_pence * 3.2)::int, least(t.duration_days * 4, 365), 3)
  ) as p(name, price_pence, duration_days, sort_order)
where not exists (
  select 1 from public.homepage_slot_packages k where k.slot_type = t.key
);


-- ── 3. What a business sees before buying, per package ────────────────────

drop function if exists public.homepage_package_availability(text);

create function public.homepage_package_availability(p_business_id text default null)
returns table (
  package_id         uuid,
  slot_type          text,
  label              text,
  description        text,
  package_name       text,
  price_pence        int,
  duration_days      int,
  capacity           int,
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
  k record;
  v_pool text;
  v_live int;
  v_end_at timestamptz;
  v_end_title text;
  v_start timestamptz;
begin
  for k in
    select p.id, p.slot_type, p.name, p.price_pence, p.duration_days, p.sort_order,
           t.label, t.description, t.capacity, t.bookable
    from homepage_slot_packages p
    join homepage_slot_types t on t.key = p.slot_type
    where p.active
    order by array_position(array['spotlight', 'featured_article', 'whats_on', 'featured_business'], p.slot_type),
             p.sort_order, p.price_pence
  loop
    v_pool := public.homepage_pool_for(k.slot_type, p_business_id);

    select count(*)::int into v_live
    from homepage_placements p
    where p.slot_type = k.slot_type and p.pool = v_pool
      and p.status <> 'cancelled'
      and not (p.status = 'held' and p.hold_expires_at < now())
      and now() >= p.starts_at and now() < p.ends_at;

    select p.ends_at, public.homepage_content_title(p.content_kind, p.content_id)
      into v_end_at, v_end_title
    from homepage_placements p
    where p.slot_type = k.slot_type and p.pool = v_pool
      and p.status <> 'cancelled'
      and not (p.status = 'held' and p.hold_expires_at < now())
      and now() >= p.starts_at and now() < p.ends_at
    order by p.ends_at
    limit 1;

    v_start := public.homepage_next_start(k.slot_type, v_pool, make_interval(days => k.duration_days));

    package_id := k.id;        slot_type := k.slot_type;   label := k.label;
    description := k.description; package_name := k.name;  price_pence := k.price_pence;
    duration_days := k.duration_days; capacity := k.capacity; bookable := k.bookable;
    pool := v_pool;            live_count := v_live;
    soonest_ending_at := v_end_at; soonest_ending := v_end_title;
    next_start := v_start;     next_end := v_start + make_interval(days => k.duration_days);
    return next;

    v_end_at := null; v_end_title := null;
  end loop;
end $$;

grant execute on function public.homepage_package_availability(text) to anon, authenticated;


-- ── 4. Booking a chosen package ───────────────────────────────────────────

-- The old two-argument form is replaced: a booking is always for a package.
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
  v_row homepage_placements;
begin
  if not public.homepage_is_owner(p_business_id) then
    raise exception 'Only the approved owner of this business can book a homepage slot.' using errcode = '42501';
  end if;

  select * into t from homepage_slot_types where key = p_slot_type;
  if not found or not t.bookable then
    raise exception 'This homepage slot is not available to book.' using errcode = 'P0001';
  end if;

  -- The package sets the price and the length. Without one (an older client),
  -- fall back to the cheapest package this slot offers.
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
  -- A Featured Article slot shows a Featured Article, nothing else.
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

  v_start := public.homepage_next_start(p_slot_type, v_pool, make_interval(days => k.duration_days));
  if v_start is null then
    raise exception 'No homepage slot is free right now. Please try again later.' using errcode = 'P0001';
  end if;
  v_end := v_start + make_interval(days => k.duration_days);
  v_lane := public.homepage_free_lane(p_slot_type, v_pool, v_start, v_end);

  insert into homepage_placements (
    slot_type, pool, lane, business_id, starts_at, ends_at,
    status, source, hold_expires_at, amount_pence, created_by
  ) values (
    p_slot_type, v_pool, v_lane, p_business_id, v_start, v_end,
    'held', 'purchase', now() + interval '40 minutes', k.price_pence, auth.uid()
  )
  returning * into v_row;

  return v_row;
end $$;

revoke all on function public.book_homepage_slot(text, text, uuid) from public, anon;
grant execute on function public.book_homepage_slot(text, text, uuid) to authenticated;


-- ── 5. Settling a payment keeps the package's length ──────────────────────

drop function if exists public.settle_homepage_payment(uuid, text, text, text, text, int);
drop function if exists public.settle_homepage_payment(uuid, text, text, text, text, int, int);

create function public.settle_homepage_payment(
  p_placement_id uuid,
  p_business_id text,
  p_slot_type text,
  p_session_id text,
  p_payment_intent text,
  p_amount_pence int,
  p_duration_days int default null
)
returns public.homepage_placements
language plpgsql security definer set search_path = public
as $$
declare
  v_row homepage_placements;
  v_pool text;
  v_days int;
  v_start timestamptz;
  v_end timestamptz;
  v_lane int;
  v_next_status text;
begin
  select * into v_row from homepage_placements where stripe_session_id = p_session_id and paid_at is not null;
  if found then return v_row; end if;

  v_pool := public.homepage_pool_for(p_slot_type, p_business_id);
  perform public.homepage_lock_pool(p_slot_type, v_pool);

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

  -- The hold is gone: book them the next free slot for the length they paid for.
  v_days := coalesce(
    p_duration_days,
    (select duration_days from homepage_slot_packages
     where slot_type = p_slot_type and active and price_pence = p_amount_pence limit 1),
    (select duration_days from homepage_slot_types where key = p_slot_type)
  );

  perform public.homepage_release_expired_holds(p_slot_type, v_pool);
  v_start := public.homepage_next_start(p_slot_type, v_pool, make_interval(days => v_days));
  if v_start is null then
    raise exception 'Paid homepage booking % could not be placed: no free slot.', p_session_id;
  end if;
  v_end := v_start + make_interval(days => v_days);
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

revoke all on function public.settle_homepage_payment(uuid, text, text, text, text, int, int) from public, anon, authenticated;
grant execute on function public.settle_homepage_payment(uuid, text, text, text, text, int, int) to service_role;


-- ── 6. A Featured Article slot shows a Featured Article ───────────────────

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
              and a.business_id = v_row.business_id and a.status = 'Live')
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
    raise exception 'Choose one of your own live items for this slot.' using errcode = 'P0001';
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
