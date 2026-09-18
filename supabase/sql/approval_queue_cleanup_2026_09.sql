-- ═══════════════════════════════════════════════════════════════════════════
-- Approval queue clean-up.
--
-- Businesses used to start with every listing section marked "Pending
-- Approval" at signup, so the queue listed edits nobody made (and each
-- business saw "pending" dots on sections it never touched). Sections that
-- nobody has saved since signup (no edited_by entry) are set Up to Date.
-- Real submissions are left exactly as they are.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

update public.business_listings l
set approval_status = (
  select coalesce(jsonb_object_agg(
           e.key,
           case when e.value = '"Pending Approval"'::jsonb
                 and not (coalesce(l.edited_by, '{}'::jsonb) ? e.key)
                then '"Up to Date"'::jsonb
                else e.value end
         ), '{}'::jsonb)
  from jsonb_each(l.approval_status) e
)
where exists (
  select 1 from jsonb_each_text(l.approval_status) e
  where e.value = 'Pending Approval'
    and not (coalesce(l.edited_by, '{}'::jsonb) ? e.key)
);
