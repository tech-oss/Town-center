-- ═══════════════════════════════════════════════════════════════════════════
-- Homepage slots: choose any post, or write one for the slot.
--
-- In the Spotlight and Featured Article bookings can now show:
--   • any of the business's own News & Offers posts that is live or waiting
--     for approval (Visibility Plan businesses), or
--   • a post written for the slot inside the booking itself. This works for
--     every business, Free included: it is saved as an admin News & Offers
--     post (news_offers) for that business, hidden until admin approves the
--     booking, then published — so it also lists on the Offers page.
--
-- A business no longer needs a live post before paying for these two slots.
-- Needs homepage_slot_bookings_2026_09.sql. Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. A business can read its own news_offers (drafts included) ──────────

drop policy if exists "businesses read own news_offers" on public.news_offers;
create policy "businesses read own news_offers" on public.news_offers
  for select using (
    exists (
      select 1 from public.business_users u
      where u.business_id = news_offers.business_id
        and u.auth_user_id = auth.uid()
        and u.status = 'approved'
    )
  );


-- ── 2. Booking: only What's On still needs content up front ───────────────

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


-- ── 3. Choosing an existing post or event ─────────────────────────────────

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
    -- Any of its own posts that is live or waiting for approval.
    when v_row.slot_type in ('spotlight', 'featured_article') and p_kind = 'business_article' then
      exists (select 1 from business_articles a where a.id::text = p_content_id
              and a.business_id = v_row.business_id and a.status in ('Live', 'Pending Approval'))
    -- A post written for a slot (see save_placement_post).
    when v_row.slot_type in ('spotlight', 'featured_article') and p_kind = 'news_offer' then
      exists (select 1 from news_offers n where n.id::text = p_content_id
              and n.business_id = v_row.business_id and n.status in ('Draft', 'Published'))
    when v_row.slot_type = 'whats_on' and p_kind = 'business_event' then
      exists (select 1 from business_events e where e.id::text = p_content_id
              and e.business_id = v_row.business_id and e.status = 'Live')
    else false
  end;
  if not v_ok then
    raise exception 'Choose one of your own posts or events for this slot.' using errcode = 'P0001';
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


-- ── 4. Writing a post for the slot (any plan) ─────────────────────────────
-- Creates the post, or edits the one already written for this booking while
-- it's still unpublished, and sends the booking for approval.

create or replace function public.save_placement_post(
  p_placement_id uuid,
  p_type text,
  p_title text,
  p_excerpt text,
  p_body text,
  p_image text,
  p_start_date date default null,
  p_end_date date default null
)
returns public.homepage_placements
language plpgsql security definer set search_path = public
as $$
declare
  v_row homepage_placements;
  v_business_name text;
  v_post_id uuid;
  v_type text := case when lower(coalesce(p_type, '')) = 'offer' then 'offer' else 'news' end;
begin
  select * into v_row from homepage_placements where id = p_placement_id;
  if not found or not public.homepage_is_owner(v_row.business_id) then
    raise exception 'Not your booking.' using errcode = '42501';
  end if;
  if v_row.slot_type not in ('spotlight', 'featured_article') then
    raise exception 'This slot shows an event or listing, not a post.' using errcode = 'P0001';
  end if;
  if v_row.status not in ('awaiting_content', 'pending_approval', 'rejected', 'approved') then
    raise exception 'This booking can''t be changed.' using errcode = 'P0001';
  end if;
  if v_row.ends_at <= now() then
    raise exception 'This booking has already finished.' using errcode = 'P0001';
  end if;
  if coalesce(btrim(p_title), '') = '' or coalesce(btrim(p_excerpt), '') = '' then
    raise exception 'Add a title and a short summary.' using errcode = 'P0001';
  end if;
  if length(p_title) > 120 or length(p_excerpt) > 300 or length(coalesce(p_body, '')) > 5000 then
    raise exception 'The post is too long.' using errcode = 'P0001';
  end if;
  if p_start_date is not null and p_end_date is not null and p_end_date < p_start_date then
    raise exception 'The end date must be on or after the start date.' using errcode = 'P0001';
  end if;

  select coalesce(nullif(l.name, ''), b.name) into v_business_name
  from businesses b left join business_listings l on l.business_id = b.id
  where b.id = v_row.business_id;

  -- Edit the draft already written for this booking, if there is one.
  if v_row.content_kind = 'news_offer' then
    select n.id into v_post_id from news_offers n
    where n.id::text = v_row.content_id and n.business_id = v_row.business_id and n.status = 'Draft';
  end if;

  if v_post_id is not null then
    update news_offers
    set type = v_type, category = case when v_type = 'offer' then 'Offer' else 'News' end,
        title = btrim(p_title), excerpt = btrim(p_excerpt), body = nullif(btrim(coalesce(p_body, '')), ''),
        image = nullif(p_image, ''), start_date = p_start_date, end_date = p_end_date,
        business_name = v_business_name, updated_at = now()
    where id = v_post_id;
  else
    insert into news_offers (
      slug, business_id, business_name, type, category, title, excerpt, body, image,
      start_date, end_date, status, pay_type
    ) values (
      regexp_replace(lower(btrim(p_title)), '[^a-z0-9]+', '-', 'g') || '-' || substr(gen_random_uuid()::text, 1, 6),
      v_row.business_id, v_business_name, v_type,
      case when v_type = 'offer' then 'Offer' else 'News' end,
      btrim(p_title), btrim(p_excerpt), nullif(btrim(coalesce(p_body, '')), ''), nullif(p_image, ''),
      p_start_date, p_end_date, 'Draft', 'Paid'
    )
    returning id into v_post_id;
  end if;

  update homepage_placements
  set content_kind = 'news_offer', content_id = v_post_id::text,
      status = 'pending_approval', rejection_reason = null
  where id = p_placement_id
  returning * into v_row;
  return v_row;
end $$;

revoke all on function public.save_placement_post(uuid, text, text, text, text, text, date, date) from public, anon;
grant execute on function public.save_placement_post(uuid, text, text, text, text, text, date, date) to authenticated;

notify pgrst, 'reload schema';
