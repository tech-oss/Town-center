-- Push figures that match real people.
--
-- A phone gets a new notification address each time the app is reinstalled
-- (testers do this with every TestFlight build), and Apple keeps accepting
-- notifications for the old address for days or weeks before reporting it
-- gone. So "devices reached" counted old installs too. A device that opened
-- the app in the last 30 days (push_subscriptions.seen_at, set on launch) is
-- one someone is actually using; these figures count those.
--
-- push_notifications.active_reach: of the devices it reached, how many had
-- opened the app in the 30 days before it was sent.
-- push_device_summary(): devices signed up, and how many are active — for
-- admin's Push Notifications page.
-- Safe to run more than once.

alter table public.push_notifications add column if not exists active_reach integer;

create or replace function public.push_device_summary()
returns table(registered integer, active_30d integer, active_7d integer, ios integer, web integer)
language sql stable security definer
set search_path = public
as $$
  select count(*)::int,
         count(*) filter (where seen_at > now() - interval '30 days')::int,
         count(*) filter (where seen_at > now() - interval '7 days')::int,
         count(*) filter (where platform = 'ios')::int,
         count(*) filter (where coalesce(platform, 'web') <> 'ios')::int
    from push_subscriptions
   where (select is_admin())
$$;
revoke all on function public.push_device_summary() from public, anon;
grant execute on function public.push_device_summary() to authenticated;

notify pgrst, 'reload schema';
