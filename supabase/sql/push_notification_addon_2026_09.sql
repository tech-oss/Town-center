-- ═══════════════════════════════════════════════════════════════════════════
-- Push notifications become a paid add-on, sold in packs that are used up
-- one at a time (not a reusable slot like an article or event), plus the
-- extra step this needs: a Content Manager can compose one, but only the
-- business owner can actually submit it — submitting is what spends a
-- credit and sends it on to Maidenhead admin for approval.
--
--   1  push notification   £14.99
--   3  push notifications  £34.99
--   6  push notifications  £59.99
--   12 push notifications  £99.99
--   (all: use anytime within 12 months)
--
-- Reuses business_addon_slots (supabase/sql/addon_slots_2026_09.sql) for the
-- purchase itself — same Stripe flow, same "Add On Services" section, same
-- 12-month validity — just a new `kind`. What's different is how the balance
-- is read: article/event/featured_article slots cap how many can be LIVE AT
-- ONCE and are reusable; a push credit is spent the moment a request reaches
-- admin (status 'pending' or 'approved') and never comes back, except that a
-- REJECTED one refunds automatically, simply by no longer counting.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. A fourth kind of add-on slot ─────────────────────────────────────────

alter table public.business_addon_slots
  drop constraint if exists business_addon_slots_kind_check;
alter table public.business_addon_slots
  add constraint business_addon_slots_kind_check
  check (kind in ('article', 'event', 'featured_article', 'push_notification'));

create or replace function public.grant_addon_slots(
  p_business_id text,
  p_kind text,
  p_quantity int,
  p_amount_pence int,
  p_stripe_ref text
)
returns public.business_addon_slots
language plpgsql security definer set search_path = public
as $$
declare
  v_row business_addon_slots;
begin
  if p_kind not in ('article', 'event', 'featured_article', 'push_notification') then
    raise exception 'Unknown add-on kind: %', p_kind using errcode = 'P0001';
  end if;

  if p_stripe_ref is not null then
    select * into v_row from business_addon_slots where stripe_ref = p_stripe_ref;
    if found then
      return v_row;
    end if;
  end if;

  insert into business_addon_slots (business_id, kind, quantity, amount_pence, expires_at, stripe_ref)
  values (p_business_id, p_kind, p_quantity, p_amount_pence, now() + interval '12 months', p_stripe_ref)
  returning * into v_row;

  return v_row;
end $$;

revoke all on function public.grant_addon_slots(text, text, int, int, text) from public, anon, authenticated;


-- ── 2. What a business has left ─────────────────────────────────────────────
-- Purchased (unexpired packs) minus spent (every request that has actually
-- reached admin — 'pending' or 'approved'). A 'draft' costs nothing yet: it
-- is still just a Content Manager's composition, waiting on the owner. A
-- 'rejected' one stops counting the moment admin rejects it, so the credit
-- is back without any separate refund step.

create or replace function public.push_notification_balance(p_business_id text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'purchased', coalesce((
      select sum(quantity)::int from business_addon_slots
      where business_id = p_business_id and kind = 'push_notification' and expires_at > now()
    ), 0),
    'used', coalesce((
      select count(*)::int from business_push_requests
      where business_id = p_business_id and status in ('pending', 'approved')
    ), 0),
    'remaining', greatest(0, coalesce((
      select sum(quantity)::int from business_addon_slots
      where business_id = p_business_id and kind = 'push_notification' and expires_at > now()
    ), 0) - coalesce((
      select count(*)::int from business_push_requests
      where business_id = p_business_id and status in ('pending', 'approved')
    ), 0))
  )
$$;

grant execute on function public.push_notification_balance(text) to authenticated;


-- ── 3. A draft: what a Content Manager can raise on their own ──────────────
-- Composing costs nothing and needs no credit — only submitting does. Everyone
-- approved on the business can already read every request (existing select
-- policy), so a draft is visible to the owner the moment it's written, same
-- as everything else on this table.

alter table public.business_push_requests
  drop constraint if exists business_push_requests_status_check;
alter table public.business_push_requests
  add constraint business_push_requests_status_check
  check (status in ('draft', 'pending', 'approved', 'rejected'));

drop policy if exists "content manager drafts a push request" on public.business_push_requests;
create policy "content manager drafts a push request"
  on public.business_push_requests for insert
  with check (
    status = 'draft'
    and rejection_reason is null
    and notification_id is null
    and requested_by = auth.uid()
    and public.feature_article_member(business_id)
    and public.business_is_subscribed(business_id)
  );

-- Replaces the old "any approved team member can raise one" policy: only the
-- owner can send a request onward to admin, since doing so spends a paid
-- credit. The Content Manager's route is the draft policy above, then the
-- owner submits it with submit_push_draft() below.
drop policy if exists "subscribed business raises push requests" on public.business_push_requests;
create policy "owner submits a push request" on public.business_push_requests
  for insert
  with check (
    status = 'pending'
    and rejection_reason is null
    and notification_id is null
    and requested_by = auth.uid()
    and public.homepage_is_owner(business_id)
    and public.business_is_subscribed(business_id)
    and (public.push_notification_balance(business_id)->>'remaining')::int > 0
  );

-- A draft can be discarded the same way a pending request can be withdrawn —
-- by anyone approved on the business, same as before.
drop policy if exists "business withdraws a pending push request" on public.business_push_requests;
create policy "business withdraws its own push request"
  on public.business_push_requests for delete
  using (status in ('draft', 'pending') and public.feature_article_member(business_id));


-- ── 4. The owner submitting a Content Manager's draft ───────────────────────
-- The one write that turns a draft into a real request — spends a credit
-- (by simply existing as 'pending' from here on; push_notification_balance
-- counts it) and puts it in front of admin. Owner-only, and refuses outright
-- if there is nothing left to spend, so the UI's own check is never the only
-- thing stopping a business going into the red.

create or replace function public.submit_push_draft(p_id uuid)
returns public.business_push_requests
language plpgsql security definer set search_path = public
as $$
declare
  v_row business_push_requests;
begin
  select * into v_row from business_push_requests where id = p_id and status = 'draft';
  if not found then
    raise exception 'That draft no longer exists.' using errcode = 'P0001';
  end if;
  if not public.homepage_is_owner(v_row.business_id) then
    raise exception 'Only this business''s owner can submit a push notification.' using errcode = 'P0001';
  end if;
  if ((public.push_notification_balance(v_row.business_id))->>'remaining')::int <= 0 then
    raise exception 'No push notifications left — buy a pack in Subscriptions & Billing first.' using errcode = 'P0001';
  end if;

  update business_push_requests
  set status = 'pending'
  where id = p_id
  returning * into v_row;

  return v_row;
end $$;

grant execute on function public.submit_push_draft(uuid) to authenticated;

notify pgrst, 'reload schema';
