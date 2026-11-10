-- push_notifications.tried: how many devices a notification was sent to, next
-- to reach (how many confirmed receiving it), so admin's list reads
-- "6 of 15 reached". The gap is addresses that no longer exist (the app was
-- deleted or reinstalled), which are removed as they're found.
-- Filled in for past sends from push_delivery_log. Safe to run more than once.

alter table public.push_notifications add column if not exists tried integer;

update public.push_notifications n
   set tried = l.tried
  from (select notification_id, count(*)::int as tried
          from public.push_delivery_log where kind = 'send' and notification_id is not null
         group by notification_id) l
 where l.notification_id = n.id and n.tried is null;

notify pgrst, 'reload schema';
