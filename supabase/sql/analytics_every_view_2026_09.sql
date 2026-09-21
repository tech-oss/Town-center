-- ═══════════════════════════════════════════════════════════════════════════
-- Analytics: count every view.
--
-- record_view() used to count one view per anonymous session per item per UK
-- day, so a visitor who came back to a profile later that day added nothing.
-- Profile views and article/event views are now counted on every valid page
-- load, with no per-minute, per-session or per-device deduplication.
--
-- The session token is still accepted and stored (it is what makes the older
-- rows comparable, and it stays useful for spotting abuse), but it no longer
-- suppresses anything. The checks that the content really exists, is live and
-- belongs to that business are unchanged, so made-up views still can't be
-- posted.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.record_view(
  p_business_id text,
  p_content_type text,
  p_content_id text,
  p_source text,
  p_session_id text
)
returns void
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_type text := lower(coalesce(p_content_type, ''));
begin
  if p_business_id is null or p_content_id is null
     or v_type not in ('profile', 'news', 'offer', 'event')
     or p_source not in ('web', 'app') then
    return;
  end if;

  -- Only real, public content of that business is counted.
  if v_type = 'profile' then
    if p_content_id <> p_business_id or not exists (
      select 1 from businesses b where b.id = p_business_id and b.status = 'Approved'
    ) then return; end if;
  elsif v_type = 'event' then
    if not exists (
      select 1 from business_events e
      where e.id::text = p_content_id and e.business_id = p_business_id and e.status = 'Live'
    ) then return; end if;
  else
    if not exists (
      select 1 from business_articles a
      where a.id::text = p_content_id and a.business_id = p_business_id and a.status = 'Live'
    ) and not exists (
      select 1 from news_offers n
      where n.id::text = p_content_id and n.business_id = p_business_id and n.status = 'Published'
    ) then return; end if;
  end if;

  -- Every valid view is its own event — no deduplication.
  insert into analytics_events (business_id, content_type, content_id, event_type, source, session_id)
  values (p_business_id, v_type, p_content_id, 'view', p_source, nullif(p_session_id, ''));
end $$;

revoke all on function public.record_view(text, text, text, text, text) from public;
grant execute on function public.record_view(text, text, text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';
