-- ═══════════════════════════════════════════════════════════════════════════
-- A draft cannot go live without admin seeing it first.
--
-- The bug: a business saved a News & Offers post as a Draft (all 3 live slots
-- were full), then used "Make Live" to swap it in for one of its live posts.
-- The swap wrote status = 'Live' straight onto the draft — no Pending
-- Approval in between, no admin ever saw it. Same bug on Events: a Draft
-- event's own "Make Live" button did the same direct write. Featured
-- Articles never had this bug because its dashboard page simply never
-- offers a "Live" button — only "Submit for Approval" — but that was a
-- property of one page's buttons, not a rule the database enforced. Nothing
-- stopped a business_articles or business_events row from being written
-- straight to 'Live' by anyone who could reach the table, dashboard button
-- or not.
--
-- This is the rule stated once, in the database, for both tables: a
-- non-admin can only move a row TO 'Live' if it was already 'Hidden' —
-- because Hidden is the one status that means "this was already approved,
-- the business just switched it off." Every other starting point (Draft,
-- Rejected, Removed, or a brand new row) has never been in front of admin,
-- so a non-admin writing 'Live' from there is refused. Admin's own session
-- (is_admin()) is never restricted — approving a submission, restoring a
-- take-down, or admin's own authored content all still write 'Live' exactly
-- as they do today.
--
-- Business_articles' "Hidden" covers two real cases, both already approved:
-- the business's own Deactivate button, and a post admin approved but had
-- to hold because the business was already at its 3-live cap
-- (contentModeration.js's approveArticle). Business_events' "Hidden" is the
-- business's own Deactivate button, documented in event_takedown_2026_09.sql
-- as the one status the business is trusted to put straight back. 'Removed'
-- (admin's take-down) is deliberately excluded — restoreArticle/unhideEvent
-- already return it to 'Hidden' rather than 'Live' for the same reason, so a
-- taken-down post is never one click from the business away from being live
-- again without admin's say-so a second time.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════


create or replace function public.enforce_business_content_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Not moving to Live: nothing this trigger cares about.
  if new.status is distinct from 'Live' then
    return new;
  end if;
  -- Already Live and staying Live (e.g. admin clearing rejection_reason
  -- alongside an unrelated column): not a new publish.
  if tg_op = 'UPDATE' and old.status = 'Live' then
    return new;
  end if;
  -- Admin can always publish — approving, restoring, or admin's own content.
  if public.is_admin() then
    return new;
  end if;
  -- The one case a business may do itself: switching previously-approved
  -- content back on.
  if tg_op = 'UPDATE' and old.status = 'Hidden' then
    return new;
  end if;

  raise exception
    'This needs Maidenhead admin''s approval before it can go live. Submit it for approval instead.'
    using errcode = 'P0001';
end;
$$;

drop trigger if exists business_articles_needs_approval on public.business_articles;
create trigger business_articles_needs_approval
  before insert or update of status on public.business_articles
  for each row execute function public.enforce_business_content_approval();

drop trigger if exists business_events_needs_approval on public.business_events;
create trigger business_events_needs_approval
  before insert or update of status on public.business_events
  for each row execute function public.enforce_business_content_approval();


notify pgrst, 'reload schema';

-- Nothing to see here immediately — this only changes what future writes are
-- allowed. Confirms both triggers are attached.
select event_object_table, trigger_name
from information_schema.triggers
where trigger_name in ('business_articles_needs_approval', 'business_events_needs_approval')
order by event_object_table;
