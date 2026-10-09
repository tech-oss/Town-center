-- Keep businesses.name in step with the listing's name.
--
-- A business's name lives in two places: business_listings.name (what the
-- website and app show, and what every edit form writes) and businesses.name
-- (what Maidenhead admin's lists and search read). Renaming a business through
-- the listing editor or an approved name change updated only the first, so
-- admin kept finding "The Missing Bean" after it had become "Missing Bean".
--
-- Now any live (not awaiting approval) listing name is copied across as it is
-- saved or approved. A rename that is still pending approval waits until it is
-- approved, the same as the public site. If the new name is already taken by
-- another business, the business keeps its current name rather than failing
-- the save.
--
-- Safe to run more than once.

create or replace function public.sync_business_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n text := nullif(btrim(new.name), '');
begin
  if n is null then return new; end if;
  if coalesce(new.approval_status ->> 'profile', '') = 'Pending Approval' then return new; end if;
  begin
    update public.businesses set name = n where id = new.business_id and name is distinct from n;
  exception when unique_violation then
    -- Another business already has this name; leave this one's as it was.
    null;
  end;
  return new;
end $$;

drop trigger if exists business_listings_sync_name on public.business_listings;
create trigger business_listings_sync_name
  after insert or update of name, approval_status on public.business_listings
  for each row execute function public.sync_business_name();

-- Bring the ones already out of step back in line.
update public.businesses b
set name = btrim(l.name)
from public.business_listings l
where l.business_id = b.id
  and nullif(btrim(l.name), '') is not null
  and btrim(l.name) <> b.name
  and coalesce(l.approval_status ->> 'profile', '') <> 'Pending Approval'
  and not exists (
    select 1 from public.businesses o
    where o.id <> b.id and lower(btrim(o.name)) = lower(btrim(l.name))
  );
