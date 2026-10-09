-- The four agreements every business accepts before it gets an account —
-- whether it registers itself or claims a listing admin created:
--   • Business Data Processing & Partner Data Responsibility Agreement
--   • Privacy Policy
--   • Terms of Use
--   • Service Cancellation Policy
-- Each is accepted separately and recorded with the moment it was ticked
-- (accepted_at, from the person's browser) and the moment it reached us
-- (recorded_at, the server's clock), along with the version accepted, so a
-- business can always be shown exactly what it agreed to and when.
--
-- Safe to run more than once.

create table if not exists public.business_agreement_acceptances (
  id              uuid primary key default gen_random_uuid(),
  business_id     text not null references public.businesses(id) on delete cascade,
  auth_user_id    uuid,
  email           text,
  agreement_key   text not null check (agreement_key in ('data-processing-agreement','privacy-policy','terms-of-use','cancellation-policy')),
  agreement_title text not null,
  version         text not null,
  context         text not null check (context in ('registration','claim','onboarding')),
  accepted_at     timestamptz not null,
  recorded_at     timestamptz not null default now()
);
create index if not exists business_agreement_acceptances_business_idx on public.business_agreement_acceptances (business_id, recorded_at desc);

alter table public.business_agreement_acceptances enable row level security;

-- Read: Maidenhead admin, and anyone on that business's team (owner or
-- content manager, approved or awaiting approval).
drop policy if exists "agreements readable by admin and the business" on public.business_agreement_acceptances;
create policy "agreements readable by admin and the business"
  on public.business_agreement_acceptances for select
  using (
    public.is_admin()
    or auth_user_id = auth.uid()
    or exists (
      select 1 from public.business_users u
      where u.business_id = business_agreement_acceptances.business_id
        and u.auth_user_id = auth.uid()
        and u.status in ('approved', 'pending')
    )
  );
-- Nobody writes directly; record_business_agreements() does it.

-- Records the acceptances for one business in one go. Called right after the
-- account is created at registration or claim (the person is signed in by
-- then), and from the claim onboarding screen for anyone who claimed before
-- this existed. Only the four known agreements are accepted, and only for a
-- business that exists; the caller's own sign-in is recorded, never one they
-- pass in.
create or replace function public.record_business_agreements(
  p_business_id text,
  p_email text,
  p_context text,
  p_items jsonb
) returns integer
language plpgsql volatile security definer set search_path = public
as $$
declare
  item jsonb;
  n integer := 0;
  accepted timestamptz;
begin
  if not exists (select 1 from businesses where id = p_business_id) then
    raise exception 'Unknown business';
  end if;
  if p_context not in ('registration','claim','onboarding') then
    raise exception 'Unknown context';
  end if;
  for item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    -- A browser clock can be wrong; never accept a time in the future or
    -- more than a day old — fall back to now.
    accepted := nullif(item ->> 'accepted_at', '')::timestamptz;
    if accepted is null or accepted > now() + interval '5 minutes' or accepted < now() - interval '1 day' then
      accepted := now();
    end if;
    insert into business_agreement_acceptances
      (business_id, auth_user_id, email, agreement_key, agreement_title, version, context, accepted_at)
    values
      (p_business_id, auth.uid(), nullif(btrim(p_email), ''), item ->> 'key', item ->> 'title', coalesce(item ->> 'version', 'unknown'), p_context, accepted);
    n := n + 1;
  end loop;
  return n;
end $$;

revoke all on function public.record_business_agreements(text, text, text, jsonb) from public;
grant execute on function public.record_business_agreements(text, text, text, jsonb) to anon, authenticated;

notify pgrst, 'reload schema';
