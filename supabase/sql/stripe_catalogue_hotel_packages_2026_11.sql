-- ═══════════════════════════════════════════════════════════════════════════
-- Stripe catalogue: the hotel plan as one "Hotel Packages" product.
--
-- The first sync left the hotel prices on two products: £39.99/month on a
-- new one, and £399/year on the product an earlier test purchase had made
-- ("Visibility Plan — Hotels & Accommodation"). The stripe-catalogue
-- function now keeps every price of a product_key on one product, moving a
-- stray price across (a new price on the right product; the old one is
-- archived, and its product too once nothing on it is for sale).
--
-- product_name_pushed: the name last sent to Stripe. A product's name is
-- only sent again when it's changed here, so a name edited in Stripe is
-- otherwise left alone.
--
-- The standard plan's monthly and yearly prices are on two products the
-- client set up themselves, so they get a product_key each and are never
-- merged.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.stripe_catalogue add column if not exists product_name_pushed text;

-- Everything synced so far has the name it was created with.
update public.stripe_catalogue
   set product_name_pushed = product_name
 where product_name_pushed is null and stripe_product_id is not null
   and product_key <> 'visibility_hotel';

update public.stripe_catalogue
   set product_key = key
 where key in ('visibility_monthly', 'visibility_yearly');

update public.stripe_catalogue
   set product_name = 'Hotel Packages',
       description = 'The Business Visibility Plan for hotels and accommodation: 12 photos, check-in, facilities and room details, articles, reviews and analytics. Monthly or yearly.',
       updated_at = now()
 where product_key = 'visibility_hotel';

notify pgrst, 'reload schema';
