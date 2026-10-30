-- Imported business profiles (the spreadsheet import of 4 Oct 2026) start
-- hidden: Maidenhead admin checks each one and makes it live from Business
-- Registrations ("Make live"). Left live: any the business has claimed (an
-- owner login) or that is on a paid or complimentary plan.
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
where b.submitted_at >= '2026-10-04' and b.submitted_at < '2026-10-05'
  and b.status = 'Approved' and coalesce(b.visible, true)
  and not exists (select 1 from public.business_users u where u.business_id = b.id)
  and coalesce((select s.plan from public.business_subscriptions s where s.business_id = b.id), 'free') = 'free'
on conflict do nothing;

update public.businesses set visible = false
where id in (select business_id from public.imported_businesses_hidden);
