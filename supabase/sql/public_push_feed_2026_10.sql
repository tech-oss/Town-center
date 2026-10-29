-- The app's bell list: notifications admin has sent to phones, newest
-- first, from the last 60 days. Only what the notification itself showed —
-- nothing about who sent it or how many it reached. push_notifications is
-- admin-only, so the app reads this view instead.
create or replace view public.public_push_feed as
select id, title, body, url, notif_type, article_title, article_image, sent_at
from public.push_notifications
where channels ? 'Mobile'
  and audience in ('all', 'users')
  and sent_at > now() - interval '60 days'
order by sent_at desc
limit 30;

grant select on public.public_push_feed to anon, authenticated;
