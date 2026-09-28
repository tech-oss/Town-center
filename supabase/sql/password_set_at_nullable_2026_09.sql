-- Invited Content Managers could not be added at all:
--   null value in column "password_set_at" violates not-null constraint
-- content_manager_flow_2026_09.sql declared the column NOT NULL, but null is
-- exactly how an invited login ("hasn't set a password yet") is recorded —
-- see invite-content-manager and mark_own_password_set().
alter table public.business_users
  alter column password_set_at drop not null;
