import { mock } from "../client";
import { addLog } from "./users";

// ─── Category taxonomy (mirrors client site) ──────────────────────────────────
export const SECTION_OPTIONS = [
  { value: "eat-drink", label: "Eat & Drink" },
  { value: "see-do",    label: "See & Do" },
  { value: "shop",      label: "Shop" },
  { value: "services",  label: "Services" },
  { value: "live",      label: "Live" },
];

export const SUBCATEGORIES = {
  "eat-drink": [
    { value: "bars",           label: "Bars" },
    { value: "restaurants",    label: "Restaurants" },
    { value: "cafes",          label: "Cafés" },
    { value: "grab-go",        label: "Grab & Go" },
    { value: "private-dining", label: "Private Dining" },
  ],
  "see-do": [
    { value: "art-culture",    label: "Art & Culture" },
    { value: "community",      label: "Community" },
    { value: "family",         label: "Family" },
    { value: "fashion-beauty", label: "Fashion & Beauty" },
    { value: "film",           label: "Film" },
    { value: "gaming",         label: "Gaming" },
    { value: "learning",       label: "Learning" },
    { value: "sport-wellness", label: "Sport & Wellness" },
  ],
  "shop": [
    { value: "accessories-jewellery", label: "Accessories & Jewellery",  group: "Shops" },
    { value: "clothing",              label: "Clothing",                  group: "Shops" },
    { value: "electronics-phones",    label: "Electronics & Phones",      group: "Shops" },
    { value: "groceries",             label: "Groceries",                 group: "Shops" },
    { value: "health-beauty",         label: "Health & Beauty",           group: "Shops" },
    { value: "home-furniture",        label: "Home & Furniture",          group: "Shops" },
    { value: "shoes-footwear",        label: "Shoes & Footwear",          group: "Shops" },
    { value: "sports-fitness",        label: "Sports & Fitness",          group: "Shops" },
    { value: "banks",                 label: "Banks & Foreign Exchange",  group: "Services" },
    { value: "childcare",             label: "Childcare",                 group: "Services" },
    { value: "dry-cleaning",          label: "Dry Cleaning & Shoe Repair",group: "Services" },
    { value: "hairdressing",          label: "Hairdressing & Beauty",     group: "Services" },
    { value: "healthcare",            label: "Healthcare",                group: "Services" },
    { value: "opticians",             label: "Opticians & Pharmacies",    group: "Services" },
    { value: "spa",                   label: "Spa",                       group: "Services" },
    { value: "travel-agents",         label: "Travel Agents",             group: "Services" },
  ],
  "live": [
    { value: "for-sale",         label: "For Sale" },
    { value: "for-rent",         label: "For Rent" },
    { value: "build-to-rent",    label: "Build to Rent" },
    { value: "new-development",  label: "New Development" },
  ],
  "services": [
    { value: "builders",             label: "Builders",                    group: "Tradespeople" },
    { value: "electricians",         label: "Electricians",                group: "Tradespeople" },
    { value: "plumbers",             label: "Plumbers & Heating",          group: "Tradespeople" },
    { value: "decorators-painters",  label: "Decorators & Painters",       group: "Tradespeople" },
    { value: "locksmiths",           label: "Locksmiths",                  group: "Tradespeople" },
    { value: "cleaners",             label: "Cleaners",                    group: "Tradespeople" },
    { value: "accountants",          label: "Accountants",                 group: "Professionals" },
    { value: "solicitors",           label: "Solicitors",                  group: "Professionals" },
    { value: "financial-advisers",   label: "Financial Advisers",          group: "Professionals" },
    { value: "estate-agents",        label: "Estate Agents",               group: "Professionals" },
    { value: "recruitment",          label: "Recruitment",                 group: "Professionals" },
    { value: "insurance-brokers",    label: "Insurance Brokers",           group: "Professionals" },
    { value: "graphic-designers",    label: "Graphic Designers",           group: "Freelancers" },
    { value: "web-developers",       label: "Web Developers",              group: "Freelancers" },
    { value: "photographers",        label: "Photographers",               group: "Freelancers" },
    { value: "copywriters",          label: "Copywriters & Content Writers", group: "Freelancers" },
    { value: "marketing-consultants",label: "Marketing Consultants",       group: "Freelancers" },
    { value: "personal-trainers",    label: "Personal Trainers",           group: "Freelancers" },
    { value: "tutors",               label: "Tutors",                      group: "Freelancers" },
    { value: "virtual-assistants",   label: "Virtual Assistants",          group: "Freelancers" },
  ],
};

