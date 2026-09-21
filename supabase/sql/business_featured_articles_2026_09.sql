-- ═══════════════════════════════════════════════════════════════════════════
-- Featured Articles a business writes for itself.
--
-- feature_articles held only admin-written stories. A business that has bought
-- a Featured Article slot can now write its own: a longer, editorial-style
-- piece with a hero image, pictures through the text and a link to its own
-- website. It goes to admin for approval, then appears on the business's
-- profile and on the Offers page, where featured articles are listed first.
--
-- An admin-written story is live the moment it is saved, exactly as before —
-- only business-written ones enter the queue, and only they use a slot.
--
-- Being on the HOMEPAGE stays a separate purchase (homepage_placements).
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.feature_articles
  add column if not exists business_id text references public.businesses(id) on delete set null,
  add column if not exists author text not null default 'admin',
  add column if not exists status text not null default 'Live',
  add column if not exists rejection_reason text,
  add column if not exists submitted_at timestamptz;

create index if not exists feature_articles_business_idx
  on public.feature_articles (business_id, status);

do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.feature_articles'::regclass and contype = 'c'
      and (pg_get_constraintdef(oid) ilike '%status%' or pg_get_constraintdef(oid) ilike '%author%')
  loop
    execute format('alter table public.feature_articles drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.feature_articles add constraint feature_articles_author_check
  check (author in ('admin', 'business'));
alter table public.feature_articles add constraint feature_articles_status_check
  check (status in ('Draft', 'Pending Approval', 'Live', 'Hidden', 'Rejected', 'Removed'));

-- Everything already in the table was written by admin and is live.
update public.feature_articles set author = 'admin' where author is null;
update public.feature_articles set status = 'Live' where status is null;


-- An approved member of the business — owner or content manager.
create or replace function public.feature_article_member(p_business_id text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from business_users u
    where u.business_id = p_business_id
      and u.auth_user_id = auth.uid()
      and u.status = 'approved'
  )
$$;

grant execute on function public.feature_article_member(text) to authenticated;


-- ── Who may read and write what ───────────────────────────────────────────

alter table public.feature_articles enable row level security;

-- The public sees live stories only. A business's own drafts, submissions and
-- hidden pieces stay off the site until admin approves them.
drop policy if exists "public reads live feature articles" on public.feature_articles;
create policy "public reads live feature articles"
  on public.feature_articles for select
  using (status = 'Live');

drop policy if exists "admins manage feature articles" on public.feature_articles;
create policy "admins manage feature articles"
  on public.feature_articles for all
  using (public.is_admin()) with check (public.is_admin());

-- A business reads everything of its own, whatever state it is in.
drop policy if exists "business reads its own feature articles" on public.feature_articles;
create policy "business reads its own feature articles"
  on public.feature_articles for select
  using (business_id is not null and public.feature_article_member(business_id));

-- Owner and Content Manager alike may write them; buying the slot is the
-- owner's job, writing what goes in it is not.
drop policy if exists "business writes its own feature articles" on public.feature_articles;
create policy "business writes its own feature articles"
  on public.feature_articles for insert
  with check (
    business_id is not null
    and author = 'business'
    and status in ('Draft', 'Pending Approval')
    and public.feature_article_member(business_id)
  );

drop policy if exists "business edits its own feature articles" on public.feature_articles;
create policy "business edits its own feature articles"
  on public.feature_articles for update
  using (business_id is not null and author = 'business' and public.feature_article_member(business_id))
  -- A business can never publish itself: Live is admin's decision. It can put
  -- its own piece back into the queue, or hide it.
  with check (
    author = 'business'
    and status in ('Draft', 'Pending Approval', 'Hidden')
    and public.feature_article_member(business_id)
  );

drop policy if exists "business deletes its own feature articles" on public.feature_articles;
create policy "business deletes its own feature articles"
  on public.feature_articles for delete
  using (business_id is not null and author = 'business' and public.feature_article_member(business_id));


-- ── Featured article slot limit ───────────────────────────────────────────
-- One active featured article per slot. A hidden or rejected piece frees its
-- slot for the next one. Admin-written stories never use a slot.

create or replace function public.enforce_featured_article_limit()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  live_count int;
  allowance  int;
begin
  if new.author <> 'business' or new.business_id is null then
    return new;
  end if;
  if new.status not in ('Live', 'Pending Approval') then
    return new;
  end if;
  if public.is_admin() then
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


-- ── Business featured articles on the Offers page ─────────────────────────
-- Listed first there; this view is what the public site reads for them.

create or replace view public.public_feature_articles
with (security_invoker = false) as
select
  f.id,
  f.slug,
  f.business_id,
  coalesce(nullif(l.name, ''), b.name)  as business_name,
  l.business_type,
  f.author,
  f.eyebrow,
  f.category,
  f.date_label,
  f.card_heading,
  f.card_body,
  f.card_image,
  f.title,
  f.hero_image,
  f.standfirst,
  f.location,
  f.website,
  f.body,
  f.gallery,
  f.sort_order
from public.feature_articles f
left join public.businesses b on b.id = f.business_id
left join public.business_listings l on l.business_id = f.business_id
where f.status = 'Live'
  and (f.business_id is null or (b.status = 'Approved' and coalesce(b.visible, true)));

grant select on public.public_feature_articles to anon, authenticated;

notify pgrst, 'reload schema';
