// ─── Mock data for the universal Business Content Editor ─────────────────────
// Frontend-only placeholder data. Nothing here is persisted — the editor's
// Save button mocks a successful write and shows a toast. Real image URLs
// below are placeholder sources (picsum.photos); real uploads will replace
// them once the backend is connected.
//
// `section` is one of: "see-do" | "eat-drink" | "shop" | "services" | "live-stay" | "explore"
// Sections see-do / eat-drink / shop share the "Type A" editor field set.
// services -> "Type B", live-stay -> "Type C", explore -> "Type D".

const img = (seed, w = 800, h = 500) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const SECTION_LABELS = {
  "see-do":    "See & Do",
  "eat-drink": "Eat & Drink",
  "shop":      "Shop",
  "services":  "Services",
  "live-stay": "Live & Stay",
  "explore":   "Explore",
};

const DEFAULT_HOURS = () => [
  { day: "Monday",    open: true,  from: "09:00", to: "17:00" },
  { day: "Tuesday",   open: true,  from: "09:00", to: "17:00" },
  { day: "Wednesday", open: true,  from: "09:00", to: "17:00" },
  { day: "Thursday",  open: true,  from: "09:00", to: "17:00" },
  { day: "Friday",    open: true,  from: "09:00", to: "17:00" },
  { day: "Saturday",  open: true,  from: "10:00", to: "16:00" },
  { day: "Sunday",    open: false, from: "10:00", to: "16:00" },
];

function gallery(seed, count) {
  return Array.from({ length: count }, (_, i) => img(`${seed}-g${i}`, 600, 400));
}

// ─── News & Offers (shared by Type A, B, C) ──────────────────────────────────
function offers(seed) {
  return [
    {
      id: `${seed}-o1`, title: "Summer Happy Hour", type: "Offer", status: "Published",
      thumbnail: img(`${seed}-o1`, 300, 200), publishedDate: "2026-06-01",
      startDate: "2026-06-01", endDate: "2026-08-31",
      body: "50% off all drinks every weekday between 5pm and 7pm.",
    },
    {
      id: `${seed}-o2`, title: "New Menu Launch", type: "News", status: "Draft",
      thumbnail: img(`${seed}-o2`, 300, 200), publishedDate: "",
      startDate: "2026-07-15", endDate: "",
      body: "Our brand new seasonal menu launches this July — come try it first.",
    },
  ];
}

// ─── Type A: See & Do / Eat & Drink / Shop ────────────────────────────────────
function typeABusiness({ id, name, section, status, seed }) {
  return {
    id, name, section, status,
    hero: { title: name, subtitle: "A local favourite in the heart of Maidenhead", image: img(seed, 1200, 700) },
    hours: DEFAULT_HOURS(),
    address: "14 High Street, Maidenhead SL6 1JF",
    phone: "01628 555 102",
    email: `hello@${seed}.co.uk`,
    website: `https://${seed}.co.uk`,
    bookingUrl: `https://${seed}.co.uk/book`,
    social: { instagram: `https://instagram.com/${seed}`, facebook: `https://facebook.com/${seed}`, twitter: "" },
    gallery: gallery(seed, 4),
    lat: 51.5225,
    lng: -0.7234,
    offers: offers(seed),
  };
}

// ─── Type B: Services ─────────────────────────────────────────────────────────
function typeBBusiness({ id, name, category, status, seed }) {
  return {
    id, name, section: "services", status,
    logo: img(`${seed}-logo`, 200, 200),
    category,
    description: `${name} is a trusted, fully insured local ${category.toLowerCase()} serving Maidenhead and the surrounding area.`,
    bookingTag: "24 hour booking",
    phone: "01628 555 887",
    address: "Fifield, Maidenhead SL6 2NF",
    email: `info@${seed}.co.uk`,
    website: `https://${seed}.co.uk`,
    social: { instagram: `https://instagram.com/${seed}`, facebook: `https://facebook.com/${seed}`, twitter: "" },
    lat: 51.5147,
    lng: -0.7431,
    hours: DEFAULT_HOURS(),
    photos: gallery(seed, 4),
    stats: [
      { value: "10+", label: "Years in Business" },
      { value: "500+", label: "Jobs Completed" },
      { value: "4.9", label: "Average Rating" },
      { value: "100%", label: "Fully Insured" },
    ],
    services: ["General Enquiries", "Emergency Call-Outs", "Free Quotes", "Insurance Work"],
    whyChooseUs: ["Fully insured & accredited", "Local, family-run business", "Transparent pricing", "5-star customer reviews"],
    areasCovered: ["Maidenhead", "Windsor", "Marlow", "Cookham"],
    offers: offers(seed),
  };
}

