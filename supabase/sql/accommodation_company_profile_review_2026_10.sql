-- ═══════════════════════════════════════════════════════════════════════════
-- Accommodation module — Phase 2: company profile changes go through review.
--
-- The MANAGED BY details (name, logo, address, contact, website, socials)
-- appear on every one of the company's property pages, so — like a listing's
-- profile and logo — they are approved by Maidenhead admin before going
-- live. Only toggle-type settings skip review (see the spec), and these
-- aren't toggles.
--
-- How it works: the company submits its details into `pending`; the public
-- columns (what public_accommodation_companies and the property pages read)
-- only change when admin approves. A rejection keeps the submission and
-- records why, so the company can correct and resubmit.
--
-- Members can no longer write the table directly — submissions go through
-- accommodation_submit_company_profile(). Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.accommodation_company_profiles
  add column if not exists pending jsonb,
  add column if not exists approval_status text not null default 'Up to Date',
  add column if not exists rejection_reason text,
  add column if not exists submitted_at timestamptz;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'accommodation_company_profiles_status_check') then
    alter table public.accommodation_company_profiles add constraint accommodation_company_profiles_status_check
      check (approval_status in ('Up to Date', 'Pending Approval', 'Changes Rejected'));
  end if;
end $$;

-- Members read their own profile (live values, pending submission, status,
-- reason); only the functions below write it.
drop policy if exists "members manage their company profile" on public.accommodation_company_profiles;
drop policy if exists "members read their company profile" on public.accommodation_company_profiles;
create policy "members read their company profile" on public.accommodation_company_profiles
  for select using (public.is_approved_business_member(business_id));

-- The approval history records company-profile decisions too.
alter table public.approval_actions drop constraint if exists approval_actions_entity_type_check;
alter table public.approval_actions add constraint approval_actions_entity_type_check
  check (entity_type in ('listing_tab', 'article', 'review_reply', 'property', 'company_profile'));


-- Company submits its MANAGED BY details for review.
create or replace function public.accommodation_submit_company_profile(p_company text, p_values jsonb)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v jsonb := coalesce(p_values, '{}'::jsonb);
  clean jsonb;
  k text;
begin
  if not public.is_approved_business_member(p_company) then
    raise exception 'Not allowed.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.businesses where id = p_company and kind = 'accommodation_company') then
    raise exception 'Only an accommodation company has a company profile.';
  end if;

  -- Only the known fields, trimmed; text fields capped so nothing oversized
  -- reaches a public page.
  clean := jsonb_strip_nulls(jsonb_build_object(
    'name',        nullif(left(btrim(v ->> 'name'), 120), ''),
    'logo',        nullif(left(btrim(v ->> 'logo'), 1000), ''),
    'address',     nullif(left(btrim(v ->> 'address'), 300), ''),
    'postal_code', nullif(left(btrim(v ->> 'postal_code'), 20), ''),
    'phone',       nullif(left(btrim(v ->> 'phone'), 40), ''),
    'email',       nullif(left(btrim(v ->> 'email'), 200), ''),
    'website',     nullif(left(btrim(v ->> 'website'), 500), ''),
    'social',      case when jsonb_typeof(v -> 'social') = 'object' then v -> 'social' end
  ));
  if coalesce(clean ->> 'name', '') = '' then
    raise exception 'The company name is required.';
  end if;
  if (clean ->> 'logo') like 'data:%' then
    raise exception 'Upload the logo rather than pasting it in.';
  end if;
  for k in select jsonb_object_keys(coalesce(clean -> 'social', '{}'::jsonb)) loop
    if length(coalesce(clean -> 'social' ->> k, '')) > 500 then
      raise exception 'A social link is too long.';
    end if;
  end loop;

  insert into public.accommodation_company_profiles (business_id, pending, approval_status, rejection_reason, submitted_at, updated_at)
  values (p_company, clean, 'Pending Approval', null, now(), now())
  on conflict (business_id) do update
    set pending = excluded.pending,
        approval_status = 'Pending Approval',
        rejection_reason = null,
        submitted_at = now(),
        updated_at = now();

  perform public.accommodation_log(p_company, 'company_profile.submitted', null, clean ->> 'name');
end;
$$;

-- Admin approves (submission becomes the public details) or rejects (with a reason).
create or replace function public.accommodation_review_company_profile(p_company text, p_approve boolean, p_reason text default null)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  p jsonb;
begin
  if not public.is_admin() then
    raise exception 'Only Maidenhead admin can review company profiles.' using errcode = '42501';
  end if;
  select pending into p from public.accommodation_company_profiles
  where business_id = p_company and approval_status = 'Pending Approval' for update;
  if p is null then
    raise exception 'There is no company profile waiting for review.';
  end if;

  if p_approve then
    update public.accommodation_company_profiles
      set name = p ->> 'name',
          logo = p ->> 'logo',
          address = p ->> 'address',
          postal_code = p ->> 'postal_code',
          phone = p ->> 'phone',
          email = p ->> 'email',
          website = p ->> 'website',
          social = coalesce(p -> 'social', '{}'::jsonb),
          pending = null,
          approval_status = 'Up to Date',
          rejection_reason = null,
          updated_at = now()
      where business_id = p_company;
  else
    if btrim(coalesce(p_reason, '')) = '' then
      raise exception 'Give a reason so the company knows what to correct.';
    end if;
    update public.accommodation_company_profiles
      set approval_status = 'Changes Rejected', rejection_reason = btrim(p_reason), updated_at = now()
      where business_id = p_company;
  end if;

  insert into public.approval_actions (business_id, entity_type, entity_id, action, reason)
  values (p_company, 'company_profile', p_company, case when p_approve then 'approve' else 'reject' end,
          case when p_approve then null else btrim(p_reason) end);
  perform public.accommodation_log(p_company,
    case when p_approve then 'company_profile.approved' else 'company_profile.rejected' end,
    null, p ->> 'name', case when p_approve then null else btrim(p_reason) end);
end;
$$;

revoke all on function public.accommodation_submit_company_profile(text, jsonb) from public, anon;
grant execute on function public.accommodation_submit_company_profile(text, jsonb) to authenticated;
revoke all on function public.accommodation_review_company_profile(text, boolean, text) from public, anon;
grant execute on function public.accommodation_review_company_profile(text, boolean, text) to authenticated;

notify pgrst, 'reload schema';
