// ════════════════════════════════════════════════════════════════════════════
//  CANONICAL BUSINESS TAXONOMY — single source of truth for every category
//  and subcategory on the platform.
//
//  This file is byte-identical on all three branches (main, admin-panel,
//  business-dashboard), which are never merged into one another. Editing a
//  category means editing it here and copying this file to the other two —
//  nothing downstream should ever hard-code a category list again.
//
//  Everything derives from the lists below:
//    • business-dashboard  — the 5-step signup form's pickers
//    • admin-panel         — Register Business form + business detail cards
//    • main (public site)  — section nav columns, filter chips, URL ?category=
//    • main (mobile app)   — the same, on the mobile screens
//
//  ── Slug rules ──────────────────────────────────────────────────────────
//  A slug is a permanent identifier. It is what's written into
//  business_listings.business_type_detail and what appears in public URLs
//  (/shop?category=…), so renaming one orphans stored data and breaks links.
//
//  Two consequences, both deliberate:
//    1. Where a category was relabelled but means the same thing, the slug is
//       kept. `solicitors` is labelled "Legal Services"; `cleaners` is
//       labelled "Cleaning". The slug looking slightly dated is a far smaller
//       cost than migrating every row that references it.
//    2. Slugs are unique across ALL lists, not just within one. The public
//       site keys a single flat ?category= namespace off them, so a venue
//       "Other" and a cuisine "Other" cannot both be `other` — hence
//       `other-venue` / `other-cuisine` / `other-see-do` and so on.
// ════════════════════════════════════════════════════════════════════════════

export const BUSINESS_TYPES = [
  { value: "eat-drink",  label: "Eat & Drink" },
  { value: "shop",       label: "Shop & Local Services" },
  { value: "see-do",     label: "See & Do" },
  { value: "hotel",      label: "Hotel & Accommodation" },
  { value: "freelancer", label: "Services" },
];

// ── Services ───────────────────────────────────────────────────────────────
// One business type ("Services") that branches into three kinds, each with
// its own category list. All three write into the same
// business_type_detail.freelancerCategories array, which is why an
// "IT & Technology" in two of them needs two distinct slugs.

export const FREELANCER_KINDS = [
  { value: "tradesperson", label: "Tradesperson" },
  { value: "professional", label: "Professional" },
  { value: "freelancer",   label: "Freelancer" },
];

export const FREELANCER_CATEGORIES = [
  { value: "web-digital",              label: "Web & Digital" },
  { value: "design-creative",          label: "Design & Creative" },
  { value: "marketing-social-media",   label: "Marketing & Social Media" },
  { value: "photography-video",        label: "Photography & Video" },
  { value: "writing-content",          label: "Writing & Content" },
  { value: "it-technology-freelance",  label: "IT & Technology" },
  { value: "business-services",        label: "Business Services" },
  { value: "tutoring-training",        label: "Tutoring & Training" },
  { value: "admin-virtual-assistance", label: "Admin & Virtual Assistance" },
  { value: "other-freelancer",         label: "Other" },
];

export const TRADESPERSON_CATEGORIES = [
  { value: "builders",              label: "Builders & General Building" },
  { value: "plumbers",              label: "Plumbers" },
  { value: "electricians",          label: "Electricians" },
  { value: "heating-boiler",        label: "Heating & Boiler Engineers" },
  { value: "roofers",               label: "Roofers" },
  { value: "decorators-painters",   label: "Painters & Decorators" },
  { value: "carpenters-joiners",    label: "Carpenters & Joiners" },
  { value: "landscapers-gardeners", label: "Landscapers & Gardeners" },
  { value: "locksmiths",            label: "Locksmith" },
  { value: "cleaners",              label: "Cleaning" },
  { value: "other-tradesperson",    label: "Other" },
];

