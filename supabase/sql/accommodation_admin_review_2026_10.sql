-- ═══════════════════════════════════════════════════════════════════════════
-- Accommodation module — Phase 3: admin review.
--
--   1. approval_actions — the record of every property and company-profile
--      decision (written by the review functions) — becomes readable by admin,
--      who can also clear old entries from the queue's history. Nobody else
--      can read it; it had row security on and no policies at all.
--   2. admin_pending_counts() also counts new properties and company profiles
--      waiting for review, so the Approval Queue badge includes them.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

drop policy if exists "admins read approval actions" on public.approval_actions;
create policy "admins read approval actions" on public.approval_actions
  for select using (public.is_admin());
drop policy if exists "admins clear approval actions" on public.approval_actions;
create policy "admins clear approval actions" on public.approval_actions
  for delete using (public.is_admin());

create index if not exists approval_actions_entity_idx on public.approval_actions (entity_type, created_at desc);

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
      -- Owner claims only — a Content Manager is approved by the business
      -- owner that invited or accepted them, not by admin, so one sitting
      -- pending must not nag this badge (see content_manager_flow_2026_09.sql).
      ('users',       'select count(*) from business_users where status = ''pending'' and role = ''Owner'''),
      ('businesses',  'select count(*) from businesses where status = ''Pending'''),
      ('tickets',     'select count(*) from business_tickets where status = ''Open'''),
      ('push',        'select count(*) from business_push_requests where status = ''pending'''),
      -- Accommodation: a new property waiting for its first approval, and a
      -- company's MANAGED BY details waiting for review.
      ('properties',  'select count(*) from businesses where kind = ''accommodation_property'' and property_state = ''pending'''),
      ('company_profiles', 'select count(*) from accommodation_company_profiles where approval_status = ''Pending Approval''')
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
