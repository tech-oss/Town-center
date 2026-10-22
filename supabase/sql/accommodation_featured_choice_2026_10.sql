-- ═══════════════════════════════════════════════════════════════════════════
-- Accommodation: the company chooses which property its Featured Business
-- slot shows.
--
-- A company's Featured Business booking (bought, or given by Maidenhead
-- admin) was pointed at its longest-standing live property automatically, so
-- the property promoted looked chosen at random. The booking now waits for
-- the company's choice (accommodation_assign_featured_property, from the
-- business portal): nothing is shown until it picks a property, and it can
-- switch to another while the slot runs. A booking admin points at a
-- specific property is left as it is.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.accommodation_featured_default()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  -- Only a booking pointed at the company itself (a company isn't a listing).
  if new.slot_type <> 'featured_business' or new.content_id is distinct from new.business_id then
    return new;
  end if;
  if not exists (select 1 from businesses where id = new.business_id and kind = 'accommodation_company') then
    return new;
  end if;
  -- Wait for the company to choose a property. A paid booking waiting for
  -- approval waits for the choice first; one admin already approved stays
  -- approved and goes on the site as soon as a property is chosen.
  new.content_kind := null;
  new.content_id := null;
  if new.status = 'pending_approval' then new.status := 'awaiting_content'; end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';
