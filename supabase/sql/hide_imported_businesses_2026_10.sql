-- Every business profile starts hidden: Maidenhead admin checks each one and
-- makes it live from Business Registrations ("Make live"). Asked for on
-- 30 Oct 2026: everything on the platform hidden until it has been checked.
--
-- The hidden ids are kept in imported_businesses_hidden so this can be
-- undone:  update businesses set visible = true
--          where id in (select business_id from imported_businesses_hidden);
create table if not exists public.imported_businesses_hidden (
  business_id text primary key,
  hidden_at   timestamptz not null default now()
);
alter table public.imported_businesses_hidden enable row level security;

insert into public.imported_businesses_hidden (business_id)
select b.id from public.businesses b
where coalesce(b.visible, true)
on conflict do nothing;

update public.businesses set visible = false
where id in (select business_id from public.imported_businesses_hidden);
