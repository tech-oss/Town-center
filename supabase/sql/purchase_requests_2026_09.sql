-- ═══════════════════════════════════════════════════════════════════════════
-- A Content Manager asking the owner to buy something.
--
-- A Content Manager can write and edit everything the business has paid for,
-- but never buys: billing is the owner's. Until now that dead-ended in a line
-- of text telling them to ask. This is the request itself — it reaches the
-- owner on their dashboard and on the bell, with the package already chosen,
-- so the owner only has to say yes.
--
-- Covers the add-on slots (articles, events, featured articles) and the
-- homepage placements.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.business_purchase_requests (
  id            uuid primary key default gen_random_uuid(),
  business_id   text not null references public.businesses(id) on delete cascade,
  -- What is being asked for: an add-on kind ('article', 'event',
  -- 'featured_article') or a homepage slot key ('spotlight',
  -- 'featured_business', …).
  kind          text not null,
  -- Which package, for the add-ons. Null for a homepage slot, which has only
  -- one price.
  pack          int,
  note          text,
  status        text not null default 'open' check (status in ('open', 'purchased', 'dismissed')),
  requested_by  uuid,
  requested_name text,
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz,
  resolved_by   uuid
);

create index if not exists business_purchase_requests_open_idx
  on public.business_purchase_requests (business_id, status, created_at desc);

alter table public.business_purchase_requests enable row level security;

-- Everyone approved on the business can see the requests; the whole point is
-- that the person who asked can see it was dealt with.
drop policy if exists "business reads its purchase requests" on public.business_purchase_requests;
create policy "business reads its purchase requests"
  on public.business_purchase_requests for select
  using (public.feature_article_member(business_id) or public.is_admin());

-- Anyone approved on the business may ask.
drop policy if exists "business members raise purchase requests" on public.business_purchase_requests;
create policy "business members raise purchase requests"
  on public.business_purchase_requests for insert
  with check (
    status = 'open'
    and requested_by = auth.uid()
    and public.feature_article_member(business_id)
  );

-- Only the owner closes one — buying or dismissing is the owner's call.
drop policy if exists "owner resolves purchase requests" on public.business_purchase_requests;
create policy "owner resolves purchase requests"
  on public.business_purchase_requests for update
  using (public.homepage_is_owner(business_id))
  with check (public.homepage_is_owner(business_id));

drop policy if exists "admins manage purchase requests" on public.business_purchase_requests;
create policy "admins manage purchase requests"
  on public.business_purchase_requests for all
  using (public.is_admin()) with check (public.is_admin());

notify pgrst, 'reload schema';
