-- ═══════════════════════════════════════════════════════════════════════════
-- Live updates for the public website and app.
--
-- Whenever public content changes (admin approves, edits or publishes, or a
-- business's plan changes), the database broadcasts a tiny "change" message on
-- the public Realtime channel `site-updates`. Open copies of the site and app
-- then re-read their data through the same public views, so the Free/paid
-- rules still apply — no private row data is ever broadcast.
--
-- Safe to run more than once. A broadcast failure never blocks the write.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.broadcast_site_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    perform realtime.send(
      jsonb_build_object('table', tg_table_name, 'op', tg_op),
      'change',
      'site-updates',
      false
    );
  exception when others then
    null; -- live updates are a nicety; the admin's save must still succeed
  end;
  return null;
end $$;

-- One broadcast per statement (not per row), on every table the public site reads.
do $$
declare t text;
begin
  foreach t in array array[
    'businesses', 'business_listings', 'business_subscriptions',
    'business_articles', 'business_reviews',
    'business_events', 'business_event_occurrences',
    'feature_articles', 'neighbourhood_guides', 'site_content'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists broadcast_site_update on public.%I', t);
      execute format(
        'create trigger broadcast_site_update after insert or update or delete on public.%I
           for each statement execute function public.broadcast_site_update()', t);
    end if;
  end loop;
end $$;
