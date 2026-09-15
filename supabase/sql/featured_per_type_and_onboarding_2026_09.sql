-- ═══════════════════════════════════════════════════════════════════════════
--   1. Featured limit: 10 per business type (Eat & Drink, See & Do, Shop,
--      Services incl. freelancers, Hotel & Accommodation) instead of 10 overall.
--   2. Terms & Review on first sign-in only for owners who CLAIMED a business.
--      Owners who registered their own business (or were added by admin) go
--      straight to the dashboard.
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Featured limit per business type ────────────────────────────────────

create or replace function public.enforce_featured_limit()
returns trigger
language plpgsql
as $$
declare
  new_type text;
  featured_count integer;
begin
  if new.featured is not true then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.featured is true then
    return new;
  end if;

  select case when l.business_type = 'freelancer' then 'services' else l.business_type end
    into new_type
  from public.business_listings l
  where l.business_id = new.id;

  -- No listing yet means no type to count against.
  if new_type is null then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('businesses_featured_limit:' || new_type));

  select count(*) into featured_count
  from public.businesses b
  join public.business_listings l on l.business_id = b.id
  where b.featured is true
    and b.id <> new.id
    and (case when l.business_type = 'freelancer' then 'services' else l.business_type end) = new_type;

  if featured_count >= 10 then
    raise exception 'Featured limit reached: at most 10 businesses of this type can be featured at once.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists businesses_featured_limit on public.businesses;
create trigger businesses_featured_limit
  before insert or update of featured on public.businesses
  for each row execute function public.enforce_featured_limit();


-- ── 2. Onboarding only after a claim ───────────────────────────────────────
-- New owner rows count as onboarded unless the insert says otherwise; a claim
-- explicitly inserts null, so only claimers see Terms & Review after approval.

alter table public.business_users
  alter column onboarding_completed_at set default now();

notify pgrst, 'reload schema';
