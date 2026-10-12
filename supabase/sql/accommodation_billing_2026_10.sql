-- ═══════════════════════════════════════════════════════════════════════════
-- Accommodation module — Phase 4: billing.
--
--   1. accommodation_plan_changes — a downgrade or cancellation the company
--      has scheduled for the end of its billing period, with the properties
--      it chose to keep live. Written by the accommodation-billing function
--      (after Stripe accepts the change); the owner can change which
--      properties stay until it takes effect.
--   2. accommodation_after_plan_change() — run by the Stripe webhook every
--      time a company's subscription changes. If the plan now allows fewer
--      properties than are using a slot, the chosen ones stay live and the
--      rest become inactive (kept, not deleted). With no choice on record,
--      the longest-standing live properties are kept.
--   3. Articles included with the plan follow the company's tier
--      (Free 0, 5 → 3, 10 → 6, 15/20/30 → 9), plus any extras bought.
--   4. A company's Featured Business slot shows one of its properties —
--      never the company itself, which isn't a listing. The company chooses
--      which, and can switch to another live property while the slot runs.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Scheduled plan changes ─────────────────────────────────────────────

create table if not exists public.accommodation_plan_changes (
  business_id   text primary key references public.businesses(id) on delete cascade,
  change        text not null check (change in ('downgrade', 'cancel')),
  target_tier   text not null references public.accommodation_plan_tiers(key) on update cascade,
  target_interval text check (target_interval in ('month', 'year')),
  keep          text[] not null default '{}',
  effective_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.accommodation_plan_changes enable row level security;
drop policy if exists "members read their plan change" on public.accommodation_plan_changes;
create policy "members read their plan change" on public.accommodation_plan_changes
  for select using (public.is_approved_business_member(business_id) or public.is_admin());
-- No write policies: only the billing function (service role) and the
-- function below write it.

-- The owner changes which properties stay live after a scheduled downgrade
-- or cancellation, any time before it takes effect.
create or replace function public.accommodation_set_plan_change_keep(p_company text, p_keep text[])
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  ch record;
  lim integer;
  chosen text[] := coalesce(p_keep, '{}');
begin
  if not exists (
    select 1 from public.business_users
    where business_id = p_company and auth_user_id = auth.uid() and role = 'Owner' and status = 'approved'
  ) and not public.is_admin() then
    raise exception 'Only the business owner can change this.' using errcode = '42501';
  end if;
  select * into ch from public.accommodation_plan_changes where business_id = p_company for update;
  if ch is null then raise exception 'There is no plan change waiting.'; end if;
  lim := (select max_properties from public.accommodation_plan_tiers where key = ch.target_tier);
  if cardinality(chosen) > lim then
    raise exception 'The new plan allows % properties; % were chosen.', lim, cardinality(chosen);
  end if;
  if exists (select 1 from unnest(chosen) k where not exists (
       select 1 from public.businesses b where b.id = k and b.parent_id = p_company
         and b.property_state in ('live', 'pending', 'rejected'))) then
    raise exception 'Choose from the properties currently using a slot.';
  end if;
  update public.accommodation_plan_changes set keep = chosen, updated_at = now() where business_id = p_company;
end;
$$;
revoke all on function public.accommodation_set_plan_change_keep(text, text[]) from public, anon;
grant execute on function public.accommodation_set_plan_change_keep(text, text[]) to authenticated;


-- ── 2. After every subscription change ────────────────────────────────────

create or replace function public.accommodation_after_plan_change(p_company text)
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  claim_role text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '');
  lim integer;
  used integer;
  ch record;
  sub record;
  chosen text[];
  changed integer := 0;
  has_change boolean;
begin
  -- The Stripe webhook (service role) and admin only.
  if (claim_role in ('authenticated', 'anon') or (session_user = 'authenticator' and claim_role <> 'service_role'))
     and not public.is_admin() then
    raise exception 'Not allowed.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.businesses where id = p_company and kind = 'accommodation_company') then
    return 0;
  end if;

  lim := public.accommodation_property_limit(p_company);
  used := public.accommodation_slots_used(p_company);
  select * into ch from public.accommodation_plan_changes where business_id = p_company;
  has_change := found;
  select plan, site_tier_key into sub from public.business_subscriptions where business_id = p_company;

  if used > lim then
    -- The company's choice first (only properties still using a slot), then
    -- the longest-standing live properties, up to the new limit.
    select array_agg(id) into chosen from (
      select b.id
      from public.businesses b
      where b.parent_id = p_company and b.property_state in ('live', 'pending', 'rejected')
      order by (has_change and b.id = any (ch.keep)) desc,
               (b.property_state = 'live') desc,
               b.submitted_at asc, b.id
      limit lim
    ) k;
    changed := public.accommodation_apply_capacity(p_company, coalesce(chosen, '{}'));
  end if;

  -- A scheduled change is done once the plan has reached it.
  if has_change and (
       (ch.change = 'cancel' and coalesce(sub.plan, 'free') <> 'premium')
    or (ch.change = 'downgrade' and sub.site_tier_key = ch.target_tier)
  ) then
    delete from public.accommodation_plan_changes where business_id = p_company;
  end if;
  return changed;
