-- ═══════════════════════════════════════════════════════════════════════════
-- Legal documents: versioned, admin-managed, accepted per version.
--
-- legal_documents           one row per document a business may have to
--                           accept (Business Terms & Conditions, Business Data
--                           Responsibility Agreement, Cancellation & Refund
--                           Policy, and any added later). Generic: a new
--                           document is a new row, no code change.
-- legal_document_versions   every version ever published — name comes from
--                           the document; version number, effective date,
--                           PDF and whether it is the current one. A new
--                           version never overwrites an old one.
-- business_agreement_acceptances (existing)
--                           one row per business per document version
--                           accepted, now pointing at the exact version
--                           (version_id) with the date and time.
--
-- A business "requires acceptance" (Updated Terms Require Acceptance) while
-- any current version of a document that needs accepting has no acceptance
-- from it. That is worked out, never stored, so it is always right:
-- legal_documents_outstanding() for the business, and
-- legal_businesses_requiring_acceptance() / legal_version_acceptance_report()
-- for admin.
--
-- The Privacy Policy is not here: it needs no acceptance and is the text
-- admin edits in Site Content → Privacy Policy (site_content 'legal-privacy').
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Documents and versions ──────────────────────────────────────────────────

create table if not exists public.legal_documents (
  key                 text primary key,
  name                text not null,
  description         text,
  requires_acceptance boolean not null default true,
  active              boolean not null default true,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now()
);

create table if not exists public.legal_document_versions (
  id              uuid primary key default gen_random_uuid(),
  document_key    text not null references public.legal_documents(key) on update cascade,
  version         text not null,
  effective_date  date not null,
  file_url        text not null,
  file_name       text,
  is_current      boolean not null default false,
  created_at      timestamptz not null default now(),
  created_by      uuid default auth.uid(),
  unique (document_key, version)
);
-- At most one current version per document.
create unique index if not exists legal_document_versions_one_current
  on public.legal_document_versions (document_key) where is_current;

alter table public.legal_documents enable row level security;
alter table public.legal_document_versions enable row level security;

-- Anyone may read them: the documents are shown at signup, before sign-in.
drop policy if exists "legal documents are public" on public.legal_documents;
create policy "legal documents are public" on public.legal_documents for select using (true);
drop policy if exists "admins manage legal documents" on public.legal_documents;
create policy "admins manage legal documents" on public.legal_documents
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "legal document versions are public" on public.legal_document_versions;
create policy "legal document versions are public" on public.legal_document_versions for select using (true);
-- Admin adds versions and edits their details. Making one current goes
-- through legal_set_current_version(); a version anyone has accepted can
-- never be deleted (the foreign key below refuses it).
drop policy if exists "admins manage legal document versions" on public.legal_document_versions;
create policy "admins manage legal document versions" on public.legal_document_versions
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- ── Acceptances: point at the exact version ─────────────────────────────────

alter table public.business_agreement_acceptances
  add column if not exists version_id uuid references public.legal_document_versions(id) on delete restrict;
-- Any document key now (the list is no longer fixed), and 'update' for an
-- existing business accepting a new version from the dashboard.
alter table public.business_agreement_acceptances drop constraint if exists business_agreement_acceptances_agreement_key_check;
alter table public.business_agreement_acceptances drop constraint if exists business_agreement_acceptances_context_check;
alter table public.business_agreement_acceptances add constraint business_agreement_acceptances_context_check
  check (context in ('registration', 'claim', 'onboarding', 'update'));
create index if not exists business_agreement_acceptances_version_idx
  on public.business_agreement_acceptances (version_id, business_id);

-- ── The three contractual documents, version 1.0 ────────────────────────────
-- Version 1.0 of each is the PDF businesses have been accepting since
-- 28 September 2026, so earlier acceptances count for it (below).

insert into public.legal_documents (key, name, requires_acceptance, sort_order) values
  ('business-terms',               'Business Terms & Conditions',            true, 1),
  ('business-data-responsibility', 'Business Data Responsibility Agreement', true, 2),
  ('cancellation-refund',          'Cancellation & Refund Policy',           true, 3)
