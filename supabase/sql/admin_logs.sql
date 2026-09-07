-- ═══════════════════════════════════════════════════════════════════════════
-- Admin audit log. The Admin Logs screen was reading an in-memory array, so
-- every record of who approved or suspended what was lost on page refresh.
--
-- NOT RUN YET.
-- Read/write side lives in src/api/admin/users.js (addLog / getAdminLogs).
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.admin_logs (
  id          uuid primary key default gen_random_uuid(),
  timestamp   timestamptz not null default now(),
  action      text not null,          -- e.g. "Approved", "Business Suspended"
  target_id   text,                   -- business id or business_users id
  target_name text,
  note        text,
  actor_id    uuid references public.admin_users(id) on delete set null,
  actor_name  text
);

create index if not exists admin_logs_timestamp_idx on public.admin_logs (timestamp desc);

alter table public.admin_logs enable row level security;

-- Append-only from the app's point of view: any admin can read and write an
-- entry, nobody can edit or delete one.
create policy "admins read admin_logs"
  on public.admin_logs for select using (public.is_admin());

create policy "admins append admin_logs"
  on public.admin_logs for insert with check (public.is_admin());
