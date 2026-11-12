-- Android app push: devices from the Google Play app register a Firebase
-- Cloud Messaging token. Like the iPhone app's, it's kept in
-- push_subscriptions so one send reaches every kind of device: platform
-- 'android', endpoint 'fcm:<token>', no Web Push keys. send-push delivers
-- them through FCM (the FCM_SERVICE_ACCOUNT function secret).
--
-- push_device_summary() also counts Android devices now (its result gains a
-- column, so it is dropped and made again).
-- Safe to run more than once.

alter table public.push_subscriptions drop constraint if exists push_subscriptions_platform_check;
alter table public.push_subscriptions
  add constraint push_subscriptions_platform_check check (platform in ('web', 'ios', 'android'));

drop function if exists public.push_device_summary();
create function public.push_device_summary()
returns table(registered integer, active_30d integer, active_7d integer, ios integer, android integer, web integer)
language sql stable security definer
set search_path = public
as $$
  select count(*)::int,
         count(*) filter (where seen_at > now() - interval '30 days')::int,
         count(*) filter (where seen_at > now() - interval '7 days')::int,
         count(*) filter (where platform = 'ios')::int,
         count(*) filter (where platform = 'android')::int,
         count(*) filter (where coalesce(platform, 'web') = 'web')::int
    from push_subscriptions
   where (select is_admin())
$$;
revoke all on function public.push_device_summary() from public, anon;
grant execute on function public.push_device_summary() to authenticated;

notify pgrst, 'reload schema';
