-- ═══════════════════════════════════════════════════════════════════════════
-- Add-on slots: articles, events and featured articles.
--
-- One model for all three. A business buys slots; each slot is a re-usable
-- place on the platform, not a one-off piece of content. For 12 months the
-- business can edit what sits in a slot, hide it, or replace it entirely —
-- and when an event has finished, put the next one in the same slot.
--
--   article           3 included with the Visibility Plan, then
--                     1 / £9.99 · 3 / £24.99 · 6 / £39.99
--   event             none included
--                     1 / £9.99 · 3 / £24.99 · 6 / £39.99
--   featured_article  none included
--                     1 / £49.99 · 3 / £119.99 · 6 / £199.99
--
-- Being ON THE HOMEPAGE is a separate purchase (homepage_placements) and is
-- not affected by any of this.
--
-- Admin creates events and articles for any business free of charge, so the
-- limits below never apply to an admin.
--
-- Replaces business_article_slots, carrying its rows over.
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.business_addon_slots (
  id            uuid primary key default gen_random_uuid(),
  business_id   text not null references public.businesses(id) on delete cascade,
  kind          text not null check (kind in ('article', 'event', 'featured_article')),
  quantity      int  not null check (quantity > 0),
  amount_pence  int,
  purchased_at  timestamptz not null default now(),
  expires_at    timestamptz not null,
  -- Stripe's session id, so a webhook replay can never grant slots twice.
  stripe_ref    text unique,
  created_by    uuid
);

create index if not exists business_addon_slots_lookup_idx
  on public.business_addon_slots (business_id, kind, expires_at);

-- Carry over anything bought before the table covered more than articles.
insert into public.business_addon_slots (id, business_id, kind, quantity, amount_pence, purchased_at, expires_at, stripe_ref, created_by)
select s.id, s.business_id, 'article', s.quantity, s.amount_pence, s.purchased_at, s.expires_at, s.stripe_ref, s.created_by
from public.business_article_slots s
where not exists (select 1 from public.business_addon_slots a where a.id = s.id)
  and not exists (select 1 from public.business_addon_slots a where a.stripe_ref is not null and a.stripe_ref = s.stripe_ref);

alter table public.business_addon_slots enable row level security;

drop policy if exists "business reads its own addon slots" on public.business_addon_slots;
create policy "business reads its own addon slots"
  on public.business_addon_slots for select
  using (public.homepage_is_owner(business_id) or public.is_admin());

drop policy if exists "admins manage addon slots" on public.business_addon_slots;
create policy "admins manage addon slots"
  on public.business_addon_slots for all
  using (public.is_admin()) with check (public.is_admin());


-- ── How much of each kind a business is allowed ───────────────────────────
-- Included allowance plus every unexpired slot bought. Add-ons only count
-- while the Visibility Plan is active — cancel it and they stop applying,
-- and start again if the business resubscribes inside the 12 months.

create or replace function public.addon_slot_allowance(p_business_id text, p_kind text)
returns int
language sql stable security definer set search_path = public
as $$
  select case p_kind when 'article' then 3 else 0 end + case
    when exists (
      select 1 from business_subscriptions s
      where s.business_id = p_business_id and s.plan = 'premium'
    )
    then coalesce((
      select sum(a.quantity)::int
      from business_addon_slots a
      where a.business_id = p_business_id and a.kind = p_kind and a.expires_at > now()
    ), 0)
    else 0
  end
$$;

grant execute on function public.addon_slot_allowance(text, text) to anon, authenticated;

-- Kept so anything still calling the article-only name keeps working.
create or replace function public.article_slot_allowance(p_business_id text)
returns int
language sql stable security definer set search_path = public
as $$
  select public.addon_slot_allowance(p_business_id, 'article')
$$;

grant execute on function public.article_slot_allowance(text) to anon, authenticated;


-- ── Live article limit, reading the shared allowance ──────────────────────

