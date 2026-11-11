-- email_log: every email the send-email function sends through Resend — when,
-- which kind, to whom, and whether Resend accepted it (with its id, to look up
-- delivery in Resend's dashboard). Written by the function (service role);
-- admins can read it.
-- Safe to run more than once.

create table if not exists public.email_log (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  event       text not null,
  recipients  text[] not null default '{}',
  subject     text,
  ref         text,
  ok          boolean not null,
  error       text,
  resend_id   text
);

create index if not exists email_log_created_at_idx on public.email_log (created_at desc);

alter table public.email_log enable row level security;
revoke all on public.email_log from anon;
revoke insert, update, delete on public.email_log from authenticated;

drop policy if exists "admins read the email log" on public.email_log;
create policy "admins read the email log" on public.email_log for select
  using ((select public.is_admin()));

notify pgrst, 'reload schema';
