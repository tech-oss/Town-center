-- ═══════════════════════════════════════════════════════════════════════════
-- The live-article limit was not applied when ADMIN approved a post.
--
-- enforce_live_article_limit() began with:
--
--     if public.is_admin() then return new; end if;
--
-- The intent was that admin could publish on a business's behalf. The effect
-- was that approving a business's own submission skipped the check entirely,
-- so a business on the Visibility Plan with three articles live could submit
-- a fourth, have it approved, and end up with four — the exact thing the
-- limit exists to prevent. (Some businesses are already over; see the note at
-- the bottom.)
--
-- The admin panel has always been written for the limit to hold: approve()
-- catches "Live article limit reached" and files the post as Hidden instead,
-- telling the business it is held until they free a slot. That path simply
-- never ran. Removing the exemption restores it.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

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

  -- An article already live and staying live is being edited, not published:
  -- it is not asking for a slot it doesn't already hold.
  if tg_op = 'UPDATE' and old.status = 'Live' then
    return new;
  end if;

  -- No admin exemption. Whoever sets an article live — the owner promoting a
  -- draft, or admin approving a submission — the business still only shows
  -- what it is allowed to show.
  perform pg_advisory_xact_lock(hashtext('live_articles:' || new.business_id));

  allowance := public.addon_slot_allowance(new.business_id, 'article');

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


-- ── Who is already over the limit ─────────────────────────────────────────
--
-- Nothing is hidden automatically: choosing which of a business's own posts
-- comes down is the business's call, not a migration's. This lists them so
-- they can be dealt with deliberately. From now on nothing new can go live
-- past the allowance.

do $$
declare r record;
begin
  for r in
    select b.business_id, count(*) as live, public.addon_slot_allowance(b.business_id, 'article') as allowed
    from public.business_articles b
    where b.status = 'Live'
    group by b.business_id
    having count(*) > public.addon_slot_allowance(b.business_id, 'article')
  loop
    raise notice 'Over the limit: % has % live, allowed %', r.business_id, r.live, r.allowed;
  end loop;
end $$;

select b.business_id,
       count(*) filter (where b.status = 'Live')            as live_articles,
       public.addon_slot_allowance(b.business_id, 'article') as allowance
from public.business_articles b
group by b.business_id
having count(*) filter (where b.status = 'Live') > public.addon_slot_allowance(b.business_id, 'article')
order by live_articles desc;

notify pgrst, 'reload schema';
