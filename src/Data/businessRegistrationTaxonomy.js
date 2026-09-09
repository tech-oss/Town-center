// Kept as a re-export so admin's existing import sites don't all have to
// change. The lists themselves live in the canonical taxonomy — one file,
// identical on all three branches — so admin's Register Business form, the
// business portal's signup form and the public site's filters can no longer
// drift apart. Edit src/Data/taxonomy.js, never this.
export {
  BUSINESS_TYPES,
  FREELANCER_KINDS,
  FREELANCER_CATEGORIES,
  PROFESSIONAL_CATEGORIES,
  TRADESPERSON_CATEGORIES,
  FREELANCER_KIND_CATEGORIES,
  HOTEL_KINDS,
  CUISINE_TYPES,
  VENUE_TYPES,
  SHOP_CATEGORIES,
  SHOP_GROUPS,
  SEE_DO_CATEGORIES,
  SUBSCRIPTION_PLANS,
  CATEGORY_TITLES,
  categoryLabel,
  labelFor,
} from "./taxonomy";
