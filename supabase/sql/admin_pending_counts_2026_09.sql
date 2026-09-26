-- ═══════════════════════════════════════════════════════════════════════════
-- Admin's sidebar badge counts in one request instead of eleven.
--
-- Every admin page load (and a timer while it's open) counted each queue with
-- its own head-only request. Each request is a line in Supabase's log
-- ingestion, which the free plan caps at 1 GB. This returns them all at once.
--
-- SECURITY INVOKER: it runs under the caller's own RLS, exactly as the eleven
-- separate queries did, so it reveals nothing they couldn't already see.
-- A table or column that doesn't exist yet reads 0, as before.
--
-- The listing-approvals count is not here: it compares edited fields against
-- snapshots with rules that live in src/api/admin/approvals.js, and stays there.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.admin_pending_counts()
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  q record;
  n bigint;
  out jsonb := '{}'::jsonb;
begin
  for q in
    select * from (values
      ('slots',       'select count(*) from homepage_placements where status = ''pending_approval'' and ends_at > now()'),
      ('events',      'select count(*) from business_events where status = ''Pending Approval'''),
      ('occurrences', 'select count(*) from business_event_occurrences where review_status = ''Pending Approval'''),
      ('articles',    'select count(*) from business_articles where status = ''Pending Approval'''),
      ('featured',    'select count(*) from feature_articles where author = ''business'' and status = ''Pending Approval'''),
      ('reviews',     'select count(*) from business_reviews where status = ''Pending Approval'''),
      ('replies',     'select count(*) from business_reviews where reply->>''status'' = ''Pending Approval'''),
      ('users',       'select count(*) from business_users where status = ''pending'''),
      ('businesses',  'select count(*) from businesses where status = ''Pending'''),
      ('tickets',     'select count(*) from business_tickets where status = ''Open'''),
      ('push',        'select count(*) from business_push_requests where status = ''pending''')
    ) as v(key, sql)
  loop
    begin
      execute q.sql into n;
    exception when others then
      n := 0; -- a missing table or column must never blank the whole sidebar
    end;
    out := out || jsonb_build_object(q.key, coalesce(n, 0));
  end loop;
  return out;
end $$;

revoke all on function public.admin_pending_counts() from public, anon;
grant execute on function public.admin_pending_counts() to authenticated;

notify pgrst, 'reload schema';

select public.admin_pending_counts();
