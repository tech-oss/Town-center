-- ═══════════════════════════════════════════════════════════════════════════
-- Login tracking for the Reporting page's User Activity chart.
--
-- Nothing recorded a sign-in anywhere, so the "logins" line on User Activity
-- had no data behind it at all. Every successful sign-in to the business
-- dashboard or to Maidenhead admin now writes a row here.
--
-- Supabase Auth keeps only each account's LAST sign-in, not a history, so
-- there's nothing earlier to recover. The backfill below seeds one row per
-- account from that last sign-in, so the chart isn't empty from day one;
-- everything from now on is recorded as it happens.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.portal_logins (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null,
  portal        text not null check (portal in ('business', 'admin')),
  business_id   text references public.businesses(id) on delete set null,
  -- true for the one-off rows seeded from Supabase Auth's last sign-in.
  backfilled    boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists portal_logins_created_idx on public.portal_logins (created_at);
create index if not exists portal_logins_portal_idx  on public.portal_logins (portal, created_at);

alter table public.portal_logins enable row level security;

-- Only admin reads them; nobody writes directly — record_login() does that.
drop policy if exists "admins read portal logins" on public.portal_logins;
create policy "admins read portal logins"
  on public.portal_logins for select using (public.is_admin());


-- Records a sign-in by whoever is signed in right now. It can only ever
-- record the caller's own login, so it can't be used to inflate the count.
create or replace function public.record_login(p_portal text, p_business_id text default null)
returns void
language plpgsql volatile security definer set search_path = public
as $$
begin
  if auth.uid() is null or p_portal not in ('business', 'admin') then
    return;
  end if;
  -- A business login is only credited to a business the caller belongs to.
  if p_portal = 'business' and p_business_id is not null and not exists (
    select 1 from business_users u
    where u.auth_user_id = auth.uid() and u.business_id = p_business_id and u.status = 'approved'
  ) then
    p_business_id := null;
  end if;
  insert into portal_logins (auth_user_id, portal, business_id)
  values (auth.uid(), p_portal, case when p_portal = 'business' then p_business_id end);
end $$;

revoke all on function public.record_login(text, text) from public, anon;
grant execute on function public.record_login(text, text) to authenticated;


-- ── One-off backfill from Supabase Auth's last sign-in ────────────────────

insert into public.portal_logins (auth_user_id, portal, business_id, backfilled, created_at)
select u.id,
       case when exists (select 1 from public.admin_users a where a.auth_user_id = u.id) then 'admin' else 'business' end,
       (select bu.business_id from public.business_users bu where bu.auth_user_id = u.id limit 1),
       true,
       u.last_sign_in_at
from auth.users u
where u.last_sign_in_at is not null
  and not exists (select 1 from public.portal_logins p where p.auth_user_id = u.id and p.backfilled);

notify pgrst, 'reload schema';
