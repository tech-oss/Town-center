-- ═══════════════════════════════════════════════════════════════════════════
-- Database performance, from Supabase's Performance Advisor.
--
-- 1. Access rules that call is_admin() or auth.uid() directly run that call
--    once for every row a query looks at. Written as (select is_admin()) /
--    (select auth.uid()) Postgres runs it once per query instead. Who can
--    see or change what is exactly the same; only the work is less. Applies
--    to every rule in the public schema that still has the direct form.
--
-- 2. Foreign keys without an index: every lookup of, say, a business's
--    reviews, articles or payments scanned the whole table.
--
-- Safe to run more than once. One transaction.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── 1. Run is_admin() / auth.uid() once per query in access rules ──────────

do $$
declare
  p record;
  q text;
  w text;
  wrap text := '(?<![Ss][Ee][Ll][Ee][Cc][Tt] )';
begin
  for p in
    select schemaname, tablename, policyname, qual, with_check
      from pg_policies
     where schemaname = 'public'
       and (coalesce(qual, '') || coalesce(with_check, '')) ~ '(is_admin\(\)|auth\.uid\(\))'
  loop
    q := p.qual;
    w := p.with_check;
    if q is not null then
      q := regexp_replace(q, wrap || 'is_admin\(\)', '(select is_admin())', 'g');
      q := regexp_replace(q, wrap || 'auth\.uid\(\)', '(select auth.uid())', 'g');
    end if;
    if w is not null then
      w := regexp_replace(w, wrap || 'is_admin\(\)', '(select is_admin())', 'g');
      w := regexp_replace(w, wrap || 'auth\.uid\(\)', '(select auth.uid())', 'g');
    end if;
    if q is distinct from p.qual or w is distinct from p.with_check then
      execute format('alter policy %I on %I.%I%s%s',
        p.policyname, p.schemaname, p.tablename,
        case when q is not null then format(' using (%s)', q) else '' end,
        case when w is not null then format(' with check (%s)', w) else '' end);
    end if;
  end loop;
end $$;


-- ── 2. Indexes for foreign keys ─────────────────────────────────────────────

create index if not exists businesses_replaces_id_idx on public.businesses (replaces_id);
create index if not exists business_reviews_business_id_idx on public.business_reviews (business_id);
create index if not exists business_articles_business_id_idx on public.business_articles (business_id);
create index if not exists business_tickets_business_id_idx on public.business_tickets (business_id);
create index if not exists business_subscriptions_site_tier_key_idx on public.business_subscriptions (site_tier_key);
create index if not exists business_payments_business_id_idx on public.business_payments (business_id);
create index if not exists approval_actions_business_id_idx on public.approval_actions (business_id);
create index if not exists admin_logs_actor_id_idx on public.admin_logs (actor_id);
create index if not exists news_offers_business_id_idx on public.news_offers (business_id);
create index if not exists articles_business_id_idx on public.articles (business_id);
create index if not exists push_notifications_sent_by_idx on public.push_notifications (sent_by);
create index if not exists homepage_placements_bumped_by_idx on public.homepage_placements (bumped_by);
create index if not exists portal_logins_business_id_idx on public.portal_logins (business_id);
create index if not exists business_push_requests_notification_id_idx on public.business_push_requests (notification_id);
create index if not exists accommodation_plan_changes_target_tier_idx on public.accommodation_plan_changes (target_tier);
create index if not exists business_user_agreement_acceptances_business_id_idx on public.business_user_agreement_acceptances (business_id);
create index if not exists business_user_agreement_acceptances_version_id_idx on public.business_user_agreement_acceptances (version_id);

commit;
