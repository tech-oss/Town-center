// The two subscription plans, and what each one unlocks. One definition per
// branch (admin-panel carries the same file), used by admin's registration
// form and content editors, the business dashboard's editors and
// subscription page, and the public site's business pages.
//
// The paid plan is stored as key "premium" everywhere (database, Stripe
// metadata, code checks); "Visibility Plan" is only its name.
//
// The database enforces the same split: public.public_business_profiles
// withholds every paid-only column for a free business, so a free listing's
// description, hours, gallery, socials and website never reach the public
// site even if a client asked for them.

export const FREE_PLAN = {
  key: "free",
  name: "Free",
  price: 0,
  tagline: "Get listed",
  features: ["Business name", "Address", "Telephone & email", "Hero image"],
};

// Monthly and annual billing for the Visibility Plan. `stripePriceSecret`
// names the Supabase secret holding that price's Stripe ID.
export const BILLING_OPTIONS = {
  year: {
    key: "year",
    price: 329,
    label: "/ year",
    perDay: "90p",
    saving: 30, // vs 12 × £29.99 (£359.88), rounded down so it's never overstated
    stripePriceSecret: "STRIPE_PRICE_VISIBILITY_YEARLY",
  },
  month: {
    key: "month",
    price: 29.99,
    label: "/ month",
    perDay: "99p",
    saving: 0,
    stripePriceSecret: "STRIPE_PRICE_VISIBILITY_MONTHLY",
  },
};

// The ten things the Visibility Plan is sold on, in the order they appear on
// the subscription page. Events, FAQs and services lists also unlock but are
// deliberately not advertised here.
export const VISIBILITY_FEATURES = [
  { icon: "logo",        title: "Your business logo",       detail: "Make your business instantly recognisable." },
  { icon: "photos",      title: "Up to 6 photos",           detail: "Show customers what makes your business special." },
  { icon: "hours",       title: "Opening hours",            detail: "Help customers know when you're open." },
  { icon: "headline",    title: "Headline title",           detail: "Create a strong headline to grab attention." },
  { icon: "description", title: "Full business description", detail: "Tell your story on your own dedicated page." },
  { icon: "social",      title: "Social media links",       detail: "Connect customers to your social channels." },
  { icon: "website",     title: "Your website link",        detail: "Send customers straight to your website." },
  { icon: "booking",     title: "Direct booking link",      detail: "Make it easy for customers to book with you." },
  { icon: "articles",    title: "Up to 3 articles",         detail: "Publish news, offers and updates." },
  { icon: "analytics",   title: "Business analytics",       detail: "See your page views and article views, so you can understand what's getting attention." },
];

export const PREMIUM_PLAN = {
  key: "premium",
  name: "Visibility Plan",
  // The headline monthly price, used wherever one figure is shown.
  price: BILLING_OPTIONS.month.price,
  yearlyPrice: BILLING_OPTIONS.year.price,
  tagline: "Everything you need to showcase your business and attract more customers.",
  features: VISIBILITY_FEATURES.map((f) => f.title),
};

export const PLANS = [FREE_PLAN, PREMIUM_PLAN];

export const planFor = (key) => PLANS.find((p) => p.key === key) ?? FREE_PLAN;

// Anything that isn't explicitly the paid plan is treated as free, so a
// missing or retired value (standard, basic, vip…) can never unlock features.
export const isPremium = (plan) => String(plan ?? "").toLowerCase() === "premium";

// Shown as "£29.99" / "£329".
export const formatPrice = (n) => `£${Number.isInteger(n) ? n : n.toFixed(2)}`;

// The listing fields a free business may edit. Everything else is shown but
// locked. `address` and `postalCode` together make up the address.
export const FREE_EDITABLE_FIELDS = new Set(["name", "address", "postalCode", "phone", "email", "heroImage"]);

export const canEditField = (plan, field) => isPremium(plan) || FREE_EDITABLE_FIELDS.has(field);

// Wording the public pages use in place of paid content on a free listing.
export const FREE_PLACEHOLDERS = {
  description: "Business description coming soon",
  hours: "Coming Soon",
  gallery: "Business will add pictures soon",
  news: "Business will add offers soon",
};