// Services groups, in display order — mirrors the public /services page's
// three columns (Tradesperson, Professionals, Freelancers).
export const SERVICES_GROUPS = ["Tradespeople", "Professionals", "Freelancers"];

export const CUISINE_OPTIONS = [
  { value: "british",  label: "British" },
  { value: "italian",  label: "Italian" },
  { value: "chinese",  label: "Chinese" },
  { value: "indian",   label: "Indian" },
  { value: "french",   label: "French" },
  { value: "thai",     label: "Thai" },
  { value: "japanese", label: "Japanese" },
  { value: "bakery",   label: "Bakery" },
  { value: "american", label: "American" },
  { value: "mexican",  label: "Mexican" },
  { value: "spanish",  label: "Spanish" },
  { value: "greek",    label: "Greek" },
  { value: "turkish",  label: "Turkish" },
  { value: "lebanese", label: "Lebanese" },
];

export const BUSINESS_PLANS = ["Basic", "Standard", "Premium", "Agent"];

// Legacy export kept for compatibility
export const BUSINESS_CATEGORIES = [
  "Eat & Drink", "See & Do", "Shop", "Live",
];

// ─── Mutable store ────────────────────────────────────────────────────────────
let BUSINESSES = [
  {
    id: "b1",
    name: "The Velvet Lounge",
    section: "eat-drink",
    subcategories: ["bars", "restaurants"],
    cuisines: ["british"],
    newToMaidenhead: true,
    address: "14 High Street, Maidenhead SL6 1JF",
    phone: "01628 555 102",
    website: "",
    lat: 51.5225,
    lng: -0.7234,
    logo: null,
    plan: "Premium",
    submitted: "2026-06-20",
    status: "Pending",
    contactName: "Olivia Grant",
    email: "olivia@velvetlounge.co.uk",
  },
  {
    id: "b2",
    name: "Riverside Yoga Studio",
    section: "see-do",
    subcategories: ["sport-wellness"],
    cuisines: [],
    newToMaidenhead: false,
    address: "3 Bridge Road, Maidenhead SL6 8DX",
    phone: "01628 555 233",
    website: "",
    lat: 51.5218,
    lng: -0.7198,
    logo: null,
    plan: "Standard",
    submitted: "2026-06-19",
    status: "Pending",
    contactName: "Daniel Reeves",
    email: "hello@riversideyoga.co.uk",
  },
  {
    id: "b3",
    name: "Maidenhead Book Nook",
    section: "shop",
    subcategories: ["accessories-jewellery", "clothing"],
    cuisines: [],
    newToMaidenhead: false,
    address: "27 King Street, Maidenhead SL6 1EF",
    phone: "01628 555 419",
    website: "",
    lat: 51.5231,
    lng: -0.7201,
    logo: null,
    plan: "Basic",
    submitted: "2026-06-17",
    status: "Approved",
    contactName: "Priya Anand",
    email: "priya@booknook.co.uk",
  },
  {
    id: "b5",
    name: "Quickfix Phone Repairs",
    section: "shop",
    subcategories: ["electronics-phones"],
    cuisines: [],
    newToMaidenhead: false,
    address: "9 Queen Street, Maidenhead SL6 1HZ",
    phone: "01628 555 661",
    website: "",
    lat: null,
    lng: null,
    logo: null,
    plan: "Basic",
    submitted: "2026-06-12",
    status: "Rejected",
    contactName: "Sam Drake",
    email: "sam@quickfixrepairs.co.uk",
  },
  {
    id: "b6",
    name: "Elgan Davies Plumbing & Heating",
    section: "services",
    subcategories: ["plumbers"],
    cuisines: [],
    newToMaidenhead: false,
    address: "Fifield, Maidenhead SL6 2NF",
    phone: "01628 555 887",
    website: "",
    lat: 51.5147,
    lng: -0.7431,
    logo: null,
    plan: "Standard",
    submitted: "2026-06-22",
    status: "Approved",
    contactName: "Elgan Davies",
    email: "info@elgandavies.co.uk",
  },
  {
    id: "b7",
    name: "Thameside Accountancy",
    section: "services",
    subcategories: ["accountants"],
    cuisines: [],
    newToMaidenhead: false,
    address: "18 Broadway, Maidenhead SL6 1NN",
    phone: "01628 555 940",
    website: "",
    lat: 51.5222,
    lng: -0.7211,
    logo: null,
    plan: "Basic",
    submitted: "2026-06-21",
    status: "Approved",
    contactName: "Nadia Farooq",
    email: "hello@thamesideaccountancy.co.uk",
  },
];

