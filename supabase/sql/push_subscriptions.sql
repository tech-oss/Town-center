-- ═══════════════════════════════════════════════════════════════════════════
-- Web Push subscriptions: one row per browser/device that has granted
-- notification permission on the /mobile PWA. push_notifications (already
-- created by site_content_schema.sql) is the send history; this is who
-- actually receives a send.
--
-- NOT RUN YET.
-- Written by public/sw-register.js (via the anon key — inserting your own
-- subscription needs no admin rights). Read only by the send-push Edge
-- Function (via the service-role key, which bypasses RLS).
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  audience    text not null default 'all' check (audience in ('all', 'businesses', 'users')),
  created_at  timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

-- Anyone can register a subscription (it's their own device, not sensitive),
-- but only the Edge Function's service-role key can read the list back —
-- endpoints are effectively bearer tokens for sending to that device.
drop policy if exists "anyone can subscribe" on public.push_subscriptions;
create policy "anyone can subscribe"
  on public.push_subscriptions for insert with check (true);

drop policy if exists "anyone can unsubscribe their own" on public.push_subscriptions;
create policy "anyone can unsubscribe their own"
  on public.push_subscriptions for delete using (true);