on conflict (key) do nothing;

insert into public.legal_document_versions (document_key, version, effective_date, file_url, file_name, is_current)
select v.key, '1.0', date '2026-09-28', v.url, v.fname, true
  from (values
    ('business-terms',               '/agreements/terms-of-use.pdf',              'terms-of-use.pdf'),
    ('business-data-responsibility', '/agreements/data-processing-agreement.pdf', 'data-processing-agreement.pdf'),
    ('cancellation-refund',          '/agreements/cancellation-policy.pdf',       'cancellation-policy.pdf')
  ) v(key, url, fname)
 where not exists (select 1 from public.legal_document_versions x where x.document_key = v.key);

-- Earlier acceptances (version "28.09.26" of the old keys) are acceptances
-- of version 1.0 of the matching document.
update public.business_agreement_acceptances a
   set version_id = v.id
  from public.legal_document_versions v
 where a.version_id is null
   and v.version = '1.0'
   and v.document_key = case a.agreement_key
         when 'terms-of-use'              then 'business-terms'
         when 'data-processing-agreement' then 'business-data-responsibility'
         when 'cancellation-policy'       then 'cancellation-refund'
       end;

-- ── Who may act for a business ──────────────────────────────────────────────
-- The signed-in person is on the business's team (an owner or content
-- manager, approved or still awaiting approval — a new registration's owner
-- is pending when it records its acceptances).
create or replace function public.legal_is_member(p_business_id text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from business_users u
     where u.business_id = p_business_id
       and u.auth_user_id = auth.uid()
       and u.status in ('approved', 'pending')
  )
$$;

-- ── Recording acceptances ───────────────────────────────────────────────────
-- p_items: [{ "version_id": uuid, "accepted_at": ISO time }]. Only current
-- versions can be accepted; the document's name and version number are
-- copied from the database, never from the browser. Accepting a version
-- twice is harmless (nothing new is written).
create or replace function public.legal_record_acceptances(
  p_business_id text,
  p_email text,
  p_context text,
  p_items jsonb
) returns integer
language plpgsql volatile security definer
set search_path = public
as $$
declare
  item jsonb;
  v record;
  accepted timestamptz;
  n integer := 0;
begin
  if p_context not in ('registration', 'claim', 'onboarding', 'update') then
    raise exception 'Unknown context';
  end if;
  if not exists (select 1 from businesses where id = p_business_id) then
    raise exception 'Unknown business';
  end if;
  if not (public.legal_is_member(p_business_id) or public.is_admin()) then
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
    continue when exists (
      select 1 from business_agreement_acceptances a where a.business_id = p_business_id and a.version_id = v.id);

    -- A browser clock can be wrong; never a time in the future or more than
    -- a day old — fall back to now.
    accepted := nullif(item ->> 'accepted_at', '')::timestamptz;
    if accepted is null or accepted > now() + interval '5 minutes' or accepted < now() - interval '1 day' then
      accepted := now();
    end if;

    insert into business_agreement_acceptances
      (business_id, auth_user_id, email, agreement_key, agreement_title, version, version_id, context, accepted_at)
    values
      (p_business_id, auth.uid(), nullif(btrim(p_email), ''), v.key, v.name, v.version, v.id, p_context, accepted);
    n := n + 1;
  end loop;
  return n;
end $$;

revoke all on function public.legal_record_acceptances(text, text, text, jsonb) from public;
grant execute on function public.legal_record_acceptances(text, text, text, jsonb) to authenticated;

-- ── What a business still has to accept ─────────────────────────────────────
create or replace function public.legal_documents_outstanding(p_business_id text)
returns table(version_id uuid, document_key text, name text, version text, effective_date date, file_url text, previously_accepted text)
language sql stable security definer
set search_path = public
as $$
  select v.id, d.key, d.name, v.version, v.effective_date, v.file_url,
         (select pv.version from business_agreement_acceptances a
            join legal_document_versions pv on pv.id = a.version_id
           where a.business_id = p_business_id and pv.document_key = d.key
           order by a.recorded_at desc limit 1)
    from legal_documents d
    join legal_document_versions v on v.document_key = d.key and v.is_current
   where d.active and d.requires_acceptance
     and (public.legal_is_member(p_business_id) or public.is_admin())
     and not exists (
       select 1 from business_agreement_acceptances a
        where a.business_id = p_business_id and a.version_id = v.id)
   order by d.sort_order, d.name