export const PROFESSIONAL_CATEGORIES = [
  { value: "accountants",               label: "Accountants & Finance" },
  { value: "solicitors",                label: "Legal Services" },
  { value: "financial-advisers",        label: "Financial & Mortgage Advice" },
  { value: "estate-agents",             label: "Property & Estate Agents" },
  { value: "insurance-brokers",         label: "Insurance" },
  { value: "marketing-advertising",     label: "Marketing & Advertising" },
  { value: "it-technology-professional",label: "IT & Technology" },
  { value: "architects-surveyors",      label: "Architects & Surveyors" },
  { value: "recruitment",               label: "Recruitment & HR" },
  { value: "business-consultants",      label: "Business Consultants" },
  { value: "health-wellbeing",          label: "Health & Wellbeing" },
  { value: "other-professional",        label: "Other" },
];

export const FREELANCER_KIND_CATEGORIES = {
  tradesperson: TRADESPERSON_CATEGORIES,
  professional: PROFESSIONAL_CATEGORIES,
  freelancer:   FREELANCER_CATEGORIES,
};

// ── Hotel & Accommodation ──────────────────────────────────────────────────

export const HOTEL_KINDS = [
  { value: "hotel",         label: "Hotel" },
  { value: "accommodation", label: "Accommodation" },
];

// ── Eat & Drink ────────────────────────────────────────────────────────────
// Two independent pickers; a venue carries both a venue type and a cuisine.

export const VENUE_TYPES = [
  { value: "restaurants",    label: "Restaurants" },
  { value: "bars",           label: "Bars" },
  { value: "cafes",          label: "Cafes" },
  { value: "grab-go",        label: "Grab & Go" },
  { value: "bakery",         label: "Bakery" },
  { value: "takeaway",       label: "Takeaway" },
  { value: "private-dining", label: "Private Dining" },
  { value: "other-venue",    label: "Other" },
];

export const CUISINE_TYPES = [
  { value: "british",       label: "British" },
  { value: "italian",       label: "Italian" },
  { value: "chinese",       label: "Chinese" },
  { value: "indian",        label: "Indian" },
  { value: "french",        label: "French" },
  { value: "thai",          label: "Thai" },
  { value: "japanese",      label: "Japanese" },
  { value: "moroccan",      label: "Moroccan" },
  { value: "lebanese",      label: "Lebanese" },
  { value: "bangladeshi",   label: "Bangladeshi" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "portuguese",    label: "Portuguese" },
  { value: "dessert",       label: "Dessert" },
  { value: "pizza",         label: "Pizza" },
  { value: "gastropub",     label: "Gastropub" },
  { value: "pan-european",  label: "Pan European" },
  { value: "other-cuisine", label: "Other" },
];

// ── Shop & Local Services ──────────────────────────────────────────────────
// One business type, two groups. `group` drives the grouped checkbox columns
// in both signup forms and the two nav columns on the public /shop page.

export const SHOP_GROUPS = ["Shop", "Local Services"];

