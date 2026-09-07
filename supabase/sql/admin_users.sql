-- ═══════════════════════════════════════════════════════════════════════════
-- Admin accounts. Gates /admin/* — a Supabase Auth account only reaches the
-- control panel if it has an active row here (see src/admin/hooks/useAdminAuth.js).
--
-- After running, create the first admin by signing up a normal Supabase Auth
-- user (Authentication → Users → Add user) and then inserting a row here with
-- that user's uid — see the seed statement commented out at the bottom.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.admin_users (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null unique references auth.users(id) on delete cascade,
  name          text not null,
  email         text not null,
  role          text not null default 'Admin' check (role in ('Super Admin', 'Admin', 'Moderator')),
  status        text not null default 'active' check (status in ('active', 'disabled')),
  created_at    timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Helper used by every admin-write policy across the schema. SECURITY DEFINER
-- so it can read admin_users without the caller needing its own select policy,
-- which would otherwise recurse through the policy below.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where auth_user_id = auth.uid() and status = 'active'
  );
$$;

-- An admin reads their own row (that's the session lookup) and, if an admin,
-- every row (the Users/admins management screen).
create policy "admins read admin_users"
  on public.admin_users for select
  using (auth_user_id = auth.uid() or public.is_admin());

create policy "admins manage admin_users"
  on public.admin_users for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── Admin write access to the business-side tables ─────────────────────────
-- The business portal's own policies scope each business to its own rows;
-- these add a parallel "admins can see and moderate everything" grant.
create policy "admins manage businesses"          on public.businesses                  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage business_users"      on public.business_users              for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage business_listings"   on public.business_listings           for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage business_events"     on public.business_events             for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage occurrences"         on public.business_event_occurrences  for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage business_articles"   on public.business_articles           for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage business_reviews"    on public.business_reviews            for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage subscriptions"       on public.business_subscriptions      for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage business_tickets"    on public.business_tickets            for all using (public.is_admin()) with check (public.is_admin());

-- ── Seed the first admin ───────────────────────────────────────────────────
-- Replace the email with the Auth user you created, then uncomment and run:
--
-- insert into public.admin_users (auth_user_id, name, email, role)
-- select id, 'Site Admin', email, 'Super Admin' from auth.users where email = 'you@example.com';
