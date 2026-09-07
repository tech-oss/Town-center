// The exact category taxonomy used by the business portal's own 5-step
// signup form (src/business/pages/SignUpPage.jsx on business-dashboard) —
// ported here so admin's own "Register Business" form and the detail view on
// each business card show the same options with the same labels, rather than
// admin's own older/divergent section list.

export const BUSINESS_TYPES = [
  { value: "eat-drink", label: "Eat & Drink" },
  { value: "shop",      label: "Shop & Local Services" },
  { value: "see-do",    label: "See & Do" },
  { value: "hotel",     label: "Hotel & Accommodation" },
  { value: "freelancer",label: "Services" },
];

export const FREELANCER_KINDS = [
  { value: "tradesperson", label: "Tradesperson" },
  { value: "professional", label: "Professional" },
  { value: "freelancer",   label: "Freelancer" },
];

export const FREELANCER_CATEGORIES = [
  { value: "graphic-designers",  label: "Graphic Designers" },
  { value: "web-developers",     label: "Web Developers" },
  { value: "photographers",      label: "Photographers" },
  { value: "copywriters",        label: "Copywriters & Content Writers" },
  { value: "marketing-consultants", label: "Marketing Consultants" },
  { value: "personal-trainers",  label: "Personal Trainers" },
  { value: "tutors",             label: "Tutors" },
  { value: "virtual-assistants", label: "Virtual Assistants" },
  { value: "other",              label: "Other" },
];

export const PROFESSIONAL_CATEGORIES = [
  { value: "accountants",       label: "Accountants" },
  { value: "solicitors",        label: "Solicitors" },
  { value: "financial-advisers",label: "Financial Advisers" },
  { value: "estate-agents",     label: "Estate Agents" },
  { value: "recruitment",       label: "Recruitment" },
  { value: "insurance-brokers", label: "Insurance Brokers" },
  { value: "other",             label: "Other" },
];

export const TRADESPERSON_CATEGORIES = [
  { value: "builders",             label: "Builders" },
  { value: "electricians",         label: "Electricians" },
  { value: "plumbers",             label: "Plumbers & Heating" },
  { value: "decorators-painters",  label: "Decorators & Painters" },
  { value: "locksmiths",           label: "Locksmiths" },
  { value: "cleaners",             label: "Cleaners" },
  { value: "other",                label: "Other" },
];

export const FREELANCER_KIND_CATEGORIES = {
  freelancer: FREELANCER_CATEGORIES,
  professional: PROFESSIONAL_CATEGORIES,
  tradesperson: TRADESPERSON_CATEGORIES,
};

export const HOTEL_KINDS = [
  { value: "hotel",         label: "Hotel" },
  { value: "accommodation", label: "Accommodation" },
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
  { value: "other",         label: "Other" },
];

export const VENUE_TYPES = [
  { value: "restaurants",    label: "Restaurants" },
  { value: "bars",           label: "Bars" },
  { value: "cafes",          label: "Cafes" },
  { value: "grab-go",        label: "Grab & Go" },
  { value: "bakery",         label: "Bakery" },
  { value: "takeaway",       label: "Takeaway" },
  { value: "private-dining", label: "Private Dining" },
  { value: "other",          label: "Other" },
];

export const SHOP_CATEGORIES = [
  { value: "accessories-jewellery", label: "Accessories & Jewellery",   group: "Shops" },
  { value: "clothing",              label: "Clothing",                  group: "Shops" },
  { value: "electronics-phones",    label: "Electronics & Phones",      group: "Shops" },
  { value: "groceries",             label: "Groceries",                 group: "Shops" },
  { value: "health-beauty",         label: "Health & Beauty",           group: "Shops" },
  { value: "home-furniture",        label: "Home & Furniture",          group: "Shops" },
  { value: "shoes-footwear",        label: "Shoes & Footwear",          group: "Shops" },
  { value: "sports-fitness",        label: "Sports & Fitness",          group: "Shops" },
  { value: "other-shop",            label: "Other",                     group: "Shops" },
  { value: "banks",                 label: "Banks & Foreign Exchange",  group: "Local Services" },
  { value: "childcare",             label: "Childcare",                 group: "Local Services" },
  { value: "dry-cleaning",          label: "Dry Cleaning & Shoe Repair",group: "Local Services" },
  { value: "hairdressing",          label: "Hairdressing & Beauty",     group: "Local Services" },
  { value: "healthcare",            label: "Healthcare",                group: "Local Services" },
  { value: "opticians",             label: "Opticians & Pharmacies",    group: "Local Services" },
  { value: "spa",                   label: "Spa",                       group: "Local Services" },
  { value: "travel-agents",         label: "Travel Agents",             group: "Local Services" },
  { value: "other-local-services",  label: "Other",                     group: "Local Services" },
];

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
  { value: "other",          label: "Other" },
];

export const SUBSCRIPTION_PLANS = [
  { key: "free", name: "Free", price: 0, features: ["Listing page", "1 photo", "Business contact details"] },
  { key: "standard", name: "Standard", price: 39, features: ["Everything in Free", "Unlimited photos", "News & Offers section", "Priority in search results"] },
  { key: "premium", name: "Premium", price: 79, features: ["Everything in Standard", "Featured placement", "Analytics dashboard", "Homepage spotlight eligibility"] },
];

export function labelFor(options, value) {
  return options.find((o) => o.value === value)?.label ?? value;
}
