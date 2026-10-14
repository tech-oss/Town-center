-- ═══════════════════════════════════════════════════════════════════════════
-- Admin → Business Registrations: load the list without every listing's text.
--
-- The list read business_listings(*) for every business — descriptions,
-- galleries, FAQs, rooms, opening hours — about 3 MB, only to show contact
-- details and whether the profile has any content yet. That yes/no is now a
-- column, business_listings.has_content, kept up to date by a trigger on
-- every save, so the list reads it with the few light columns it shows
-- (src/api/admin/businesses.js, LIST_SELECT).
--
-- listing_has_content() is the same test as listingHasContent() in
-- src/api/admin/businessListingContent.js — keep the two in step.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

-- An earlier draft of this file added has_content as a computed field (a
-- function); the column replaces it.
drop function if exists public.has_content(public.business_listings);

-- A jsonb value with something in it, as the JS nonEmpty() reads it: an
-- array with at least one item that isn't empty, an object with a key, a
-- string with a non-space character, true, or a non-zero number.
create or replace function public.jsonb_has_value(v jsonb)
returns boolean
language plpgsql immutable
set search_path = public
as $$
begin
  return case jsonb_typeof(v)
    when 'array' then exists (
      select 1 from jsonb_array_elements(v) e
      where case jsonb_typeof(e)
        when 'null' then false
        when 'boolean' then e = 'true'::jsonb
        when 'number' then e <> '0'::jsonb
        when 'string' then (e #>> '{}') ~ '\S'
        else true
      end)
    when 'object' then v <> '{}'::jsonb
    when 'string' then (v #>> '{}') ~ '\S'
    when 'boolean' then v = 'true'::jsonb
    when 'number' then v <> '0'::jsonb
    else false
  end;
end $$;

create or replace function public.listing_has_content(l public.business_listings)
returns boolean
language plpgsql stable
set search_path = public
as $$
begin
  return coalesce(l.description ~ '\S', false)
      or coalesce(l.tagline ~ '\S', false)
      or coalesce(l.logo ~ '\S', false)
      or coalesce(l.hero_image ~ '\S', false)
      or jsonb_has_value(l.gallery)
      or jsonb_has_value(l.faqs)
      or jsonb_has_value(l.services_list)
      or jsonb_has_value(l.why_choose_us)
      or jsonb_has_value(l.skills)
      or jsonb_has_value(l.portfolio)
      or jsonb_has_value(l.amenities)
      or (jsonb_typeof(l.hours) = 'array' and exists (
            select 1 from jsonb_array_elements(l.hours) h
            where jsonb_typeof(h) = 'object'
              and coalesce(h->'open', 'null'::jsonb) not in ('null'::jsonb, 'false'::jsonb, '0'::jsonb, '""'::jsonb)));
end $$;

alter table public.business_listings add column if not exists has_content boolean not null default false;

create or replace function public.business_listings_set_has_content()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.has_content := listing_has_content(new);
  return new;
end $$;

drop trigger if exists business_listings_has_content on public.business_listings;
create trigger business_listings_has_content
  before insert or update on public.business_listings
  for each row execute function public.business_listings_set_has_content();

-- Existing listings. Only rows whose answer changes are written.
update public.business_listings l
   set has_content = public.listing_has_content(l)
 where has_content is distinct from public.listing_has_content(l);

-- The admin policies on the tables the list reads checked is_admin() once
-- for every row; wrapped in a sub-select Postgres checks it once per query.
-- Same rule, about 40 ms less per table for the ~1,700-row list.
alter policy "admins manage business_listings" on public.business_listings
  using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "admins manage subscriptions" on public.business_subscriptions
  using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "admins manage business_users" on public.business_users
  using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "admins manage addon slots" on public.business_addon_slots
  using ((select public.is_admin())) with check ((select public.is_admin()));

notify pgrst, 'reload schema';
