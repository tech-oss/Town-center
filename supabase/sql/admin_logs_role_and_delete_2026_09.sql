-- ═══════════════════════════════════════════════════════════════════════════
-- Admin log attribution and clearing.
--
--  • actor_role records which admin role performed an action, alongside the
--    actor_id / actor_name columns the table already had but nothing wrote.
--    addLog (src/api/admin/users.js) now fills all three from the signed-in
--    admin, so the log answers "who did this, acting as what".
--
--  • A delete policy, so the Admin Logs screen can clear selected entries.
--    Note this trades away the table's append-only guarantee: until now no
--    policy allowed deletes, which is what made the audit trail tamper-proof.
--    Any admin can now remove log lines, including their own.
--
-- Depends on admin_users.sql having been run (public.is_admin()).
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.admin_logs
  add column if not exists actor_role text;

drop policy if exists "admins delete admin_logs" on public.admin_logs;
create policy "admins delete admin_logs"
  on public.admin_logs for delete using (public.is_admin());
