-- ═══════════════════════════════════════════════════════════════════════════
-- Accommodation module — Phase 1: data foundation.
--
-- An accommodation management company manages up to 30 properties from one
-- account. Both are rows in public.businesses:
--
--   kind = 'accommodation_company'   the account: users, subscription,
--                                    invoices, the MANAGED BY details.
--                                    Never listed on the public site.
--   kind = 'accommodation_property'  one property: its own listing, page,
--                                    map pin, reviews, FAQs and analytics,
--                                    all keyed by its own business id —
--                                    which is why it is a business row and
--                                    not a separate table: every existing
--                                    pipeline already works per business id.
--   kind = 'standard'                every other business, hotels included.
--                                    Nothing changes for them.
--
-- A property's lifecycle (property_state) is changed ONLY through the
-- functions below, never by writing the column:
--
--   draft ─submit─▶ pending ─approve─▶ live ⇄ hidden (owner)
--                      └─reject─▶ rejected ─submit─▶ pending
--   live ─downgrade/cancel─▶ inactive ─reactivate─▶ live
--   any  ─replace─▶ archived (comes down at once; a new draft takes its slot)
--
-- Slots: pending, live and rejected properties occupy a plan slot; drafts,
-- hidden, inactive and archived ones don't. The limit comes from the
-- company's tier and is enforced here, in the database, by a trigger.
--
-- Plans: a paying company has plan = 'premium' (so every existing paid-
-- feature check keeps working) and site_tier_key naming its tier in
-- accommodation_plan_tiers. Prices there are placeholders, editable without
-- a deploy.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Plan tiers (configuration, not code) ───────────────────────────────

create table if not exists public.accommodation_plan_tiers (
  key                   text primary key,
  name                  text not null,
  max_properties        integer not null check (max_properties between 1 and 30),
  article_allowance     integer not null default 0 check (article_allowance >= 0),
  monthly_price         numeric(10,2) not null default 0,
  yearly_price          numeric(10,2) not null default 0,
  stripe_price_monthly  text,
  stripe_price_yearly   text,
  sort_order            integer not null default 0,
  active                boolean not null default true,
  updated_at            timestamptz not null default now()
);

-- Placeholder prices — to be replaced once the client confirms them.
insert into public.accommodation_plan_tiers
  (key, name, max_properties, article_allowance, monthly_price, yearly_price, sort_order)
values
  ('acc-free', 'Free',          1, 0,   0,    0, 0),
  ('acc-5',    '5 Properties',  5, 3,  49,  490, 1),
  ('acc-10',   '10 Properties', 10, 6, 89,  890, 2),
  ('acc-15',   '15 Properties', 15, 9, 129, 1290, 3),
  ('acc-20',   '20 Properties', 20, 9, 169, 1690, 4),
  ('acc-30',   '30 Properties', 30, 9, 239, 2390, 5)
on conflict (key) do update
  set name = excluded.name,
      max_properties = excluded.max_properties,
      article_allowance = excluded.article_allowance,
      sort_order = excluded.sort_order;
-- (Prices are deliberately NOT overwritten on a re-run, so edits made in
-- admin survive.)

alter table public.accommodation_plan_tiers enable row level security;
drop policy if exists "anyone reads accommodation tiers" on public.accommodation_plan_tiers;
create policy "anyone reads accommodation tiers" on public.accommodation_plan_tiers
  for select using (true);
drop policy if exists "admins manage accommodation tiers" on public.accommodation_plan_tiers;
create policy "admins manage accommodation tiers" on public.accommodation_plan_tiers
  for all using (public.is_admin()) with check (public.is_admin());

-- The company's tier. The column has existed unused; it now means this.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'business_subscriptions_site_tier_fk') then
    alter table public.business_subscriptions
      add constraint business_subscriptions_site_tier_fk
      foreign key (site_tier_key) references public.accommodation_plan_tiers(key) on update cascade;
  end if;
end $$;


-- ── 2. Company / property structure on businesses ─────────────────────────

