-- ═══════════════════════════════════════════════════════════════════════════
-- A business's own Featured Article can go in the homepage Featured Article
-- slot.
--
-- The homepage "Featured Article" slot only ever accepted a business's short
-- News & Offers post. Now that a business can write a real Featured Article
-- against a slot it has bought, that is the obvious thing to put there — so
-- set_placement_content accepts content_kind 'feature_article' too, provided
-- the article is that business's own and is live.
--
-- The public homepage already knows how to render a feature_article
-- placement (see getHomepageStories in src/api/stories.js), so nothing
-- downstream changes.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.set_placement_content(p_placement_id uuid, p_kind text, p_content_id text)
returns public.homepage_placements
language plpgsql security definer set search_path = public
as $$
declare
  v_row homepage_placements;
  v_ok boolean;
begin
  select * into v_row from homepage_placements where id = p_placement_id;
  if not found or not public.homepage_is_owner(v_row.business_id) then
    raise exception 'Not your booking.' using errcode = '42501';
  end if;
  if v_row.status not in ('awaiting_content', 'pending_approval', 'rejected', 'approved') then
    raise exception 'This booking can''t be changed.' using errcode = 'P0001';
  end if;
  if v_row.ends_at <= now() then
    raise exception 'This booking has already finished.' using errcode = 'P0001';
  end if;

  v_ok := case
    when v_row.slot_type in ('spotlight', 'featured_article') and p_kind = 'business_article' then
      exists (select 1 from business_articles a where a.id::text = p_content_id
              and a.business_id = v_row.business_id and a.status = 'Live')
    -- A Featured Article the business wrote itself, against a Featured
    -- Article slot. Admin's own stories are not a business's to book.
    when v_row.slot_type in ('spotlight', 'featured_article') and p_kind = 'feature_article' then
      exists (select 1 from feature_articles f where f.id::text = p_content_id
              and f.business_id = v_row.business_id and f.author = 'business' and f.status = 'Live')
    when v_row.slot_type = 'whats_on' and p_kind = 'business_event' then
      exists (select 1 from business_events e where e.id::text = p_content_id
              and e.business_id = v_row.business_id and e.status = 'Live')
    else false
  end;
  if not v_ok then
    raise exception 'Choose one of your own live posts, articles or events for this slot.' using errcode = 'P0001';
  end if;

  update homepage_placements
  set content_kind = p_kind, content_id = p_content_id,
      status = 'pending_approval', rejection_reason = null
  where id = p_placement_id
  returning * into v_row;
  return v_row;
end $$;

revoke all on function public.set_placement_content(uuid, text, text) from public, anon;
grant execute on function public.set_placement_content(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
