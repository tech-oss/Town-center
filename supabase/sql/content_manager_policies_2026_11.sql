-- ═══════════════════════════════════════════════════════════════════════════
-- A Content Manager reads and accepts every current legal document for
-- themselves.
--
-- Until now a Content Manager's first sign-in showed a fixed paragraph and
-- two tick boxes, never the documents admin publishes (Legal Documents).
-- Those are accepted per BUSINESS (business_agreement_acceptances), so once
-- the owner had accepted them, a Content Manager added later was never shown
-- them at all.
--
-- business_user_agreement_acceptances  one row per person, per business, per
--                                      document version they accepted.
--
-- Kept apart from business_agreement_acceptances on purpose: that table is
-- the business's own acceptance, which only the owner gives. A Content
-- Manager accepting must not count as the business accepting.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.business_user_agreement_acceptances (
  id              uuid primary key default gen_random_uuid(),
  business_id     text not null references public.businesses(id) on delete cascade,
  auth_user_id    uuid not null references auth.users(id) on delete cascade,
  email           text,
  version_id      uuid not null references public.legal_document_versions(id),
  agreement_key   text not null,
  agreement_title text not null,
  version         text not null,
  accepted_at     timestamptz not null default now(),
  recorded_at     timestamptz not null default now(),
  unique (auth_user_id, business_id, version_id)
);

alter table public.business_user_agreement_acceptances enable row level security;

-- The person themselves, anyone else on the business (the owner), and admin
-- can read. Nobody writes directly: legal_record_my_acceptances() does.
drop policy if exists "own, business and admin read" on public.business_user_agreement_acceptances;
create policy "own, business and admin read"
  on public.business_user_agreement_acceptances for select
  using (auth_user_id = auth.uid() or public.legal_is_member(business_id) or public.is_admin());

revoke insert, update, delete on public.business_user_agreement_acceptances from anon, authenticated;


-- ── What the signed-in person still has to accept for a business ───────────
create or replace function public.legal_documents_outstanding_for_me(p_business_id text)
returns table(version_id uuid, document_key text, name text, version text, effective_date date, file_url text)
language sql stable security definer
set search_path = public
as $$
  select v.id, d.key, d.name, v.version, v.effective_date, v.file_url
    from legal_documents d
    join legal_document_versions v on v.document_key = d.key and v.is_current
   where d.active and d.requires_acceptance
     and public.legal_is_member(p_business_id)
     and not exists (
       select 1 from business_user_agreement_acceptances a
        where a.auth_user_id = auth.uid()
          and a.business_id = p_business_id
          and a.version_id = v.id)
   order by d.sort_order, d.name
$$;
grant execute on function public.legal_documents_outstanding_for_me(text) to authenticated;


-- ── Recording the signed-in person's acceptances ────────────────────────────
-- p_items: [{ "version_id": uuid, "accepted_at": ISO time }]. Only current
-- versions. Once nothing is outstanding, their own terms_accepted_at is set,
-- which is what opens the dashboard for a Content Manager.
create or replace function public.legal_record_my_acceptances(
  p_business_id text,
  p_email text,
  p_items jsonb
) returns integer
language plpgsql volatile security definer
set search_path = public
as $$
declare
  item jsonb;
  v record;
  accepted timestamptz;
  remaining integer;
begin
  if not public.legal_is_member(p_business_id) then
    raise exception 'Not allowed to accept documents for this business' using errcode = '42501';
  end if;

  for item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    select ver.id, ver.version, d.key, d.name
      into v
      from legal_document_versions ver join legal_documents d on d.key = ver.document_key
     where ver.id = nullif(item ->> 'version_id', '')::uuid and ver.is_current;
    if not found then
      raise exception 'That document version is not the current one — please reload and try again.';
    end if;

    accepted := nullif(item ->> 'accepted_at', '')::timestamptz;
    if accepted is null or accepted > now() + interval '5 minutes' or accepted < now() - interval '1 day' then
      accepted := now();
    end if;

    insert into business_user_agreement_acceptances
      (business_id, auth_user_id, email, version_id, agreement_key, agreement_title, version, accepted_at)
    values
      (p_business_id, auth.uid(), nullif(btrim(p_email), ''), v.id, v.key, v.name, v.version, accepted)
    on conflict (auth_user_id, business_id, version_id) do nothing;
  end loop;

  select count(*) into remaining from public.legal_documents_outstanding_for_me(p_business_id);
  if remaining = 0 then
    update business_users
       set terms_accepted_at = now()
     where auth_user_id = auth.uid() and business_id = p_business_id;
  end if;
  return remaining;
end $$;

revoke all on function public.legal_record_my_acceptances(text, text, jsonb) from public;
grant execute on function public.legal_record_my_acceptances(text, text, jsonb) to authenticated;


-- ── Content Managers who only ever saw the old placeholder ──────────────────
-- Asked again at their next sign-in, this time with the real documents.
update public.business_users u
   set terms_accepted_at = null
 where u.role = 'Content Manager'
   and u.terms_accepted_at is not null
   and not exists (
     select 1 from public.business_user_agreement_acceptances a
      where a.auth_user_id = u.auth_user_id and a.business_id = u.business_id);

notify pgrst, 'reload schema';
