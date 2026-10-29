-- iPhone app push: devices from the App Store app register an APNs device
-- token instead of a Web Push subscription. They share push_subscriptions
-- so one send reaches both. An iPhone row has platform 'ios', the endpoint
-- 'apns:<device token>' and no Web Push keys.
alter table public.push_subscriptions
  add column if not exists platform text not null default 'web';

alter table public.push_subscriptions drop constraint if exists push_subscriptions_platform_check;
alter table public.push_subscriptions
  add constraint push_subscriptions_platform_check check (platform in ('web', 'ios'));

alter table public.push_subscriptions alter column p256dh drop not null;
alter table public.push_subscriptions alter column auth drop not null;

alter table public.push_subscriptions drop constraint if exists push_subscriptions_keys_check;
alter table public.push_subscriptions
  add constraint push_subscriptions_keys_check
  check (platform <> 'web' or (p256dh is not null and auth is not null));