create or replace function public.enforce_live_article_limit()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  live_count int;
  allowance  int;
begin
  if new.status <> 'Live' then
    return new;
  end if;
  -- Admin publishes for a business free of charge.
  if public.is_admin() then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('live_articles:' || new.business_id));

  allowance := public.addon_slot_allowance(new.business_id, 'article');

  select count(*) into live_count
  from public.business_articles
  where business_id = new.business_id
    and status = 'Live'
    and id <> new.id;

  if live_count >= allowance then
    raise exception 'Live article limit reached: at most % articles can be live at once.', allowance
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists business_articles_live_limit on public.business_articles;

create trigger business_articles_live_limit
  before insert or update of status on public.business_articles
  for each row execute function public.enforce_live_article_limit();


-- ── Live event limit ──────────────────────────────────────────────────────
-- An event slot holds one event at a time. A recurring event is still one
-- event — the same details repeating — so it takes one slot, not one per
-- occurrence. A finished or hidden event frees its slot for the next one.

create or replace function public.enforce_live_event_limit()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  live_count int;
  allowance  int;
begin
  -- Only counting events that are actually out there.
  if new.status not in ('Live', 'Pending Approval') then
    return new;
  end if;
  -- A town event admin created, or one admin published for a business.
  if new.business_id is null or public.is_admin() then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('live_events:' || new.business_id));

  allowance := public.addon_slot_allowance(new.business_id, 'event');

  select count(*) into live_count
  from public.business_events
  where business_id = new.business_id
    and status in ('Live', 'Pending Approval')
    and id <> new.id;

  if live_count >= allowance then
    if allowance = 0 then
      raise exception 'You need an event slot to put an event on the site. Buy one in Subscriptions & Billing.'
        using errcode = 'check_violation';
    end if;
    raise exception 'Event slot limit reached: at most % event(s) can be on the site at once.', allowance
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists business_events_live_limit on public.business_events;

create trigger business_events_live_limit
  before insert or update of status on public.business_events
  for each row execute function public.enforce_live_event_limit();


-- ── Granting slots after payment ──────────────────────────────────────────
-- Called by the Stripe webhook with the service role. Idempotent on
-- stripe_ref, so a replayed event grants nothing extra.

create or replace function public.grant_addon_slots(
  p_business_id text,
  p_kind text,
  p_quantity int,
  p_amount_pence int,
  p_stripe_ref text
)
returns public.business_addon_slots
language plpgsql security definer set search_path = public
as $$
declare
  v_row business_addon_slots;
begin
  if p_kind not in ('article', 'event', 'featured_article') then
    raise exception 'Unknown add-on kind: %', p_kind using errcode = 'P0001';
  end if;

  if p_stripe_ref is not null then
    select * into v_row from business_addon_slots where stripe_ref = p_stripe_ref;
    if found then
      return v_row;
    end if;
  end if;

  insert into business_addon_slots (business_id, kind, quantity, amount_pence, expires_at, stripe_ref)
  values (p_business_id, p_kind, p_quantity, p_amount_pence, now() + interval '12 months', p_stripe_ref)
  returning * into v_row;

  return v_row;
end $$;

revoke all on function public.grant_addon_slots(text, text, int, int, text) from public, anon, authenticated;

-- The article-only name the currently deployed webhook calls, kept working.
-- Dropped first: it used to return business_article_slots, and a replace
-- cannot change a function's return type (42P13).
drop function if exists public.grant_article_slots(text, int, int, text);

create function public.grant_article_slots(
  p_business_id text,
  p_quantity int,
  p_amount_pence int,
  p_stripe_ref text
)
returns public.business_addon_slots
language sql security definer set search_path = public
as $$
  select public.grant_addon_slots(p_business_id, 'article', p_quantity, p_amount_pence, p_stripe_ref)
$$;

revoke all on function public.grant_article_slots(text, int, int, text) from public, anon, authenticated;

notify pgrst, 'reload schema';
