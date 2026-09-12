// The two subscription plans, and what each one unlocks. One definition per
// branch (business-dashboard carries the same file), used by admin's
// registration form and content editors, the business dashboard's editors
// and upgrade flow, and the public site's business pages.
//
// The database enforces the same split: public.public_business_profiles
// withholds every premium-only column for a free business, so a free
// listing's description, hours, gallery, socials and website never reach the
// public site even if a client asked for them.

export const PLANS = [
  {
    key: "free",
    name: "Free",
    price: 0,
    tagline: "Get listed",
    features: ["Business name", "Address", "Telephone & email", "Hero image"],
  },
  {
    key: "premium",
    name: "Premium",
    price: 39,
    tagline: "Your full business profile",
    features: [
      "Business description & tagline",
      "Opening hours",
      "Photo gallery",
      "Website & booking buttons",
      "Social media links",
      "Map & directions",
      "News & offers",
      "FAQs, services & portfolio",
    ],
  },
];

export const FREE_PLAN = PLANS[0];
export const PREMIUM_PLAN = PLANS[1];

export const planFor = (key) => PLANS.find((p) => p.key === key) ?? FREE_PLAN;

// Anything that isn't explicitly premium is treated as free, so a missing or
// retired value (standard, basic, vip…) can never unlock paid features.
export const isPremium = (plan) => String(plan ?? "").toLowerCase() === "premium";

// The listing fields a free business may edit. Everything else is shown but
// locked. `address` and `postalCode` together make up the address.
export const FREE_EDITABLE_FIELDS = new Set(["name", "address", "postalCode", "phone", "email", "heroImage"]);

export const canEditField = (plan, field) => isPremium(plan) || FREE_EDITABLE_FIELDS.has(field);

// Wording the public pages use in place of premium content on a free listing.
export const FREE_PLACEHOLDERS = {
  description: "Business description coming soon",
  hours: "Coming Soon",
  gallery: "Business will add pictures soon",
  news: "Business will add offers soon",
};