// ─── Type C: Live & Stay ───────────────────────────────────────────────────────
function typeCBusiness({ id, name, category, subCategory, status, seed }) {
  return {
    id, name, section: "live-stay", status,
    category, subCategory,
    description: `${name} offers comfortable, well-appointed accommodation moments from Maidenhead town centre.`,
    heroImage: img(seed, 1200, 700),
    address: "Shoppenhangers Road, Maidenhead SL6 2PZ",
    phone: "01628 581 000",
    email: `stay@${seed}.co.uk`,
    website: `https://${seed}.co.uk`,
    social: { instagram: `https://instagram.com/${seed}`, facebook: `https://facebook.com/${seed}`, twitter: "" },
    lat: 51.513295,
    lng: -0.726958,
    availabilityInfo: "Check-in from 3pm. 24-hour reception.",
    gallery: gallery(seed, 4),
    features: ["Free Wi-Fi throughout", "On-site parking", "24-hour reception", "Pet friendly"],
    offers: offers(seed),
  };
}

// ─── Type D: Explore ───────────────────────────────────────────────────────────
function typeDBusiness({ id, name, status, seed }) {
  return {
    id, name, section: "explore", status,
    title: name,
    subtitle: "Shaping the future of Maidenhead town centre",
    heroImage: img(seed, 1200, 700),
    body: `${name} is one of the major regeneration projects transforming Maidenhead over the next decade — bringing new homes, public space and jobs to the town centre.`,
    address: "Maidenhead Town Centre, SL6",
    lat: 51.5222,
    lng: -0.7211,
    gallery: gallery(seed, 4),
    pageStatus: status,
  };
}

export const BUSINESS_CONTENT = [
  // See & Do
  typeABusiness({ id: "sd1", name: "Riverside Yoga Studio", section: "see-do", status: "Published", seed: "riverside-yoga" }),
  typeABusiness({ id: "sd2", name: "Maidenhead Escape Rooms", section: "see-do", status: "Draft", seed: "escape-rooms" }),

  // Eat & Drink
  typeABusiness({ id: "ed1", name: "The Velvet Lounge", section: "eat-drink", status: "Published", seed: "velvet-lounge" }),
  typeABusiness({ id: "ed2", name: "Bakedd", section: "eat-drink", status: "Published", seed: "bakedd" }),

  // Shop
  typeABusiness({ id: "sh1", name: "Maidenhead Book Nook", section: "shop", status: "Published", seed: "book-nook" }),
  typeABusiness({ id: "sh2", name: "Quickfix Phone Repairs", section: "shop", status: "Draft", seed: "quickfix" }),

  // Services
  typeBBusiness({ id: "sv1", name: "Elgan Davies Plumbing & Heating", category: "Plumbers & Heating", status: "Published", seed: "elgan-davies" }),
  typeBBusiness({ id: "sv2", name: "Thameside Accountancy", category: "Accountants", status: "Published", seed: "thameside-accountancy" }),

  // Live & Stay
  typeCBusiness({ id: "ls1", name: "Fredrick's Hotel, Restaurant & Spa", category: "Hotel", subCategory: "Hotels", status: "Published", seed: "fredricks-hotel" }),
  typeCBusiness({ id: "ls2", name: "Riverside Loft Apartment", category: "Serviced", subCategory: "Self Catering & Serviced Accommodation", status: "Published", seed: "riverside-loft" }),

  // Explore
  typeDBusiness({ id: "ex1", name: "Nicholsons Quarter Regeneration", status: "Published", seed: "nicholsons-quarter" }),
  typeDBusiness({ id: "ex2", name: "Chapel Arches", status: "Draft", seed: "chapel-arches" }),
];
