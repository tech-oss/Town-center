-- ═══════════════════════════════════════════════════════════════════════════
-- Admin-created events + homepage "What's On" selection.
--
-- Two things this unlocks:
--  1. Admin can author an event directly (not just moderate a business's
--     submission), with or without a business attached — a standalone town
--     event that still appears in See & Do. Hence business_id becoming
--     nullable, and the extra content columns the public event page renders.
--  2. Admin picks which events appear in the homepage "WHAT'S ON" grid,
--     max 3, via the `homepage` flag — the same pattern as
--     feature_articles.homepage and news_offers.featured_on_home.
--
-- The public site's event content lived in the hardcoded src/Data/events.js
-- array; these columns are what that content needs to live in the table
-- instead, so src/api/events.js can read Supabase (see also the seed script
-- at supabase/seed/seed_events_from_data.js, run once against this table).
--
-- Depends on admin_users.sql having been run (public.is_admin()).
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.business_events
  alter column business_id drop not null;

alter table public.business_events
  add column if not exists slug        text unique,
  add column if not exists homepage    boolean not null default false,
  add column if not exists hero_image  text,
  add column if not exists excerpt     text,          -- one-line card summary
  add column if not exists body        jsonb not null default '[]'::jsonb,  -- [{lead?, text}]
  add column if not exists date_label  text,          -- "Sunday 14 June 2026" / "2nd Sunday of each month"
  -- entry_type is a Free|Paid enum the business portal writes; `tickets` is the
  -- line the public page actually prints ("Free, non-ticketed", "Ticketed — see
  -- website"), which that enum can't express.
  add column if not exists tickets     text,
  add column if not exists phone       text,
  add column if not exists email       text;

create index if not exists business_events_homepage_idx on public.business_events (homepage);

-- The public site reads live events (the What's On grid, See & Do listing and
-- /event/:slug detail pages), so they need a read policy that isn't scoped to
-- the owning business the way the business portal's own policy is. Without
-- this, an anonymous visitor sees no events at all.
alter table public.business_events enable row level security;

drop policy if exists "public reads live events" on public.business_events;
create policy "public reads live events" on public.business_events
  for select using (status = 'Live');

-- Writes stay gated on admin_users.sql's "admins manage business_events"
-- policy (public.is_admin()), so the admin panel must be signed in to create
-- or moderate an event — which is the point.

-- Business submissions predate the slug column, so their public pages would
-- 404. Give every existing row a slug derived from its title, keeping the id
-- suffix so two events of the same name can't collide.
update public.business_events
   set slug = regexp_replace(lower(trim(title)), '[^a-z0-9]+', '-', 'g')
              || '-' || substr(id::text, 1, 6)
 where slug is null and title is not null;

