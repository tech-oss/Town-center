-- ═══════════════════════════════════════════════════════════════════════════
-- Stripe catalogue: every fixed-price thing a business can buy, as a real
-- product in Stripe.
--
-- Before this, only the standard Visibility Plan and the homepage slot
-- packages were products in Stripe. Everything else was priced on the fly at
-- checkout:
--   · article, event, featured article and push notification packs were sold
--     as one-off amounts (price_data), so no product ever existed for them;
--   · the hotel Visibility Plan and the accommodation plans were only made in
--     Stripe the first time someone bought one, so most never existed.
-- Stripe's reports, tax settings and the accountant all work per product, so
-- each of these is now a catalogue row here and a product in Stripe, made by
-- admin → Stripe Products ("Create missing in Stripe", stripe-catalogue
-- function), and checkout sells that product.
--
-- One row per price. Rows with the same product_key share a Stripe product
-- (the Visibility Plan's monthly and yearly prices); every add-on pack is its
-- own product, so receipts and reports name the pack.
--
-- Accommodation plans (accommodation_plan_tiers) and homepage slot packages
-- (homepage_slot_packages) keep their own tables; the same admin page checks
-- and creates those in Stripe too.
--
-- The amounts are what the business portal shows (Data/plans.js,
-- api/addonSlots.js); stripe-checkout charges the amount on the row.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.stripe_catalogue (
  key               text primary key,
  product_key       text not null,
  product_name      text not null,
  description       text,
  amount_pence      integer not null check (amount_pence > 0),
  -- null: paid once. 'month' / 'year': a subscription.
  billing_interval  text check (billing_interval in ('month', 'year')),
  -- How the price is found in Stripe again, whatever its id.
  lookup_key        text not null unique,
  sort_order        integer not null default 0,
  active            boolean not null default true,
  stripe_product_id text,
  stripe_price_id   text,
  synced_at         timestamptz,
  updated_at        timestamptz not null default now()
);

alter table public.stripe_catalogue enable row level security;

-- Prices are public anyway; only the stripe-catalogue function (service role)
-- writes.
drop policy if exists "catalogue readable" on public.stripe_catalogue;
create policy "catalogue readable" on public.stripe_catalogue for select using (true);
revoke insert, update, delete on public.stripe_catalogue from anon, authenticated;

insert into public.stripe_catalogue
  (key, product_key, product_name, description, amount_pence, billing_interval, lookup_key, sort_order)
values
  ('visibility_monthly', 'visibility', 'Business Visibility Plan',
   'Your full business listing on Maidenhead: logo, photos, opening hours, description, links, articles, reviews and analytics.',
   2999, 'month', 'visibility_monthly', 10),
  ('visibility_yearly', 'visibility', 'Business Visibility Plan',
   'Your full business listing on Maidenhead: logo, photos, opening hours, description, links, articles, reviews and analytics.',
   32900, 'year', 'visibility_yearly', 11),
  ('visibility_hotel_monthly', 'visibility_hotel', 'Business Visibility Plan — Hotels & Accommodation',
   'The Visibility Plan for hotels and accommodation: 12 photos, check-in, facilities and room details, articles, reviews and analytics.',
   3999, 'month', 'visibility_hotel_monthly', 20),
  ('visibility_hotel_yearly', 'visibility_hotel', 'Business Visibility Plan — Hotels & Accommodation',
   'The Visibility Plan for hotels and accommodation: 12 photos, check-in, facilities and room details, articles, reviews and analytics.',
   39900, 'year', 'visibility_hotel_yearly', 21),

  ('addon_article_1', 'addon_article_1', 'Extra article slot — 1 slot',
   'Valid 12 months. Re-usable — edit or replace the content as often as you like.', 999, null, 'addon_article_1', 30),
  ('addon_article_3', 'addon_article_3', 'Extra article slots — pack of 3',
   'Valid 12 months. Re-usable — edit or replace the content as often as you like.', 2499, null, 'addon_article_3', 31),
  ('addon_article_6', 'addon_article_6', 'Extra article slots — pack of 6',
   'Valid 12 months. Re-usable — edit or replace the content as often as you like.', 3999, null, 'addon_article_6', 32),

  ('addon_event_1', 'addon_event_1', 'Event slot — 1 slot',
   'Valid 12 months. Re-usable — when an event ends, put the next one in its place.', 999, null, 'addon_event_1', 40),
  ('addon_event_3', 'addon_event_3', 'Event slots — pack of 3',
   'Valid 12 months. Re-usable — when an event ends, put the next one in its place.', 2499, null, 'addon_event_3', 41),
  ('addon_event_6', 'addon_event_6', 'Event slots — pack of 6',
   'Valid 12 months. Re-usable — when an event ends, put the next one in its place.', 3999, null, 'addon_event_6', 42),

  ('addon_featured_article_1', 'addon_featured_article_1', 'Featured Article slot — 1 slot',
   'Valid 12 months. Re-usable — edit or replace the content as often as you like.', 4999, null, 'addon_featured_article_1', 50),
  ('addon_featured_article_3', 'addon_featured_article_3', 'Featured Article slots — pack of 3',
   'Valid 12 months. Re-usable — edit or replace the content as often as you like.', 11999, null, 'addon_featured_article_3', 51),
  ('addon_featured_article_6', 'addon_featured_article_6', 'Featured Article slots — pack of 6',
   'Valid 12 months. Re-usable — edit or replace the content as often as you like.', 19999, null, 'addon_featured_article_6', 52),

  ('addon_push_notification_1', 'addon_push_notification_1', 'Push notification — 1 credit',
   'Valid 12 months. Use it whenever you like — each notification sent uses one credit.', 1499, null, 'addon_push_notification_1', 60),
  ('addon_push_notification_3', 'addon_push_notification_3', 'Push notifications — pack of 3',
   'Valid 12 months. Use them whenever you like — each notification sent uses one credit.', 3499, null, 'addon_push_notification_3', 61),
  ('addon_push_notification_6', 'addon_push_notification_6', 'Push notifications — pack of 6',
   'Valid 12 months. Use them whenever you like — each notification sent uses one credit.', 5999, null, 'addon_push_notification_6', 62),
  ('addon_push_notification_12', 'addon_push_notification_12', 'Push notifications — pack of 12',
   'Valid 12 months. Use them whenever you like — each notification sent uses one credit.', 9999, null, 'addon_push_notification_12', 63)
on conflict (key) do nothing;

notify pgrst, 'reload schema';