// ─── Queries ──────────────────────────────────────────────────────────────────
export function getBusinesses({ status } = {}) {
  let list = [...BUSINESSES];
  if (status) list = list.filter((b) => b.status === status);
  return mock(list);
}

export function getBusinessById(id) {
  return mock(BUSINESSES.find((b) => b.id === id) ?? null);
}

// ─── Mutations ────────────────────────────────────────────────────────────────
export function registerBusiness(data) {
  const saved = {
    ...data,
    id: data.id || `b${Date.now()}`,
    submitted: data.submitted || new Date().toISOString().slice(0, 10),
    status: data.status || "Pending",
  };
  if (data.id) {
    BUSINESSES = BUSINESSES.map((b) => (b.id === data.id ? saved : b));
  } else {
    BUSINESSES = [saved, ...BUSINESSES];
  }
  return mock(saved);
}

export function approveBusiness(id) {
  const b = BUSINESSES.find((x) => x.id === id);
  if (!b) return mock({ ok: false });
  BUSINESSES = BUSINESSES.map((x) => (x.id === id ? { ...x, status: "Approved" } : x));
  addLog("Business Approved", { id, name: b.name }, "");
  return mock({ ok: true });
}

export function rejectBusiness(id, note = "") {
  const b = BUSINESSES.find((x) => x.id === id);
  if (!b) return mock({ ok: false });
  BUSINESSES = BUSINESSES.map((x) => (x.id === id ? { ...x, status: "Rejected", rejectionNote: note } : x));
  addLog("Business Rejected", { id, name: b.name }, note);
  return mock({ ok: true });
}

export function suspendBusiness(id, note = "") {
  const b = BUSINESSES.find((x) => x.id === id);
  if (!b) return mock({ ok: false });
  BUSINESSES = BUSINESSES.map((x) => (x.id === id ? { ...x, status: "Suspended", suspendNote: note } : x));
  addLog("Business Suspended", { id, name: b.name }, note);
  return mock({ ok: true });
}

export function reinstateBusiness(id) {
  const b = BUSINESSES.find((x) => x.id === id);
  if (!b) return mock({ ok: false });
  BUSINESSES = BUSINESSES.map((x) => (x.id === id ? { ...x, status: "Approved", suspendNote: "" } : x));
  addLog("Business Reinstated", { id, name: b.name }, "");
  return mock({ ok: true });
}

export function deleteBusiness(id) {
  const b = BUSINESSES.find((x) => x.id === id);
  if (!b) return mock({ ok: false });
  addLog("Business Deleted", { id, name: b.name }, "Business listing permanently removed by admin");
  BUSINESSES = BUSINESSES.filter((x) => x.id !== id);
  return mock({ ok: true });
}
