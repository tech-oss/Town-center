-- ═══════════════════════════════════════════════════════════════════════════
-- Extra article slots — a paid add-on.
--
-- Every business gets 3 live articles. Beyond that it buys slots: 1 for
-- £9.99, 3 for £24.99, 6 for £39.99, each valid 12 months. A slot is not a
-- one-off article — it is a place on the business's profile that the business
-- can re-use, edit and replace as often as it likes for those 12 months.
--
-- Add-ons ride on the Business Visibility subscription: if the subscription
-- is cancelled, unused slots stop counting (the allowance function checks the
-- plan), and they count again if the business resubscribes while they are
-- still inside their 12 months.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.business_article_slots (
  id            uuid primary key default gen_random_uuid(),
  business_id   text not null references public.businesses(id) on delete cascade,
  quantity      int  not null check (quantity > 0),
  amount_pence  int,
  purchased_at  timestamptz not null default now(),
  expires_at    timestamptz not null,
  -- Stripe's session id, so a webhook replay can never grant the slots twice.
  stripe_ref    text unique,
  created_by    uuid
);

create index if not exists business_article_slots_business_idx
  on public.business_article_slots (business_id, expires_at);

alter table public.business_article_slots enable row level security;

drop policy if exists "business reads its own article slots" on public.business_article_slots;
create policy "business reads its own article slots"
  on public.business_article_slots for select
  using (public.homepage_is_owner(business_id) or public.is_admin());

drop policy if exists "admins manage article slots" on public.business_article_slots;
create policy "admins manage article slots"
  on public.business_article_slots for all
  using (public.is_admin()) with check (public.is_admin());


-- ── How many live articles this business is allowed ───────────────────────
-- 3 included, plus every unexpired slot it has bought. Add-ons only count
-- while the Visibility Plan is active.

create or replace function public.article_slot_allowance(p_business_id text)
returns int
language sql stable security definer set search_path = public
as $$
  select 3 + case
    when exists (
      select 1 from business_subscriptions s
      where s.business_id = p_business_id and s.plan = 'premium'
    )
    then coalesce((
      select sum(a.quantity)::int
      from business_article_slots a
      where a.business_id = p_business_id and a.expires_at > now()
    ), 0)
    else 0
  end
$$;

grant execute on function public.article_slot_allowance(text) to anon, authenticated;


-- ── The live-article limit, now allowance-aware ───────────────────────────

create or replace function public.enforce_live_article_limit()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  live_count int;
  allowance  int;
begin
  if new.status <> 'Live' then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('live_articles:' || new.business_id));

  allowance := public.article_slot_allowance(new.business_id);

  select count(*) into live_count
  from public.business_articles
  where business_id = new.business_id
    and status = 'Live'
    and id <> new.id;

  if live_count >= allowance then
    raise exception 'Live article limit reached: at most % articles can be live at once.', allowance
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists business_articles_live_limit on public.business_articles;

create trigger business_articles_live_limit
  before insert or update of status on public.business_articles
  for each row execute function public.enforce_live_article_limit();


-- ── Granting slots after payment ──────────────────────────────────────────
-- Called by the Stripe webhook with the service role. Idempotent on
-- stripe_ref, so a replayed event grants nothing extra.

create or replace function public.grant_article_slots(
  p_business_id text,
  p_quantity int,
  p_amount_pence int,
  p_stripe_ref text
)
returns public.business_article_slots
language plpgsql security definer set search_path = public
as $$
declare
  v_row business_article_slots;
begin
  if p_stripe_ref is not null then
    select * into v_row from business_article_slots where stripe_ref = p_stripe_ref;
    if found then
      return v_row;
    end if;
  end if;

  insert into business_article_slots (business_id, quantity, amount_pence, expires_at, stripe_ref)
  values (p_business_id, p_quantity, p_amount_pence, now() + interval '12 months', p_stripe_ref)
  returning * into v_row;

  return v_row;
end $$;

revoke all on function public.grant_article_slots(text, int, int, text) from public, anon, authenticated;

notify pgrst, 'reload schema';