alter table public.businesses
  add column if not exists kind text not null default 'standard',
  add column if not exists parent_id text references public.businesses(id) on delete cascade,
  add column if not exists property_state text,
  add column if not exists replaces_id text references public.businesses(id) on delete set null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'businesses_kind_check') then
    alter table public.businesses add constraint businesses_kind_check
      check (kind in ('standard', 'accommodation_company', 'accommodation_property'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'businesses_property_shape_check') then
    alter table public.businesses add constraint businesses_property_shape_check
      check ((kind = 'accommodation_property') = (parent_id is not null)
         and (kind = 'accommodation_property') = (property_state is not null));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'businesses_property_state_check') then
    alter table public.businesses add constraint businesses_property_state_check
      check (property_state in ('draft', 'pending', 'live', 'rejected', 'hidden', 'inactive', 'archived'));
  end if;
end $$;

create index if not exists businesses_parent_idx on public.businesses (parent_id) where parent_id is not null;
create index if not exists businesses_kind_idx on public.businesses (kind) where kind <> 'standard';


-- ── 3. Property content columns on business_listings ──────────────────────

alter table public.business_listings
  -- Room / accommodation information: [{name, sleeps, beds, description, amenities[]}]
  add column if not exists rooms jsonb not null default '[]'::jsonb,
  -- A property shows its company's public contact details unless the
  -- company chooses to give it its own (paid plans only).
  add column if not exists contact_source text not null default 'company';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'business_listings_contact_source_check') then
    alter table public.business_listings add constraint business_listings_contact_source_check
      check (contact_source in ('company', 'own'));
  end if;
end $$;


-- ── 4. MANAGED BY details ─────────────────────────────────────────────────
-- Entered deliberately by the company. Registration contact details are
-- never copied here, so nothing becomes public just by registering.

create table if not exists public.accommodation_company_profiles (
  business_id  text primary key references public.businesses(id) on delete cascade,
  name         text,
  logo         text,
  address      text,
  postal_code  text,
  phone        text,
  email        text,
  website      text,
  social       jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

alter table public.accommodation_company_profiles enable row level security;
drop policy if exists "admins manage company profiles" on public.accommodation_company_profiles;
create policy "admins manage company profiles" on public.accommodation_company_profiles
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "members manage their company profile" on public.accommodation_company_profiles;
create policy "members manage their company profile" on public.accommodation_company_profiles
  for all
  using (public.is_approved_business_member(business_id))
  with check (
    public.is_approved_business_member(business_id)
    and exists (select 1 from public.businesses b
                where b.id = business_id and b.kind = 'accommodation_company')
  );


-- ── 5. Membership: a company's users manage its properties ────────────────
-- Every member-facing policy goes through these two helpers, so extending
-- them is what gives a company's Owner and Content Manager access to each
-- property's listing, reviews, articles and events. Users, subscription and
-- billing stay on the company row only; is_business_owner() is deliberately
-- NOT extended, so nobody can create a subscription for a property.

create or replace function public.is_approved_business_member(target_business_id text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_users bu
    join public.businesses b on b.id = bu.business_id
    where bu.auth_user_id = auth.uid()
      and bu.status = 'approved'
      and b.status = 'Approved'
      and (
        bu.business_id = target_business_id
        or bu.business_id = (
          select p.parent_id from public.businesses p
          where p.id = target_business_id and p.kind = 'accommodation_property'
        )
      )
  );
$$;

create or replace function public.feature_article_member(p_business_id text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.business_users u
    where u.auth_user_id = auth.uid()
      and u.status = 'approved'
      and (
        u.business_id = p_business_id
        or u.business_id = (
          select p.parent_id from public.businesses p
          where p.id = p_business_id and p.kind = 'accommodation_property'
        )
      )
  );
$$;

-- One Content Manager per company: already enforced for every business by
-- the existing unique index business_users_one_cm_per_business.


-- ── 6. Limits ─────────────────────────────────────────────────────────────

-- How many properties may occupy a slot. A paying company gets its tier's
-- limit; anything else (free, lapsed, no plan chosen yet) gets 1.
create or replace function public.accommodation_property_limit(p_company text)
returns integer
language sql stable security definer
set search_path = public
as $$
  select coalesce((
    select case when s.plan = 'premium' and t.key <> 'acc-free' then t.max_properties else 1 end
    from public.business_subscriptions s
    left join public.accommodation_plan_tiers t on t.key = s.site_tier_key
    where s.business_id = p_company
  ), 1);
$$;

-- Articles included in the plan (one-off extra slots are on top, as today).
create or replace function public.accommodation_article_allowance(p_company text)
returns integer
language sql stable security definer
set search_path = public
as $$
  select coalesce((
    select case when s.plan = 'premium' then t.article_allowance else 0 end
    from public.business_subscriptions s
    left join public.accommodation_plan_tiers t on t.key = s.site_tier_key
    where s.business_id = p_company
  ), 0);
$$;

create or replace function public.accommodation_slots_used(p_company text)
returns integer
language sql stable security definer
set search_path = public
as $$
  select count(*)::int from public.businesses
  where parent_id = p_company and property_state in ('pending', 'live', 'rejected');
$$;

-- For the dashboard: "7 of 10 property slots used".
create or replace function public.accommodation_slot_usage(p_company text)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not (public.is_approved_business_member(p_company) or public.is_admin()) then
    raise exception 'Not allowed.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'tier',              (select site_tier_key from public.business_subscriptions where business_id = p_company),
    'limit',             public.accommodation_property_limit(p_company),
    'used',              public.accommodation_slots_used(p_company),
    'article_allowance', public.accommodation_article_allowance(p_company)
  );
