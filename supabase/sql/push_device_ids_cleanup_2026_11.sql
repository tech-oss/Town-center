-- Run once, a few days after the app builds with phone ids (iPhone build 21,
-- Android build 4) are installed (see push_device_ids_2026_11.sql).
--
-- Removes app entries that never sent a phone id: every phone running the
-- updated app adds its id the moment it's opened, so what's left without one
-- is an old install of the app (deleted or replaced). A phone that somehow
-- still has the old app isn't lost: it signs up again the next time it opens
-- the app, as it does on every launch.

delete from public.push_subscriptions
 where platform in ('ios', 'android')
   and device_id is null;
