-- ═══════════════════════════════════════════════════════════════════════════
-- A business can hold only one Featured Business booking at a time.
--
-- While it has a paid Featured Business booking that hasn't ended (live or
-- still to start), book_homepage_slot() refuses another one. It can book
-- again once that booking has finished. Other slot types are unchanged.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

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
  v_until timestamptz;
begin
  if not public.homepage_is_owner(p_business_id) then
    raise exception 'Only the approved owner of this business can book a homepage slot.' using errcode = '42501';
  end if;

  select * into t from homepage_slot_types where key = p_slot_type;
  if not found or not t.bookable then
    raise exception 'This homepage slot is not available to book.' using errcode = 'P0001';
  end if;

  if p_slot_type = 'whats_on' and not exists (
    select 1 from business_events e where e.business_id = p_business_id and e.status = 'Live'
  ) then
    raise exception 'Get an event approved first — that''s what this slot shows.' using errcode = 'P0001';
  end if;

  v_pool := public.homepage_pool_for(p_slot_type, p_business_id);
  perform public.homepage_lock_pool(p_slot_type, v_pool);
  perform public.homepage_release_expired_holds(p_slot_type, v_pool);

  -- One Featured Business at a time.
  if p_slot_type = 'featured_business' then
    select max(p.ends_at) into v_until
    from homepage_placements p
    where p.business_id = p_business_id
      and p.slot_type = 'featured_business'
      and p.status not in ('held', 'cancelled')
      and p.ends_at > now();
    if v_until is not null then
      raise exception 'Your business is already featured until %. You can book again after that.',
        to_char(v_until at time zone 'Europe/London', 'DD/MM/YYYY HH24:MI') using errcode = 'P0001';
    end if;
  end if;

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

notify pgrst, 'reload schema';