export const SHOP_CATEGORIES = [
  { value: "food-groceries",        label: "Food & Groceries",                      group: "Shop" },
  { value: "fashion-clothing",      label: "Fashion & Clothing",                    group: "Shop" },
  { value: "health-beauty",         label: "Health & Beauty",                       group: "Shop" },
  { value: "home-garden",           label: "Home & Garden",                         group: "Shop" },
  { value: "department-retail",     label: "Department & General Retail",           group: "Shop" },
  { value: "gifts-lifestyle",       label: "Gifts & Lifestyle",                     group: "Shop" },
  { value: "electronics-phones",    label: "Electronics & Phones",                  group: "Shop" },
  { value: "diy-hardware",          label: "DIY & Hardware",                        group: "Shop" },
  { value: "jewellery-watches",     label: "Jewellery & Watches",                   group: "Shop" },
  { value: "books-stationery",      label: "Books, Stationery, Hobbies & Toys",     group: "Shop" },
  { value: "pets-supplies",         label: "Pets & Pet Supplies",                   group: "Shop" },
  { value: "sports-fitness",        label: "Sports & Fitness",                      group: "Shop" },
  { value: "footwear",              label: "Footwear",                              group: "Shop" },
  { value: "automotive-cycles",     label: "Automotive & Cycles",                   group: "Shop" },
  { value: "other-shop",            label: "Other",                                 group: "Shop" },

  { value: "banks",                 label: "Banks & Foreign Exchange",              group: "Local Services" },
  { value: "postal-services",       label: "Postal Services",                       group: "Local Services" },
  { value: "taxi-private-hire",     label: "Taxi & Private Hire",                   group: "Local Services" },
  { value: "removals-storage",      label: "Removals & Storage",                    group: "Local Services" },
  { value: "locksmiths-key-cutting",label: "Locksmiths & Key Cutting",              group: "Local Services" },
  { value: "dry-cleaning",          label: "Dry Cleaning & Laundry",                group: "Local Services" },
  { value: "alterations-repairs",   label: "Clothing, Footwear Alterations & Repairs", group: "Local Services" },
  { value: "travel-agents",         label: "Travel Agents",                         group: "Local Services" },
  { value: "hairdressing",          label: "Hair & Beauty",                         group: "Local Services" },
  { value: "childcare",             label: "Childcare",                             group: "Local Services" },
  { value: "funeral-services",      label: "Funeral Services",                      group: "Local Services" },
  { value: "spa",                   label: "Spa & Wellness",                        group: "Local Services" },
  { value: "other-local-services",  label: "Other",                                 group: "Local Services" },
];

// The three Services kinds flattened into one grouped list, the same shape
// SHOP_CATEGORIES has. Used wherever Services categories are shown together
// rather than one kind at a time (admin's Listings filters, the public
// /services nav columns).
export const SERVICES_GROUPS = ["Tradespeople", "Professionals", "Freelancers"];

export const SERVICES_CATEGORIES = [
  ...TRADESPERSON_CATEGORIES.map((c) => ({ ...c, group: "Tradespeople" })),
  ...PROFESSIONAL_CATEGORIES.map((c) => ({ ...c, group: "Professionals" })),
  ...FREELANCER_CATEGORIES.map((c) => ({ ...c, group: "Freelancers" })),
];

// ── See & Do ───────────────────────────────────────────────────────────────

export const SEE_DO_CATEGORIES = [
  { value: "sport-wellness", label: "Sport & Wellness" },
  { value: "gaming",         label: "Gaming" },
  { value: "film",           label: "Film" },
  { value: "art-culture",    label: "Art & Culture" },
  { value: "learning",       label: "Learning" },
  { value: "music-dance",    label: "Music & Dance" },
  { value: "theatre",        label: "Theatre" },
  { value: "community",      label: "Community" },
  { value: "family",         label: "Family" },
  { value: "markets",        label: "Markets" },
  { value: "other-see-do",   label: "Other" },
];

// ── Subscription plans ─────────────────────────────────────────────────────
// Not a category, but shares the same "both signup forms must agree" problem.

export const SUBSCRIPTION_PLANS = [
  { key: "free",     name: "Free",     price: 0,  features: ["Listing page", "1 photo", "Business contact details"] },
  { key: "standard", name: "Standard", price: 39, features: ["Everything in Free", "Unlimited photos", "News & Offers section", "Priority in search results"] },
  { key: "premium",  name: "Premium",  price: 79, features: ["Everything in Standard", "Featured placement", "Analytics dashboard", "Homepage spotlight eligibility"] },
];

