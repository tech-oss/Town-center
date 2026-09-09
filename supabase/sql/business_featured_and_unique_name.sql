-- ═══════════════════════════════════════════════════════════════════════════
-- Three changes to the businesses table, all enforced here rather than only in
-- the admin client, because each one is a rule about the data itself:
--
--   1. new_to_maidenhead becomes `featured` — an editorial flag admin sets,
--      replacing the self-declared "this business is new to town" flag.
--   2. Business names are unique, case- and whitespace-insensitively.
--   3. At most 10 businesses can be featured at once.
--
-- NOT RUN YET.
--
-- Safe with respect to the business portal: business-dashboard's signup
-- (src/business/api/businessRegistration.js) only ever writes `id` and `name`
-- to this table, so the rename touches nothing on that side. See the note at
-- the bottom about what the name constraint *does* mean for that signup.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. new_to_maidenhead → featured ────────────────────────────────────────
-- The values are deliberately NOT carried over. "New to Maidenhead" was a
-- property of the business (it recently opened); "featured" is an editorial
-- choice by admin about what to promote. Keeping the old booleans would
-- silently promote whichever businesses happened to tick that box at signup,
-- which is not what anyone chose. Admin picks the 10 fresh.
alter table public.businesses rename column new_to_maidenhead to featured;
update public.businesses set featured = false where featured is true;


-- ── 2. Unique business name ────────────────────────────────────────────────
-- lower(btrim(...)) so "Coppa Club", "coppa club" and "Coppa Club " are all
-- the same business. A plain unique constraint on the column would let all
-- three coexist, which is exactly the duplicate case this is meant to stop.
--
-- If this errors, existing duplicates need resolving first. Find them with:
--   select lower(btrim(name)) as key, count(*), array_agg(id)
--   from public.businesses group by 1 having count(*) > 1;
create unique index if not exists businesses_name_unique
  on public.businesses (lower(btrim(name)));


-- ── 3. At most 10 featured businesses ──────────────────────────────────────
-- Not expressible as a constraint or a partial index (both work per-row; this
-- is a rule about the whole table), so it needs a trigger.
--
-- The advisory lock serialises concurrent attempts to feature something. Two
-- admins in two tabs both counting 9 and both writing would otherwise leave 11
-- featured — rare, but the constraint is worthless if it can be stepped over.
-- The lock is transaction-scoped and only taken on the path that actually
-- turns featuring ON, so it costs nothing for ordinary writes.
create or replace function public.enforce_featured_limit()
returns trigger
language plpgsql
as $$
declare
  featured_count integer;
begin
  -- Only the transition into featured can breach the cap. Un-featuring, and
  -- updating any other column on an already-featured row, are always fine.
  if new.featured is not true then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.featured is true then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('businesses_featured_limit'));

  select count(*) into featured_count
  from public.businesses
  where featured is true
    and id <> new.id;

  if featured_count >= 10 then
    raise exception 'Featured limit reached: at most 10 businesses can be featured at once.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists businesses_featured_limit on public.businesses;

create trigger businesses_featured_limit
  before insert or update of featured on public.businesses
  for each row execute function public.enforce_featured_limit();


-- ── Follow-up for the business portal ──────────────────────────────────────
-- The unique index applies to self-signups too, which is correct — two
-- businesses should not be able to register the same name. But
-- business-dashboard's SignUpPage currently surfaces raw Postgres errors, so a
-- duplicate name there will read as
--   'duplicate key value violates unique constraint "businesses_name_unique"'
-- rather than "That business name is already registered." That message needs
-- catching on the business side; it is not fixed by this migration.
