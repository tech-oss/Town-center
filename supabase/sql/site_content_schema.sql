-- ═══════════════════════════════════════════════════════════════════════════
-- Schema for the admin screens that still run on mock data.
--
-- Everything below is site-owned content — written by admin, read by the public
-- site — rather than anything a business submits. That split drives the RLS
-- pattern used throughout: the public can read only what is published, and only
-- an admin can write. Business-submitted content keeps its existing tables and
-- its own approval flow.
--
-- Safe to re-run: every statement is guarded (create ... if not exists, and
-- drop policy if exists before each create policy). The SQL Editor runs a file
-- as a single transaction, so one "policy already exists" error rolls back the
-- whole thing — hence the guards.
--
-- Depends on admin_users.sql having been run (public.is_admin()).
-- ═══════════════════════════════════════════════════════════════════════════


-- ── Shared conventions ─────────────────────────────────────────────────────
-- • `status` is 'Published' | 'Draft' | 'Hidden' everywhere the admin UI shows
--   those three tabs, so one StatusTag covers every screen.
-- • `slug` is the public URL segment, unique per table.
-- • Image columns hold Supabase Storage public URLs (text), matching how
--   business_listings.gallery already stores them.
-- • `sort_order` exists wherever admin drags things into a deliberate order.


-- ═══ Events & News (site-curated "What's On") ══════════════════════════════
-- Distinct from business_events: these are written by admin about the town,
-- not submitted by a business for approval.

create table if not exists public.site_events (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique,
  title        text not null,
  category     text,                      -- Family / Market / Theatre / Sport / Music
  -- Recurring events ("Maidenhead Farmers' Market") have no single date, so the
  -- date is nullable and `date_label` carries what the site should display.
  event_date   date,
  date_label   text,
  venue        text,
  excerpt      text,
  body         text,
  hero_image   text,
  thumbnail    text,
  status       text not null default 'Draft' check (status in ('Published', 'Draft', 'Hidden')),
  featured     boolean not null default false,
  author       text,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.site_news (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique,
  title          text not null,
  category       text,                    -- Transport / Business / Sport / Retail
  excerpt        text,
  body           text,
  hero_image     text,
  thumbnail      text,
  status         text not null default 'Draft' check (status in ('Published', 'Draft', 'Hidden')),
  featured       boolean not null default false,
  author         text,
  published_at   date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);


-- ═══ Properties ════════════════════════════════════════════════════════════
-- Two sources: agents' XML feeds (auto-published on import) and manual admin
-- entries (which need approval). `source` records which, and `feed_id` ties an
-- imported row back to the feed that produced it so a re-sync can update it.

create table if not exists public.property_feeds (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  url          text not null,
  agent_name   text,
  active       boolean not null default true,
  last_sync    timestamptz,
  imported     int not null default 0,
  skipped      int not null default 0,
  errors       int not null default 0,
  -- Per-row reasons an import was skipped, so admin can see what a feed
  -- dropped without opening server logs.
  skip_log     jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now()
);

create table if not exists public.properties (
  id             uuid primary key default gen_random_uuid(),
  external_id    text,                    -- the agent's own id, for feed re-sync
  feed_id        uuid references public.property_feeds(id) on delete set null,
  address        text not null,
  postcode       text,
  agent          text,
  property_type  text,                    -- Flat / House / …
  beds           int,
  baths          int,
  -- Price is text because listings mix "£425,000" and "£2,100/mo"; price_value
  -- carries the sortable number and price_period says which it is.
  price          text,
  price_value    numeric,
  price_period   text check (price_period in ('sale', 'month', 'week')),
  description    text,
  images         jsonb not null default '[]'::jsonb,
  lat            double precision,
  lng            double precision,
  status         text not null default 'Pending'
    check (status in ('Pending', 'Approved', 'Auto-published', 'Rejected', 'Hidden')),
  source         text not null default 'manual' check (source in ('manual', 'xml')),
  listed_at      date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (feed_id, external_id)
);

create index if not exists properties_status_idx on public.properties (status, listed_at desc);


-- ═══ Explore (Projects) ════════════════════════════════════════════════════

create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique,
  title        text not null,
  description  text,
  body         text,
  image        text,
  gallery      jsonb not null default '[]'::jsonb,
  published    boolean not null default false,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);


