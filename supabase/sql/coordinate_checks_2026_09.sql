-- ═══════════════════════════════════════════════════════════════════════════
-- Reject impossible map coordinates at the database.
--
-- Solas was saved with lng '-06997804401239999' (a dropped decimal point).
-- leaflet.markercluster loops forever on a value that size, which froze the
-- homepage and the app map. The admin form and save calls now refuse such
-- values, but the business dashboard and any direct edit write here too, so
-- the table itself has to say no.
--
-- Blank/null stays allowed (no pin). Works whether lat/lng are text or numeric.
-- If a constraint fails to add, an existing row is still bad: the error names
-- the table; fix that row, then run this again.
-- ═══════════════════════════════════════════════════════════════════════════

-- Existing rows with the same dropped-decimal typo. A constraint can't be
-- added while any row breaks it, so these are corrected first.
update public.business_listings set lng = '-0.7157608728476812' where business_id = 'biz_maidenhead-mini-golf-d4ph8' and lng = '-07157608728476812';
update public.business_listings set lng = '-0.7467960617027777' where business_id = 'biz_norden-farm-siizn'         and lng = '-07467960617027777';

create or replace function public.coord_in_range(value text, lo numeric, hi numeric)
returns boolean
language plpgsql immutable
as $$
declare n numeric;
begin
  if value is null or btrim(value) = '' then return true; end if;
  begin
    n := btrim(value)::numeric;
  exception when others then
    return false;
  end;
  return n between lo and hi;
end $$;

alter table public.business_listings drop constraint if exists business_listings_lat_valid;
alter table public.business_listings add constraint business_listings_lat_valid
  check (public.coord_in_range(lat::text, -90, 90));
alter table public.business_listings drop constraint if exists business_listings_lng_valid;
alter table public.business_listings add constraint business_listings_lng_valid
  check (public.coord_in_range(lng::text, -180, 180));

alter table public.business_events drop constraint if exists business_events_lat_valid;
alter table public.business_events add constraint business_events_lat_valid
  check (public.coord_in_range(lat::text, -90, 90));
alter table public.business_events drop constraint if exists business_events_lng_valid;
alter table public.business_events add constraint business_events_lng_valid
  check (public.coord_in_range(lng::text, -180, 180));

alter table public.properties drop constraint if exists properties_lat_valid;
alter table public.properties add constraint properties_lat_valid
  check (public.coord_in_range(lat::text, -90, 90));
alter table public.properties drop constraint if exists properties_lng_valid;
alter table public.properties add constraint properties_lng_valid
  check (public.coord_in_range(lng::text, -180, 180));