end;
$$;


-- ── 7. Guard trigger: shape, ownership and slot limit ─────────────────────
-- SECURITY INVOKER on purpose: current_user is then the real caller. A
-- signed-in visitor ('authenticated') can't create a property row or move a
-- lifecycle state directly; the functions below run as their owner and so
-- pass. Admins pass too.

create or replace function public.accommodation_guard()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  trusted boolean := current_user not in ('authenticated', 'anon') or public.is_admin();
  occupying constant text[] := array['pending', 'live', 'rejected'];
  lim integer;
  used integer;
begin
  if tg_op = 'UPDATE' then
    if new.kind is distinct from old.kind or new.parent_id is distinct from old.parent_id then
      raise exception 'A business''s kind and parent company can''t be changed.';
    end if;
    if not trusted and (new.property_state is distinct from old.property_state
                        or new.replaces_id is distinct from old.replaces_id) then
      raise exception 'Property status can only be changed through the property functions.' using errcode = '42501';
    end if;
  else
    if new.kind = 'accommodation_property' and not trusted then
      raise exception 'Properties can only be created through accommodation_create_property().' using errcode = '42501';
    end if;
  end if;

  if new.kind <> 'accommodation_property' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if not exists (select 1 from public.businesses c
                   where c.id = new.parent_id and c.kind = 'accommodation_company') then
      raise exception 'A property must belong to an accommodation company.';
    end if;
    -- A sanity cap on stored properties (drafts, hidden, inactive included).
    if (select count(*) from public.businesses
        where parent_id = new.parent_id and property_state <> 'archived') >= 60 then
      raise exception 'This company already has the maximum number of stored properties.';
    end if;
  end if;

  -- Taking a slot: only when moving INTO an occupying state.
  if new.property_state = any (occupying)
     and (tg_op = 'INSERT' or not (old.property_state = any (occupying))) then
    -- Serialise slot-taking per company so two submits can't both squeeze
    -- into the last slot.
    perform pg_advisory_xact_lock(hashtext('accommodation-slots:' || new.parent_id));
    lim := public.accommodation_property_limit(new.parent_id);
    used := (select count(*) from public.businesses
             where parent_id = new.parent_id and id <> new.id
               and property_state = any (occupying));
    if used >= lim then
      raise exception 'PROPERTY_LIMIT: all % property slots on this plan are in use.', lim
        using hint = 'Upgrade the plan, or hide or delete another property first.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists businesses_accommodation_guard on public.businesses;
create trigger businesses_accommodation_guard
  before insert or update on public.businesses
  for each row execute function public.accommodation_guard();


-- ── 8. Lifecycle functions ────────────────────────────────────────────────

-- The approval history records whole-property decisions too.
alter table public.approval_actions drop constraint if exists approval_actions_entity_type_check;
alter table public.approval_actions add constraint approval_actions_entity_type_check
  check (entity_type in ('listing_tab', 'article', 'review_reply', 'property'));

-- The company that owns a property, after checking the caller may manage it.
create or replace function public.accommodation_property_company(p_property text)
returns text
language plpgsql stable security definer
set search_path = public
as $$
declare company text;
begin
  select parent_id into company from public.businesses
  where id = p_property and kind = 'accommodation_property';
  if company is null then
    raise exception 'Property not found.' using errcode = 'P0002';
  end if;
  if not (public.is_approved_business_member(company) or public.is_admin()) then
    raise exception 'Not allowed.' using errcode = '42501';
  end if;
  return company;
