-- ═══════════════════════════════════════════════════════════════════════════
-- Empty the app's notification list (the bell on the home screen) without
-- deleting any notification.
--
-- The bell list is private.public_push_feed: phone notifications sent in the
-- last 60 days. Every notification sent so far is taken out of that list, so
-- the app opens on a clean, empty bell for the store review. Nothing is
-- deleted: admin's push history, the businesses' paid push requests
-- (business_push_requests links to these rows) and their reach figures all
-- stay as they are. New notifications appear in the list as normal.
--
-- To put the old ones back:
--   update public.push_notifications set in_app_feed = true;
--
-- Run once; safe to run again (it only hides what was sent before it ran).
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.push_notifications
  add column if not exists in_app_feed boolean not null default true;

comment on column public.push_notifications.in_app_feed is
  'Shown in the app''s notification list (bell). false = kept on record but hidden from the app.';

-- Same columns, order and limit as before; only the in_app_feed filter is new.
create or replace view private.public_push_feed as
  select id, title, body, url, notif_type, article_title, article_image, sent_at
    from public.push_notifications
   where channels ? 'Mobile'
     and audience = any (array['all', 'users'])
     and sent_at > now() - interval '60 days'
     and in_app_feed
   order by sent_at desc
   limit 30;

with hidden as (
  update public.push_notifications
     set in_app_feed = false
   where in_app_feed
  returning 1
)
select count(*) as notifications_hidden_from_app from hidden;
