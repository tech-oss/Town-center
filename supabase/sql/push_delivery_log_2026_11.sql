-- What Apple (or a browser's push service) answered for each device on each
-- send, so a notification that didn't arrive can be explained.
--
-- kind: 'send' (a real notification) or 'check' (a silent test that shows
-- nothing on the phone). device is the last 8 characters of the address only.
-- Written and read only by the send-push function (service role).
create table if not exists public.push_delivery_log (
  id               bigint generated always as identity primary key,
  created_at       timestamptz not null default now(),
  kind             text not null check (kind in ('send', 'check')),
  notification_id  uuid,
  subscription_id  uuid,
  platform         text,
  device           text,
  registered_at    timestamptz,
  ok               boolean not null,
  status           int,
  reason           text,
  host             text,
  attempts         int
);
create index if not exists push_delivery_log_created_idx on public.push_delivery_log (created_at desc);
alter table public.push_delivery_log enable row level security;
revoke all on public.push_delivery_log from anon, authenticated;