end;
$$;

create or replace function public.accommodation_log(p_company text, p_action text, p_property text, p_title text, p_detail text default null)
returns void
language sql security definer
set search_path = public
as $$
  insert into public.business_activity (business_id, action, entity_type, entity_id, title, detail, actor)
  values (p_company, p_action, 'property', p_property, p_title, p_detail,
          case when public.is_admin() then 'admin' else 'business' end);
$$;

-- New draft property. Returns its id.
create or replace function public.accommodation_create_property(p_company text, p_name text, p_replaces text default null)
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  clean text := btrim(coalesce(p_name, ''));
  new_id text;
begin
  if not (public.is_approved_business_member(p_company) or public.is_admin()) then
    raise exception 'Not allowed.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.businesses where id = p_company and kind = 'accommodation_company') then
    raise exception 'Only an accommodation company can add properties.';
  end if;
  if p_replaces is not null and not exists (
       select 1 from public.businesses where id = p_replaces and parent_id = p_company) then
    raise exception 'The property being replaced must belong to this company.';
  end if;
  if clean = '' or length(clean) > 120 then
    raise exception 'Give the property a name (up to 120 characters).';
  end if;

  new_id := 'biz_' || coalesce(nullif(left(trim(both '-' from regexp_replace(lower(clean), '[^a-z0-9]+', '-', 'g')), 40), ''), 'property')
            || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 5);

  insert into public.businesses (id, name, status, visible, kind, parent_id, property_state, replaces_id)
  values (new_id, clean, 'Approved', true, 'accommodation_property', p_company, 'draft', p_replaces);

  -- A brand-new property is approved as a whole (accommodation_review_property),
  -- so its sections start up to date rather than each waiting for review.
  insert into public.business_listings (business_id, name, business_type, business_type_detail)
  values (new_id, clean, 'accommodation', jsonb_build_object('accommodationRole', 'property'));

  perform public.accommodation_log(p_company, 'property.created', new_id, clean);
  return new_id;
end;
$$;

-- Draft / rejected → pending (takes a slot).
create or replace function public.accommodation_submit_property(p_property text)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  company text := public.accommodation_property_company(p_property);
  st text;
  l record;
begin
  select property_state into st from public.businesses where id = p_property for update;
  if st not in ('draft', 'rejected') then
    raise exception 'Only a draft or rejected property can be submitted (this one is %).', st;
  end if;
  if not exists (select 1 from public.business_subscriptions where business_id = company) then
    raise exception 'Choose a plan before submitting a property.';
  end if;
  select name, address into l from public.business_listings where business_id = p_property;
  if btrim(coalesce(l.name, '')) = '' or btrim(coalesce(l.address, '')) = '' then
    raise exception 'Add the property''s name and address before submitting it.';
  end if;

  update public.businesses set property_state = 'pending' where id = p_property;
  update public.business_listings
    set rejection_reason = coalesce(rejection_reason, '{}'::jsonb) - 'property'
    where business_id = p_property;
  perform public.accommodation_log(company, 'property.submitted', p_property, l.name);
end;
$$;

-- Admin: approve (→ live) or reject (→ rejected, with a reason the owner sees).
create or replace function public.accommodation_review_property(p_property text, p_approve boolean, p_reason text default null)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  company text;
  st text;
  pname text;
