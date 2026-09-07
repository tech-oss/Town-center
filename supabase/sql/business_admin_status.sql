-- ═══════════════════════════════════════════════════════════════════════════
-- Business-level registration status, so admin has something to moderate.
--
-- Until now `businesses` held only (id, name) and the only approval state was
-- business_users.status, which gates whether an owner can sign in. Admin's
-- Business Registrations screen needs the registration itself to carry a
-- status, a submitted date, and the note behind a rejection/suspension.
--
-- NOT RUN YET.
-- Read/write side lives in src/api/admin/businesses.js.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.businesses
  add column if not exists status           text not null default 'Pending'
    check (status in ('Pending', 'Approved', 'Rejected', 'Suspended')),
  add column if not exists submitted_at     timestamptz not null default now(),
  add column if not exists admin_note       text,
  add column if not exists new_to_maidenhead boolean not null default false;

-- Everything that already exists predates admin approval and is live today —
-- don't retroactively lock those owners out.
update public.businesses set status = 'Approved' where status = 'Pending';
