-- Every new business profile starts hidden, however it's added (admin
-- registration, the business portal, an import): Maidenhead admin checks it
-- and makes it live from Business Registrations. Accommodation properties are
-- the exception: they have their own approval and only show once their
-- company is live, so hiding them too would leave no way to show them.
alter table public.businesses alter column visible set default false;

create or replace function public.businesses_start_hidden()
returns trigger language plpgsql as $$
begin
  new.visible := coalesce(new.kind, '') = 'accommodation_property';
  return new;
end $$;

drop trigger if exists businesses_start_hidden on public.businesses;
create trigger businesses_start_hidden before insert on public.businesses
for each row execute function public.businesses_start_hidden();

-- Properties hidden by hide_imported_businesses_2026_10.sql are shown again.
update public.businesses set visible = true where kind = 'accommodation_property';
delete from public.imported_businesses_hidden
where business_id in (select id from public.businesses where kind = 'accommodation_property');