begin
  if not public.is_admin() then
    raise exception 'Only Maidenhead admin can review properties.' using errcode = '42501';
  end if;
  select parent_id, property_state, name into company, st, pname
  from public.businesses where id = p_property and kind = 'accommodation_property' for update;
  if company is null then raise exception 'Property not found.'; end if;
  if st <> 'pending' then
    raise exception 'Only a pending property can be reviewed (this one is %).', st;
  end if;

  if p_approve then
    update public.businesses set property_state = 'live' where id = p_property;
    -- Everything submitted with the property is approved with it.
    update public.business_listings
      set approval_status = coalesce((select jsonb_object_agg(k, 'Up to Date')
                                      from jsonb_object_keys(coalesce(approval_status, '{}'::jsonb)) k), '{}'::jsonb),
          pending_snapshot = '{}'::jsonb,
          rejection_reason = coalesce(rejection_reason, '{}'::jsonb) - 'property'
      where business_id = p_property;
  else
    if btrim(coalesce(p_reason, '')) = '' then
      raise exception 'Give a reason so the owner knows what to correct.';
    end if;
    update public.businesses set property_state = 'rejected' where id = p_property;
    update public.business_listings
      set rejection_reason = coalesce(rejection_reason, '{}'::jsonb) || jsonb_build_object('property', btrim(p_reason))
      where business_id = p_property;
  end if;

  insert into public.approval_actions (business_id, entity_type, entity_id, action, reason)
  values (company, 'property', p_property, case when p_approve then 'approve' else 'reject' end,
          case when p_approve then null else btrim(p_reason) end);
  perform public.accommodation_log(company, case when p_approve then 'property.approved' else 'property.rejected' end,
                                   p_property, pname, case when p_approve then null else btrim(p_reason) end);
end;
$$;

-- Owner hides (live → hidden, frees the slot) or unhides (hidden → live, needs a slot).
create or replace function public.accommodation_set_property_hidden(p_property text, p_hidden boolean)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  company text := public.accommodation_property_company(p_property);
  st text;
  pname text;
begin
  select property_state, name into st, pname from public.businesses where id = p_property for update;
  if p_hidden and st <> 'live' then
    raise exception 'Only a live property can be hidden (this one is %).', st;
  end if;
  if not p_hidden and st <> 'hidden' then
    raise exception 'Only a hidden property can be shown again (this one is %).', st;
  end if;
  update public.businesses set property_state = case when p_hidden then 'hidden' else 'live' end
  where id = p_property;
  perform public.accommodation_log(company, case when p_hidden then 'property.hidden' else 'property.unhidden' end, p_property, pname);
end;
$$;

-- Inactive (after a downgrade or cancellation) → live, when a slot is free.
-- It was approved before, so it doesn't go back through review.
create or replace function public.accommodation_reactivate_property(p_property text)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  company text := public.accommodation_property_company(p_property);
  st text;
  pname text;
begin
  select property_state, name into st, pname from public.businesses where id = p_property for update;
  if st <> 'inactive' then
    raise exception 'Only an inactive property can be reactivated (this one is %).', st;
  end if;
  update public.businesses set property_state = 'live' where id = p_property;
  perform public.accommodation_log(company, 'property.reactivated', p_property, pname);
end;
$$;

-- Replace: the old property comes down at once (archived, data kept) and a
-- new draft is created in its place. The slot is freed by the old one and
-- taken again when the new one is submitted. Returns the new draft's id.
create or replace function public.accommodation_replace_property(p_property text, p_new_name text)
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  company text := public.accommodation_property_company(p_property);
  st text;
  pname text;
  new_id text;
begin
  select property_state, name into st, pname from public.businesses where id = p_property for update;
  if st in ('draft', 'archived') then
    raise exception 'A % property can''t be replaced; edit or delete it instead.', st;
  end if;
  update public.businesses set property_state = 'archived' where id = p_property;
  new_id := public.accommodation_create_property(company, p_new_name, p_property);
  perform public.accommodation_log(company, 'property.replaced', p_property, pname, new_id);
  return new_id;
end;
$$;

-- Delete: frees its slot; reviews, analytics etc. go with it (FK cascades).
create or replace function public.accommodation_delete_property(p_property text)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  company text := public.accommodation_property_company(p_property);
  pname text;
begin
  select name into pname from public.businesses where id = p_property;
  delete from public.businesses where id = p_property;
  perform public.accommodation_log(company, 'property.deleted', p_property, pname);
end;
$$;

-- Plan capacity change (downgrade at period end, or cancellation). Called by
-- the Stripe webhook / admin AFTER the subscription tier has been updated.
-- p_keep = the properties the owner chose to keep; every other live one
-- becomes inactive (data kept), and pending/rejected ones go back to draft.
create or replace function public.accommodation_apply_capacity(p_company text, p_keep text[])
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  lim integer := public.accommodation_property_limit(p_company);
  keep text[] := coalesce(p_keep, '{}');
  claim_role text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '');
  changed integer;
