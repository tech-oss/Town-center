-- A deleted user's email can be registered again.
--
-- The problem: someone deleted from the platform kept their Supabase Auth
-- login, so signing up again with the same email said "An account with this
-- email already exists" — while admin's Users list (business_users) showed
-- no such person.
--
-- How the logins were left behind:
--   • Deleting a business (Businesses → Delete) removes its people through
--     the business_users foreign key (on delete cascade), but nothing removed
--     their logins. This is how most of them were left.
--   • Older deletions, from before the delete-business-user function, only
--     removed the business_users row.
--   • A sign-up whose email was confirmed but which never finished.
-- (Users → Delete already removes the login, through delete-business-user.)
--
-- 1. From now on: when a person's last business_users row goes, by whatever
--    route (Users → Delete, Businesses → Delete, an owner removing a Content
--    Manager), their login goes with it, unless it's also a Maidenhead admin
--    login or still belongs to another business.
--
--    Skipped when the delete comes from an Edge Function using the service
--    role: delete-business-user removes the login itself straight after, and
--    would otherwise find it already gone.
--
--    Every table that points at auth.users cascades (business_users,
--    admin_users, business_user_agreement_acceptances), so nothing blocks it.

create or replace function public.drop_login_without_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.auth_user_id is null then
    return null;
  end if;
  if (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role') = 'service_role' then
    return null;
  end if;
  if exists (select 1 from public.business_users where auth_user_id = old.auth_user_id)
     or exists (select 1 from public.admin_users where auth_user_id = old.auth_user_id) then
    return null;
  end if;
  delete from auth.users where id = old.auth_user_id;
  return null;
end;
$$;

revoke all on function public.drop_login_without_account() from public, anon, authenticated;

drop trigger if exists business_users_drop_login on public.business_users;
create trigger business_users_drop_login
  after delete on public.business_users
  for each row execute function public.drop_login_without_account();

-- 2. Once: remove the logins already left behind — confirmed logins with no
--    business_users row and no admin_users row. Sign-ups still waiting for
--    their confirmation email to be clicked are kept, as is anything
--    confirmed in the last hour (its sign-up may be finishing right now).
--    Returns how many were removed.

with gone as (
  delete from auth.users u
  where u.email_confirmed_at is not null
    and u.email_confirmed_at < now() - interval '1 hour'
    and not exists (select 1 from public.business_users b where b.auth_user_id = u.id)
    and not exists (select 1 from public.admin_users a where a.auth_user_id = u.id)
  returning 1
)
select count(*) as logins_removed from gone;