-- ═══ In the Spotlight (homepage news & offers) ═════════════════════════════
-- Admin-curated promotion of a business. Deliberately separate from
-- business_articles: that table is what a business writes and admin approves,
-- whereas this is what admin chooses to put on the homepage, with its own
-- copy, its own schedule, and a record of whether the business paid for it.

create table if not exists public.news_offers (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique,
  business_id       text references public.businesses(id) on delete set null,
  business_name     text,                 -- denormalised: survives the business being removed
  type              text not null default 'news' check (type in ('news', 'offer')),
  category          text,                 -- "What's On" / "Offer"
  title             text not null,
  excerpt           text,
  body              text,
  image             text,
  date_label        text,                 -- e.g. "Monthly · 7pm"
  start_date        date,
  end_date          date,
  status            text not null default 'Draft' check (status in ('Published', 'Draft', 'Hidden')),
  featured_on_home  boolean not null default false,
  pay_type          text check (pay_type in ('Paid', 'Complimentary')),
  sort_order        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists news_offers_home_idx on public.news_offers (featured_on_home, sort_order);


-- ═══ Featured Stories (homepage carousel) ══════════════════════════════════

create table if not exists public.featured_stories (
  id           uuid primary key default gen_random_uuid(),
  category     text,
  title        text not null,
  excerpt      text,
  image        text,
  href         text,                      -- where the card links to
  status       text not null default 'Draft' check (status in ('Published', 'Draft', 'Hidden')),
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);


-- ═══ Articles & Neighbourhood Guides ═══════════════════════════════════════
-- Admin-authored editorial. `business_id` is optional — an article can be about
-- a business without being written by it.

create table if not exists public.articles (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique,
  title        text not null,
  category     text,                      -- Offers / News / Featured Story / Neighbourhood Guide
  author       text,
  business_id  text references public.businesses(id) on delete set null,
  body         text,
  thumbnail    text,
  hero_image   text,
  tags         jsonb not null default '[]'::jsonb,
  meta_title   text,
  meta_description text,
  status       text not null default 'Draft' check (status in ('Published', 'Draft', 'Hidden')),
  published_at date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.neighbourhood_guides (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique,
  title             text not null,
  area              text,                 -- Town Centre / Riverside / …
  body              text,
  thumbnail         text,
  hero_image        text,
  status            text not null default 'Draft' check (status in ('Published', 'Draft', 'Hidden')),
  show_on_homepage  boolean not null default false,
  show_on_platform  boolean not null default true,
  sort_order        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);


-- ═══ Site Content (hero copy, section headers) ═════════════════════════════
-- One row per editable section of the public site, keyed by the same `key` the
-- admin screen already uses ("homepage", "see-do", …). The fields differ per
-- section kind, so the editable copy lives in a jsonb `content` blob rather
-- than a column per field — this table would otherwise need a new migration
-- every time a section gains a heading.

create table if not exists public.site_content (
  key         text primary key,           -- "homepage" | "see-do" | "shop" | …
  label       text not null,
  kind        text not null,              -- "homepage" | "listing"
  content     jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);


-- ═══ Push Notifications ════════════════════════════════════════════════════
-- Sent history. Delivery itself needs a push provider (FCM / web-push) and a
-- table of device tokens, which is a separate piece of work — this records what
-- was sent and to whom so the admin screen has a real history.

create table if not exists public.push_notifications (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  body              text,
  url               text,
  audience          text not null default 'all',   -- all | businesses | users
  channels          jsonb not null default '[]'::jsonb,  -- ["Web","Mobile"]
  notif_type        text not null default 'simple' check (notif_type in ('simple', 'rich')),
  -- A rich notification attaches an article card; kept as its own columns so
  -- the history still reads correctly if the article is later deleted.
  article_id        uuid,
  article_title     text,
  article_image     text,
  article_link      text,
  reach             int,
  sent_at           timestamptz not null default now(),
  sent_by           uuid references public.admin_users(id) on delete set null
);

create index if not exists push_notifications_sent_idx on public.push_notifications (sent_at desc);


-- ═══ Platform Settings ═════════════════════════════════════════════════════
-- Single row (id = true) so there can only ever be one settings record.

create table if not exists public.platform_settings (
  id                     boolean primary key default true check (id),
  site_name              text not null default 'Maidenhead Town Centre Portal',
  support_email          text,
  approval_required      boolean not null default true,
  xml_sync_hour          int not null default 6 check (xml_sync_hour between 0 and 23),
  max_gallery_images     int not null default 8,
  featured_listings_max  int not null default 3,
  updated_at             timestamptz not null default now()
);

insert into public.platform_settings (id) values (true) on conflict (id) do nothing;


-- ═══ Row Level Security ════════════════════════════════════════════════════
-- Same shape for every table above: the public reads published rows, admins do
-- everything. Properties additionally expose 'Auto-published' as public.

alter table public.site_events          enable row level security;
alter table public.site_news            enable row level security;
alter table public.property_feeds       enable row level security;
alter table public.properties           enable row level security;
alter table public.projects             enable row level security;
alter table public.news_offers          enable row level security;
alter table public.featured_stories     enable row level security;
alter table public.articles             enable row level security;
alter table public.neighbourhood_guides enable row level security;
alter table public.site_content         enable row level security;
alter table public.push_notifications   enable row level security;
alter table public.platform_settings    enable row level security;

drop policy if exists "public reads published site_events" on public.site_events;
create policy "public reads published site_events" on public.site_events          for select using (status = 'Published');
drop policy if exists "public reads published site_news" on public.site_news;
create policy "public reads published site_news" on public.site_news            for select using (status = 'Published');
drop policy if exists "public reads live properties" on public.properties;
create policy "public reads live properties" on public.properties           for select using (status in ('Approved', 'Auto-published'));
drop policy if exists "public reads published projects" on public.projects;
create policy "public reads published projects" on public.projects             for select using (published);
drop policy if exists "public reads published news_offers" on public.news_offers;
create policy "public reads published news_offers" on public.news_offers          for select using (status = 'Published');
drop policy if exists "public reads published featured_stories" on public.featured_stories;
create policy "public reads published featured_stories" on public.featured_stories     for select using (status = 'Published');
drop policy if exists "public reads published articles" on public.articles;
create policy "public reads published articles" on public.articles             for select using (status = 'Published');
drop policy if exists "public reads published guides" on public.neighbourhood_guides;
create policy "public reads published guides" on public.neighbourhood_guides for select using (status = 'Published');
drop policy if exists "public reads site_content" on public.site_content;
create policy "public reads site_content" on public.site_content         for select using (true);
drop policy if exists "public reads platform_settings" on public.platform_settings;
create policy "public reads platform_settings" on public.platform_settings    for select using (true);

drop policy if exists "admins manage site_events" on public.site_events;
create policy "admins manage site_events" on public.site_events          for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage site_news" on public.site_news;
create policy "admins manage site_news" on public.site_news            for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage property_feeds" on public.property_feeds;
create policy "admins manage property_feeds" on public.property_feeds       for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage properties" on public.properties;
create policy "admins manage properties" on public.properties           for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage projects" on public.projects;
create policy "admins manage projects" on public.projects             for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage news_offers" on public.news_offers;
create policy "admins manage news_offers" on public.news_offers          for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage featured_stories" on public.featured_stories;
create policy "admins manage featured_stories" on public.featured_stories     for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage articles" on public.articles;
create policy "admins manage articles" on public.articles             for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage guides" on public.neighbourhood_guides;
create policy "admins manage guides" on public.neighbourhood_guides for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage site_content" on public.site_content;
create policy "admins manage site_content" on public.site_content         for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage push_notifications" on public.push_notifications;
create policy "admins manage push_notifications" on public.push_notifications   for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage platform_settings" on public.platform_settings;
create policy "admins manage platform_settings" on public.platform_settings    for all using (public.is_admin()) with check (public.is_admin());
