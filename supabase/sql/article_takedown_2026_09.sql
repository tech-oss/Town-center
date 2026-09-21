-- ═══════════════════════════════════════════════════════════════════════════
-- Admin can take a published business post off the site.
--
-- Approval is not infallible — something can get through that should not
-- have. "Removed" is a new status for a post admin has pulled: off the public
-- site, still on record, and carrying the reason in rejection_reason so the
-- business reads it on their own News & Articles page.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.business_articles'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.business_articles drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.business_articles add constraint business_articles_status_check
  check (status in ('Draft', 'Pending Approval', 'Live', 'Hidden', 'Rejected', 'Removed'));

-- A removed post must not count against the business's three live slots, and
-- must never reach the public views (they already require status = 'Live').

notify pgrst, 'reload schema';
