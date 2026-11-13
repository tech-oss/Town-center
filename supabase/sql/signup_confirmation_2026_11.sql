-- Business portal sign-up now confirms the email address first (Supabase →
-- Authentication → Sign In / Providers → Email → "Confirm email"). The
-- business is only created once the link in that email is clicked, so a name
-- that's already taken is checked up front instead, before the account is
-- made: business_name_available() says whether a business by that name
-- (any status, ignoring case and outer spaces, the same rule as the
-- businesses_name_unique index) exists already. Yes/no only.
-- Safe to run more than once.

create or replace function public.business_name_available(p_name text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(btrim(p_name), '') <> ''
     and not exists (select 1 from businesses where lower(btrim(name)) = lower(btrim(p_name)))
$$;
revoke all on function public.business_name_available(text) from public;
grant execute on function public.business_name_available(text) to anon, authenticated;

notify pgrst, 'reload schema';