$$;
grant execute on function public.legal_documents_outstanding(text) to authenticated;

-- ── Admin: making a version current ─────────────────────────────────────────
create or replace function public.legal_set_current_version(p_version_id uuid)
returns void
language plpgsql volatile security definer
set search_path = public
as $$
declare
  k text;
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  select document_key into k from legal_document_versions where id = p_version_id;
  if k is null then raise exception 'Unknown version'; end if;
  update legal_document_versions set is_current = false where document_key = k and is_current and id <> p_version_id;
  update legal_document_versions set is_current = true where id = p_version_id;
end $$;
grant execute on function public.legal_set_current_version(uuid) to authenticated;

-- ── Admin: who has accepted a version ───────────────────────────────────────
-- Every business with an approved owner login (a business account), and when
-- it accepted this version — null when it hasn't yet.
create or replace function public.legal_version_acceptance_report(p_version_id uuid)
returns table(business_id text, business_name text, owner_email text, accepted_at timestamptz, accepted_by text, previous_version text)
language sql stable security definer
set search_path = public
as $$
  with v as (select id, document_key from legal_document_versions where id = p_version_id),
  accounts as (
    select distinct on (u.business_id) u.business_id, u.email
      from business_users u
     where u.role = 'Owner' and u.status = 'approved'
     order by u.business_id, u.approved_at desc nulls last
  )
  select b.id, b.name, acc.email,
         a.accepted_at, a.email,
         (select pv.version from business_agreement_acceptances p
            join legal_document_versions pv on pv.id = p.version_id
           where p.business_id = b.id and pv.document_key = v.document_key and pv.id <> v.id
           order by p.recorded_at desc limit 1)
    from accounts acc
    join businesses b on b.id = acc.business_id
    cross join v
    left join lateral (
      select x.accepted_at, x.email from business_agreement_acceptances x
       where x.business_id = b.id and x.version_id = v.id
       order by x.recorded_at desc limit 1
    ) a on true
   where public.is_admin()
   order by a.accepted_at is not null, b.name
$$;
grant execute on function public.legal_version_acceptance_report(uuid) to authenticated;

-- ── Admin: businesses marked "Updated Terms Require Acceptance" ─────────────
create or replace function public.legal_businesses_requiring_acceptance()
returns table(business_id text, outstanding text[])
language sql stable security definer
set search_path = public
as $$
  select u.business_id, array_agg(distinct d.name order by d.name)
    from (select distinct business_id from business_users where role = 'Owner' and status = 'approved') u
    cross join legal_documents d
    join legal_document_versions v on v.document_key = d.key and v.is_current
   where public.is_admin()
     and d.active and d.requires_acceptance
     and not exists (
       select 1 from business_agreement_acceptances a
        where a.business_id = u.business_id and a.version_id = v.id)
   group by u.business_id
$$;
grant execute on function public.legal_businesses_requiring_acceptance() to authenticated;

-- ── PDF storage ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('legal-documents', 'legal-documents', true, 20971520, array['application/pdf'])
on conflict (id) do update set public = true, file_size_limit = 20971520, allowed_mime_types = array['application/pdf'];

drop policy if exists "admins upload legal documents" on storage.objects;
create policy "admins upload legal documents" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'legal-documents' and (select public.is_admin()));
drop policy if exists "admins change legal documents" on storage.objects;
create policy "admins change legal documents" on storage.objects
  for update to authenticated
  using (bucket_id = 'legal-documents' and (select public.is_admin()));
drop policy if exists "admins remove legal documents" on storage.objects;
create policy "admins remove legal documents" on storage.objects
  for delete to authenticated
  using (bucket_id = 'legal-documents' and (select public.is_admin()));

notify pgrst, 'reload schema';
