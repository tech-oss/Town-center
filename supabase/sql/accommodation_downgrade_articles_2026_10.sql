-- ═══════════════════════════════════════════════════════════════════════════
-- Accommodation: a downgrade or cancellation also settles live articles.
--
-- Each plan includes a number of live articles (Free 0, 5 → 3, 10 → 6,
-- 15+ → 9) plus any extras bought. The limit was only checked when an
-- article went live, so a company that moved to a smaller plan kept every
-- article it already had live — 4 live on a plan allowing 3.
--
--   accommodation_plan_changes.keep_articles
--       the live articles the owner chose to keep when scheduling the
--       change (null until chosen)
--   accommodation_set_plan_change_articles(company, articles)
--       the owner's choice, checked against the new plan's allowance
--   accommodation_after_plan_change()
--       once the plan has changed, any live articles beyond the allowance
--       are hidden — the chosen ones stay, then the most recently updated.
--       Hidden articles are kept and can be put live again with room.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.accommodation_plan_changes add column if not exists keep_articles text[];

-- The live articles a plan change would allow: the target tier's included
-- articles, plus extras bought while the plan stays paid. Back to Free: none.
create or replace function public.accommodation_target_article_allowance(p_company text, p_tier text, p_change text)
returns integer
language sql stable security definer
set search_path = public
as $$
  select case when p_change = 'cancel' then 0 else
    coalesce((select article_allowance from accommodation_plan_tiers where key = p_tier), 0)
    + coalesce((select sum(a.quantity)::int from business_addon_slots a
                 where a.business_id = p_company and a.kind = 'article' and a.expires_at > now()), 0)
  end
$$;
grant execute on function public.accommodation_target_article_allowance(text, text, text) to authenticated;

create or replace function public.accommodation_set_plan_change_articles(p_company text, p_articles text[])
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  ch record;
  lim integer;
  chosen text[] := coalesce(p_articles, '{}');
begin
  if not exists (
    select 1 from public.business_users
    where business_id = p_company and auth_user_id = auth.uid() and role = 'Owner' and status = 'approved'
  ) and not public.is_admin() then
    raise exception 'Only the business owner can change this.' using errcode = '42501';
  end if;
  select * into ch from public.accommodation_plan_changes where business_id = p_company for update;
  if ch is null then raise exception 'There is no plan change waiting.'; end if;
  lim := public.accommodation_target_article_allowance(p_company, ch.target_tier, ch.change);
  if cardinality(chosen) > lim then
    raise exception 'The new plan allows % live articles; % were chosen.', lim, cardinality(chosen);
  end if;
  if exists (select 1 from unnest(chosen) k where not exists (
       select 1 from public.business_articles a where a.id::text = k and a.business_id = p_company and a.status = 'Live')) then
    raise exception 'Choose from your live articles.';
  end if;
  update public.accommodation_plan_changes set keep_articles = chosen, updated_at = now() where business_id = p_company;
end;
$$;
revoke all on function public.accommodation_set_plan_change_articles(text, text[]) from public, anon;
grant execute on function public.accommodation_set_plan_change_articles(text, text[]) to authenticated;

-- As in accommodation_billing_2026_10.sql, with the live-article step added.
create or replace function public.accommodation_after_plan_change(p_company text)
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  claim_role text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '');
  lim integer;
  used integer;
  ch record;
  sub record;
  chosen text[];
  changed integer := 0;
  has_change boolean;
  art_lim integer;
begin
  -- The Stripe webhook (service role) and admin only.
  if (claim_role in ('authenticated', 'anon') or (session_user = 'authenticator' and claim_role <> 'service_role'))
     and not public.is_admin() then
    raise exception 'Not allowed.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.businesses where id = p_company and kind = 'accommodation_company') then
    return 0;
  end if;

  lim := public.accommodation_property_limit(p_company);
  used := public.accommodation_slots_used(p_company);
  select * into ch from public.accommodation_plan_changes where business_id = p_company;
  has_change := found;
  select plan, site_tier_key into sub from public.business_subscriptions where business_id = p_company;

  if used > lim then
    -- The company's choice first (only properties still using a slot), then
    -- the longest-standing live properties, up to the new limit.
    select array_agg(id) into chosen from (
      select b.id
      from public.businesses b
      where b.parent_id = p_company and b.property_state in ('live', 'pending', 'rejected')
      order by (has_change and b.id = any (ch.keep)) desc,
               (b.property_state = 'live') desc,
               b.submitted_at asc, b.id
      limit lim
    ) k;
    changed := public.accommodation_apply_capacity(p_company, coalesce(chosen, '{}'));
  end if;

  -- Live articles beyond what the plan now includes are hidden: the chosen
  -- ones stay, then the most recently updated. Hidden ones are kept.
  art_lim := public.addon_slot_allowance(p_company, 'article');
  update public.business_articles a set status = 'Hidden', updated_at = now()
   where a.business_id = p_company and a.status = 'Live'
     and a.id not in (
       select x.id from public.business_articles x
        where x.business_id = p_company and x.status = 'Live'
        order by (has_change and x.id::text = any (coalesce(ch.keep_articles, '{}'))) desc,
                 x.updated_at desc nulls last, x.id
        limit art_lim);

  -- A scheduled change is done once the plan has reached it.
  if has_change and (
       (ch.change = 'cancel' and coalesce(sub.plan, 'free') <> 'premium')
    or (ch.change = 'downgrade' and sub.site_tier_key = ch.target_tier)
  ) then
    delete from public.accommodation_plan_changes where business_id = p_company;
  end if;
  return changed;
end;
$$;
revoke all on function public.accommodation_after_plan_change(text) from public, anon;
grant execute on function public.accommodation_after_plan_change(text) to authenticated, service_role;

notify pgrst, 'reload schema';
