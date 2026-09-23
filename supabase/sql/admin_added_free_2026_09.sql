-- ═══════════════════════════════════════════════════════════════════════════
-- Content Maidenhead adds for a business is free, and must not eat that
-- business's purchased slots.
--
-- Where each kind already stood:
--
--   Featured Articles  correct. feature_articles.author tells admin-written
--                      from business-written, and the limit counts only
--                      author = 'business'.
--   News & Offers      correct by accident: an admin post is a row in
--                      news_offers, a different table from the business's own
--                      business_articles, so it was never in the count.
--   Events             WRONG. business_events has no author column, so an
--                      event admin created for a business was indistinguishable
--                      from one the business created, and used up a slot the
--                      business had paid for.
--
-- This adds that column and teaches the event limit to ignore admin-added
-- events.
--
-- It also removes the blanket `if public.is_admin() then return new` from both
-- the event and Featured Article limits. That was meant to let admin publish
-- free content, which the author column now expresses properly — but what it
-- actually did was skip the check whenever ADMIN APPROVED A BUSINESS'S OWN
-- submission, letting a business past a limit it had not paid to raise. It was
-- the same hole already fixed for articles in article_limit_admin_2026_09.sql.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Who added it ───────────────────────────────────────────────────────

alter table public.business_events
  add column if not exists author text not null default 'business';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'business_events_author_check'
  ) then
    alter table public.business_events
      add constraint business_events_author_check check (author in ('business', 'admin'));
  end if;
end $$;

create index if not exists business_events_author_idx
  on public.business_events (business_id, author, status);

-- Existing rows stay 'business'. There is no record of who created them, and
-- guessing wrong in the other direction would silently hand out free slots.
-- Anything admin adds from now on is marked as it is written; to correct a
-- past one, set its author to 'admin' by hand.


-- ── 2. The event limit ────────────────────────────────────────────────────

create or replace function public.enforce_live_event_limit()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  live_count int;
  allowance  int;
begin
  if new.status not in ('Live', 'Pending Approval') then
    return new;
  end if;
  -- A town event belongs to nobody, and one Maidenhead added for a business
  -- is a gift: neither is spending the business's slots.
  if new.business_id is null or new.author = 'admin' then
    return new;
  end if;
  -- An event already out there and staying out there is being edited, not
  -- published: it is not asking for a slot it already holds.
  if tg_op = 'UPDATE' and old.status in ('Live', 'Pending Approval') then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('live_events:' || new.business_id));

  allowance := public.addon_slot_allowance(new.business_id, 'event');

  -- Only the business's own events count against its own slots.
  select count(*) into live_count
  from public.business_events
  where business_id = new.business_id
    and author = 'business'
    and status in ('Live', 'Pending Approval')
    and id <> new.id;

  if live_count >= allowance then
    if allowance = 0 then
      raise exception 'You need an event slot to put an event on the site. Buy one in Subscriptions & Billing.'
        using errcode = 'check_violation';
    end if;
    raise exception 'Event slot limit reached: at most % event(s) can be on the site at once.', allowance
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists business_events_live_limit on public.business_events;

create trigger business_events_live_limit
  before insert or update of status on public.business_events
  for each row execute function public.enforce_live_event_limit();


-- ── 3. The Featured Article limit ─────────────────────────────────────────
-- The count was already right; only the admin escape hatch needed closing.

create or replace function public.enforce_featured_article_limit()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  live_count int;
  allowance  int;
begin
  -- Admin-written pieces are free, whoever they are attached to.
  if new.author <> 'business' or new.business_id is null then
    return new;
  end if;
  if new.status not in ('Live', 'Pending Approval') then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status in ('Live', 'Pending Approval') then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('featured_articles:' || new.business_id));

  allowance := public.addon_slot_allowance(new.business_id, 'featured_article');

  select count(*) into live_count
  from public.feature_articles
  where business_id = new.business_id
    and author = 'business'
    and status in ('Live', 'Pending Approval')
    and id <> new.id;

  if live_count >= allowance then
    if allowance = 0 then
      raise exception 'You need a Featured Article slot to submit one. Buy one in Subscriptions & Billing.'
        using errcode = 'check_violation';
    end if;
    raise exception 'Featured Article slot limit reached: at most % can be active at once.', allowance
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists feature_articles_slot_limit on public.feature_articles;

create trigger feature_articles_slot_limit
  before insert or update of status on public.feature_articles
  for each row execute function public.enforce_featured_article_limit();


-- ── 4. A business can read the admin posts attached to it ─────────────────
-- So the dashboard can list them as "added by Maidenhead". Read only: the
-- business never edits what admin wrote for it.

alter table public.news_offers enable row level security;

drop policy if exists "businesses read their admin posts" on public.news_offers;
create policy "businesses read their admin posts" on public.news_offers
  for select using (
    business_id is not null and exists (
      select 1 from public.business_users u
      where u.business_id = news_offers.business_id
        and u.auth_user_id = auth.uid()
        and u.status = 'approved'
    )
  );

notify pgrst, 'reload schema';