end;
$$;
revoke all on function public.accommodation_after_plan_change(text) from public, anon;
grant execute on function public.accommodation_after_plan_change(text) to authenticated, service_role;


-- ── 3. Articles included with the plan ────────────────────────────────────
-- A standard business gets 3 with the Visibility Plan, as before; an
-- accommodation company gets its tier's allowance. Extras bought are added
-- on top for any paying business.

create or replace function public.addon_slot_allowance(p_business_id text, p_kind text)
returns integer
language sql stable security definer
set search_path = public
as $$
  select case
           when p_kind <> 'article' then 0
           when exists (select 1 from businesses b where b.id = p_business_id and b.kind = 'accommodation_company')
             then public.accommodation_article_allowance(p_business_id)
           else 3
         end
       + case
           when exists (select 1 from business_subscriptions s where s.business_id = p_business_id and s.plan = 'premium')
           then coalesce((select sum(a.quantity)::int from business_addon_slots a
                          where a.business_id = p_business_id and a.kind = p_kind and a.expires_at > now()), 0)
           else 0
         end
$$;


-- ── 4. Featured Business slots show a property ────────────────────────────

-- When a company's Featured Business booking is paid for, it would show the
-- company itself. Point it at the company's longest-standing live property
-- instead (the company can switch it), or leave it waiting for a choice if
-- the company has no live property yet.
create or replace function public.accommodation_featured_default()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  first_live text;
begin
  if new.slot_type <> 'featured_business' or new.content_id is distinct from new.business_id then
    return new;
  end if;
  if not exists (select 1 from businesses where id = new.business_id and kind = 'accommodation_company') then
    return new;
  end if;
  select id into first_live from businesses
  where parent_id = new.business_id and property_state = 'live'
  order by submitted_at, id limit 1;
  if first_live is null then
    new.content_kind := null;
    new.content_id := null;
    if new.status = 'pending_approval' then new.status := 'awaiting_content'; end if;
  else
    new.content_kind := 'business';
    new.content_id := first_live;
  end if;
  return new;
end;
$$;

drop trigger if exists homepage_placements_accommodation_featured on public.homepage_placements;
create trigger homepage_placements_accommodation_featured
  before insert or update of content_id, status on public.homepage_placements
  for each row execute function public.accommodation_featured_default();

-- The company chooses (or switches) which of its live properties its
-- Featured Business slot shows. The property has already been approved, so
-- an approved slot stays approved; one still waiting for a property goes to
-- admin for approval.
create or replace function public.accommodation_assign_featured_property(p_placement uuid, p_property text)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  pl record;
begin
  select * into pl from homepage_placements where id = p_placement for update;
  if pl is null or not public.is_approved_business_member(pl.business_id) then
    raise exception 'Not your booking.' using errcode = '42501';
  end if;
  if pl.slot_type <> 'featured_business' then
    raise exception 'Only a Featured Business slot is assigned to a property.';
  end if;
  if pl.ends_at <= now() then
    raise exception 'This booking has already finished.';
  end if;
  if pl.status not in ('awaiting_content', 'pending_approval', 'approved', 'rejected') then
    raise exception 'This booking can''t be changed.';
  end if;
  if not exists (select 1 from businesses where id = p_property and parent_id = pl.business_id and property_state = 'live') then
    raise exception 'Choose one of your live properties.';
  end if;
  update homepage_placements
  set content_kind = 'business',
      content_id = p_property,
      status = case when pl.status = 'approved' then 'approved' else 'pending_approval' end,
      rejection_reason = case when pl.status = 'approved' then rejection_reason else null end
  where id = p_placement;
  perform public.accommodation_log(pl.business_id, 'placement.assigned', p_property,
    (select name from businesses where id = p_property), 'Featured Business');
end;
$$;
revoke all on function public.accommodation_assign_featured_property(uuid, text) from public, anon;
grant execute on function public.accommodation_assign_featured_property(uuid, text) to authenticated;

notify pgrst, 'reload schema';