begin
  -- Inside a SECURITY DEFINER function current_user is always the owner, so
  -- the caller is identified by the role in their JWT (every API request
  -- carries one). Admin users and the service role (the Stripe webhook) may
  -- call this; signed-in businesses and visitors may not.
  if (claim_role in ('authenticated', 'anon')
      or (session_user = 'authenticator' and claim_role <> 'service_role'))
     and not public.is_admin() then
    raise exception 'Not allowed.' using errcode = '42501';
  end if;
  if cardinality(keep) > lim then
    raise exception 'Keeping % properties but the plan allows %.', cardinality(keep), lim;
  end if;
  if exists (select 1 from unnest(keep) k
             where not exists (select 1 from public.businesses b where b.id = k and b.parent_id = p_company)) then
    raise exception 'Every kept property must belong to this company.';
  end if;

  with moved as (
    update public.businesses
    set property_state = case when property_state = 'live' then 'inactive' else 'draft' end
    where parent_id = p_company
      and property_state in ('live', 'pending', 'rejected')
      and not (id = any (keep))
    returning id
  )
  select count(*) into changed from moved;

  perform public.accommodation_log(p_company, 'properties.capacity', null,
    'Plan allows ' || lim || ' properties', changed || ' set inactive');
  return changed;
end;
$$;