// ── Retired slugs ──────────────────────────────────────────────────────────
// The September 2026 taxonomy revision replaced four category lists outright.
// Slugs were kept wherever a category survived under a new label (see the
// header), but these genuinely went away, and rows in
// business_listings.business_type_detail — plus any bookmarked
// /shop?category=… link — still reference them.
//
// Mapping them here rather than only in a migration means nothing breaks if
// the migration hasn't run yet, or if a stale value turns up later: the label
// still resolves and the filter still lands somewhere sensible. The migration
// (supabase/sql/taxonomy_2026_09_remap.sql) is cleanup, not a prerequisite.
export const LEGACY_CATEGORY_ALIASES = {
  // Shop — list rewritten
  "accessories-jewellery": "jewellery-watches",
  clothing:                "fashion-clothing",
  groceries:               "food-groceries",
  "home-furniture":        "home-garden",
  "shoes-footwear":        "footwear",
  // Local Services — Healthcare and Opticians were dropped; Health & Beauty
  // is the nearest surviving home for anything filed under them.
  healthcare:              "health-beauty",
  opticians:               "health-beauty",
  // Services — Freelancer list rewritten around disciplines rather than roles
  "graphic-designers":     "design-creative",
  "web-developers":        "web-digital",
  photographers:           "photography-video",
  copywriters:             "writing-content",
  "marketing-consultants": "marketing-social-media",
  "personal-trainers":     "tutoring-training",
  tutors:                  "tutoring-training",
  "virtual-assistants":    "admin-virtual-assistance",
  // See & Do never had a "Fashion & Beauty" chip to filter by, only items
  // tagged with it.
  "fashion-beauty":        "other-see-do",
  // The old shared "other" — ambiguous across venue/cuisine/see-do, which is
  // why it was split. Resolves to See & Do's, the only list that used a bare
  // "other" on the public site.
  other:                   "other-see-do",
};

// Resolves a stored slug to the one currently in use. Safe to call on a slug
// that's already current — it returns it unchanged.
export function resolveCategory(value) {
  return LEGACY_CATEGORY_ALIASES[value] ?? value;
}

// ── Derived lookups ────────────────────────────────────────────────────────
// Built from the lists above rather than maintained alongside them, so a
// category can never exist in a picker but be missing from the public site's
// label map (which is exactly how categories used to render as raw slugs).

export const ALL_CATEGORIES = [
  ...VENUE_TYPES,
  ...CUISINE_TYPES,
  ...SHOP_CATEGORIES,
  ...SEE_DO_CATEGORIES,
  ...TRADESPERSON_CATEGORIES,
  ...PROFESSIONAL_CATEGORIES,
  ...FREELANCER_CATEGORIES,
];

export const CATEGORY_TITLES = Object.fromEntries(
  ALL_CATEGORIES.map((c) => [c.value, c.label]),
);

// Options for one group within Shop & Local Services.
export function shopGroup(group) {
  return SHOP_CATEGORIES.filter((c) => c.group === group);
}

// Every category slug that belongs to a given business type — used to scope
// a section's filter chips to just that section's own categories.
export function categoriesForType(type) {
  switch (type) {
    case "eat-drink":  return [...VENUE_TYPES, ...CUISINE_TYPES];
    case "shop":       return SHOP_CATEGORIES;
    case "see-do":     return SEE_DO_CATEGORIES;
    case "freelancer": return [...TRADESPERSON_CATEGORIES, ...PROFESSIONAL_CATEGORIES, ...FREELANCER_CATEGORIES];
    default:           return [];
  }
}

export function labelFor(options, value) {
  return options.find((o) => o.value === value)?.label ?? value;
}

// Label for any slug from any list — what the public site and admin cards use
// when they have a stored slug and no idea which list it came from. Resolves
// retired slugs first, so a listing saved before the taxonomy revision still
// shows a real label rather than its raw slug.
export function categoryLabel(value) {
  return CATEGORY_TITLES[resolveCategory(value)] ?? value;
}

// Builds a section nav column's links straight from a category list, so the
// public site's dropdowns can't drift from the pickers people chose from.
export function categoryLinks(basePath, options, { seeAll } = {}) {
  const links = options.map((o) => ({ label: o.label, to: `${basePath}?category=${o.value}` }));
  return seeAll ? [{ label: seeAll, to: basePath }, ...links] : links;
}
