-- iPhone push, part 2.
--
-- apns_provider_token: the signed token send-push gives Apple. Apple refuses
-- a new one more often than every 20 minutes (TooManyProviderTokenUpdates),
-- so every start of the function reuses the stored one until it is ~50
-- minutes old. Only the function (service role) reads or writes it.
create table if not exists public.apns_provider_token (
  id         int primary key default 1 check (id = 1),
  token      text not null,
  issued_at  timestamptz not null
);
alter table public.apns_provider_token enable row level security;

-- seen_at: when this device last opened the app's notification list. The
-- number on the app icon is the notifications sent since then.
alter table public.push_subscriptions add column if not exists seen_at timestamptz;

-- The app marks its own device as caught up. The device token is the key,
-- the same as for subscribing.
create or replace function public.push_mark_seen(p_endpoint text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.push_subscriptions set seen_at = now() where endpoint = p_endpoint;
$$;
revoke all on function public.push_mark_seen(text) from public;
grant execute on function public.push_mark_seen(text) to anon, authenticated;