-- Who may call what. Every function checks its caller itself; these grants
-- only keep anonymous visitors and internal helpers out.
revoke all on function public.accommodation_apply_capacity(text, text[]) from public, anon;
grant execute on function public.accommodation_apply_capacity(text, text[]) to authenticated, service_role;
revoke all on function public.accommodation_log(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.accommodation_review_property(text, boolean, text) from public, anon;
grant execute on function public.accommodation_review_property(text, boolean, text) to authenticated;


-- ── 9. Public read path ───────────────────────────────────────────────────
-- public_business_profiles keeps every existing column, in order, with the
-- same values for every standard business. New for accommodation:
--   • a company is never listed (it isn't an accommodation itself);
--   • a property is listed only while live and its company is approved;
--   • a property's plan is its company's plan;
--   • a free property shows only name, address, pin and company details —
--     no hero, photos, description, amenities, rooms, booking, FAQs;
--   • contact details are the company's public ones, unless a paying company
--     gave the property its own (contact_source = 'own');
--   • the logo is always the company's (the map marker and MANAGED BY).
-- Appended columns: kind, parent_id, rooms.

create or replace view public.public_business_profiles as
 SELECT b.id AS business_id,
    COALESCE(NULLIF(l.name, ''::text), b.name) AS name,
    l.business_type,
    COALESCE(l.business_type_detail, '{}'::jsonb) AS business_type_detail,
        CASE WHEN e.paid THEN 'premium'::text ELSE 'free'::text END AS plan,
        CASE WHEN e.is_prop AND NOT e.paid THEN NULL::text ELSE l.hero_image END AS hero_image,
    l.address,
    l.postal_code,
        CASE WHEN e.is_prop THEN (CASE WHEN e.own THEN COALESCE(NULLIF(l.phone, ''), cp.phone) ELSE cp.phone END)
             ELSE l.phone END AS phone,
        CASE WHEN e.is_prop THEN (CASE WHEN e.own THEN COALESCE(NULLIF(l.email, ''), cp.email) ELSE cp.email END)
             ELSE l.email END AS email,
        CASE WHEN e.paid THEN l.tagline ELSE NULL::text END AS tagline,
        CASE WHEN e.paid THEN l.description ELSE NULL::text END AS description,
        CASE WHEN e.is_prop THEN cp.logo WHEN e.paid THEN l.logo ELSE NULL::text END AS logo,
        CASE WHEN e.paid THEN l.hours ELSE NULL::jsonb END AS hours,
        CASE WHEN e.paid THEN l.availability_info ELSE NULL::text END AS availability_info,
        CASE WHEN e.paid THEN l.gallery ELSE NULL::jsonb END AS gallery,
    l.lat,
    l.lng,
        CASE WHEN e.is_prop THEN (CASE WHEN e.own THEN COALESCE(NULLIF(l.website, ''), cp.website) ELSE cp.website END)
             WHEN e.paid THEN l.website ELSE NULL::text END AS website,
        CASE WHEN e.paid THEN l.booking_url ELSE NULL::text END AS booking_url,
        CASE WHEN e.is_prop THEN (CASE WHEN e.own AND l.social IS NOT NULL AND l.social <> '{}'::jsonb THEN l.social ELSE cp.social END)
             WHEN e.paid THEN l.social ELSE NULL::jsonb END AS social,
        CASE WHEN e.paid THEN l.faqs ELSE NULL::jsonb END AS faqs,
        CASE WHEN e.paid THEN l.services_list ELSE NULL::jsonb END AS services_list,
        CASE WHEN e.paid THEN l.areas_covered_list ELSE NULL::jsonb END AS areas_covered_list,
        CASE WHEN e.paid THEN l.why_choose_us ELSE NULL::jsonb END AS why_choose_us,
        CASE WHEN e.paid THEN l.stats ELSE NULL::jsonb END AS stats,
        CASE WHEN e.paid THEN l.skills ELSE NULL::jsonb END AS skills,
        CASE WHEN e.paid THEN l.portfolio ELSE NULL::jsonb END AS portfolio,
        CASE WHEN e.paid THEN l.working_with_me ELSE NULL::jsonb END AS working_with_me,
        CASE WHEN e.paid THEN l.amenities ELSE NULL::jsonb END AS amenities,
        CASE WHEN e.paid THEN l.star_rating ELSE NULL::integer END AS star_rating,
        CASE WHEN e.paid THEN l.check_in_time ELSE NULL::text END AS check_in_time,
        CASE WHEN e.paid THEN l.check_out_time ELSE NULL::text END AS check_out_time,
        CASE WHEN e.paid THEN COALESCE(l.early_checkin, false) ELSE false END AS early_checkin,
        CASE WHEN e.paid THEN COALESCE(l.late_checkout, false) ELSE false END AS late_checkout,
    l.updated_at,
    b.kind,
    b.parent_id,
        CASE WHEN e.paid THEN l0.rooms ELSE NULL::jsonb END AS rooms
   FROM businesses b
     JOIN business_listings l0 ON l0.business_id = b.id
     CROSS JOIN LATERAL ( SELECT (x.a).* FROM ( SELECT listing_as_approved(l0.*) AS a OFFSET 0) x) l
     LEFT JOIN business_subscriptions s ON s.business_id = b.id
     LEFT JOIN businesses pb ON pb.id = b.parent_id
     LEFT JOIN business_subscriptions ps ON ps.business_id = b.parent_id
     LEFT JOIN accommodation_company_profiles cp ON cp.business_id = b.parent_id
     CROSS JOIN LATERAL ( SELECT
         b.kind = 'accommodation_property' AS is_prop,
         COALESCE(CASE WHEN b.kind = 'accommodation_property' THEN ps.plan ELSE s.plan END = 'premium', false) AS paid,
         b.kind = 'accommodation_property'
           AND COALESCE(ps.plan = 'premium', false)
           AND l0.contact_source = 'own' AS own) e
  WHERE b.status = 'Approved'::text
    AND COALESCE(b.visible, true)
    AND b.kind <> 'accommodation_company'
    AND (b.kind <> 'accommodation_property'
         OR (b.property_state = 'live' AND pb.status = 'Approved' AND COALESCE(pb.visible, true)));

-- MANAGED BY: a company's public details, and how many live properties it
-- has. Only companies with at least one live property appear.
create or replace view public.public_accommodation_companies as
 SELECT c.id AS business_id,
    COALESCE(NULLIF(cp.name, ''), c.name) AS name,
    cp.logo,
    cp.address,
    cp.postal_code,
    cp.phone,
    cp.email,
    cp.website,
    COALESCE(cp.social, '{}'::jsonb) AS social,
    n.live_properties
   FROM businesses c
     LEFT JOIN accommodation_company_profiles cp ON cp.business_id = c.id
     CROSS JOIN LATERAL ( SELECT count(*)::int AS live_properties FROM businesses p
                          WHERE p.parent_id = c.id AND p.property_state = 'live') n
  WHERE c.kind = 'accommodation_company'
    AND c.status = 'Approved'
    AND COALESCE(c.visible, true)
    AND n.live_properties > 0;

grant select on public.public_business_profiles to anon, authenticated;
grant select on public.public_accommodation_companies to anon, authenticated;
grant select on public.accommodation_plan_tiers to anon, authenticated;

notify pgrst, 'reload schema';
