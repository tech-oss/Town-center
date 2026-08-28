import { mock } from "../client";

// ─── Living in Maidenhead — static site pages ─────────────────────────────────
// These mirror /live ("Why Live Here") and /explore/the-future ("The Future").
let SITE_PAGES = {
  "why-live-here": {
    key: "why-live-here",
    label: "Why Live Here",
    publicPath: "/live",
    heading: "Why Live in Maidenhead",
    intro: "A riverside town with fast links to London, excellent schools and a growing town centre — discover what makes Maidenhead home.",
    heroImage: null,
  },
  "the-future": {
    key: "the-future",
    label: "The Future",
    publicPath: "/explore/the-future",
    heading: "The Future of Maidenhead",
    intro: "Explore the regeneration projects shaping the town centre over the next decade.",
    heroImage: null,
  },
};

// ─── Stay — Hotels & Accommodation listing intros ─────────────────────────────
let STAY_CATEGORIES = {
  hotels: {
    key: "hotels",
    label: "Hotels",
    publicPath: "/live/stay/hotels",
    heading: "Hotels in Maidenhead",
    intro: "From riverside spa hotels to convenient town-centre stays, find the right hotel for your visit.",
    heroImage: null,
  },
  accommodation: {
    key: "accommodation",
    label: "Accommodation",
    publicPath: "/live/stay/accommodation",
    heading: "Accommodation in Maidenhead",
    intro: "Serviced apartments, boutique cottages and short-let stays across the town.",
    heroImage: null,
  },
};

// ─── Developments (Live building pages) ───────────────────────────────────────
const DEFAULT_DEVELOPMENT = {
  name: "",
  slug: "",
  developer: "",
  tagline: "",
  heroImage: null,
  galleryImages: [],
  quickStats: [],       // [{ label, value }]
  aboutParagraphs: [""],
  amenities: [],         // [{ label }]
  nearbyPlaces: [],      // [{ name, distance, mode }]
  lat: "",
  lng: "",
  website: "",
  email: "",
};

let DEVELOPMENTS = [
  {
    id: "dev1", name: "Waterside Quarter", slug: "waterside-quarter", developer: "Cala Homes",
    tagline: "Riverside apartments moments from the Elizabeth Line.",
    heroImage: null, galleryImages: [],
    quickStats: [{ label: "Homes", value: "212" }, { label: "Completion", value: "2026" }],
    aboutParagraphs: ["Waterside Quarter brings a new collection of riverside apartments to the heart of Maidenhead."],
    amenities: [{ label: "Riverside terrace" }, { label: "Residents' gym" }],
    nearbyPlaces: [{ name: "Maidenhead Station (Elizabeth Line)", distance: "5 min walk", mode: "walk" }],
    lat: "51.5225", lng: "-0.7234", website: "", email: "",
  },
  {
    id: "dev2", name: "Brunel Place", slug: "brunel-place", developer: "Cala Homes",
    tagline: "Studio, one and two-bedroom homes for first-time buyers and downsizers.",
    heroImage: null, galleryImages: [],
    quickStats: [{ label: "Homes", value: "180" }],
    aboutParagraphs: ["Finished to Cala's renowned high specification."],
    amenities: [], nearbyPlaces: [], lat: "", lng: "", website: "", email: "",
  },
  {
    id: "dev3", name: "Cooper Square", slug: "cooper-square", developer: "",
    tagline: "", heroImage: null, galleryImages: [], quickStats: [],
    aboutParagraphs: [""], amenities: [], nearbyPlaces: [], lat: "", lng: "", website: "", email: "",
  },
  {
    id: "dev4", name: "The Waypoint", slug: "the-waypoint", developer: "",
    tagline: "Maidenhead's flagship build-to-rent community.", heroImage: null, galleryImages: [],
    quickStats: [], aboutParagraphs: [""], amenities: [], nearbyPlaces: [], lat: "", lng: "", website: "", email: "",
  },
  {
    id: "dev5", name: "Willows Edge", slug: "willows-edge", developer: "",
    tagline: "", heroImage: null, galleryImages: [], quickStats: [],
    aboutParagraphs: [""], amenities: [], nearbyPlaces: [], lat: "", lng: "", website: "", email: "",
  },
  {
    id: "dev6", name: "Spring Hill", slug: "spring-hill", developer: "",
    tagline: "", heroImage: null, galleryImages: [], quickStats: [],
    aboutParagraphs: [""], amenities: [], nearbyPlaces: [], lat: "", lng: "", website: "", email: "",
  },
  {
    id: "dev7", name: "Harvest Hill", slug: "harvest-hill", developer: "",
    tagline: "", heroImage: null, galleryImages: [], quickStats: [],
    aboutParagraphs: [""], amenities: [], nearbyPlaces: [], lat: "", lng: "", website: "", email: "",
  },
];
let _devCounter = DEVELOPMENTS.length + 1;

// ─── Queries ──────────────────────────────────────────────────────────────────
export function getSitePages() {
  return mock(Object.values(SITE_PAGES));
}
export function getSitePage(key) {
  return mock(SITE_PAGES[key] ?? null);
}
export function getStayCategories() {
  return mock(Object.values(STAY_CATEGORIES));
}
export function getStayCategory(key) {
  return mock(STAY_CATEGORIES[key] ?? null);
}
export function getDevelopments() {
  return mock([...DEVELOPMENTS]);
}
export function getDevelopmentById(id) {
  return mock(DEVELOPMENTS.find((d) => d.id === id) ?? null);
}
export function emptyDevelopment() {
  return { ...DEFAULT_DEVELOPMENT };
}

// ─── Mutations ────────────────────────────────────────────────────────────────
export function saveSitePage(key, data) {
  SITE_PAGES[key] = { ...SITE_PAGES[key], ...data };
  return mock({ ok: true });
}
export function saveStayCategory(key, data) {
  STAY_CATEGORIES[key] = { ...STAY_CATEGORIES[key], ...data };
  return mock({ ok: true });
}
export function saveDevelopment(data) {
  if (data.id) {
    DEVELOPMENTS = DEVELOPMENTS.map((d) => (d.id === data.id ? { ...data } : d));
    return mock(data);
  }
  const saved = { ...data, id: `dev${_devCounter++}` };
  DEVELOPMENTS = [...DEVELOPMENTS, saved];
  return mock(saved);
}
export function deleteDevelopment(id) {
  DEVELOPMENTS = DEVELOPMENTS.filter((d) => d.id !== id);
  return mock({ ok: true });
}
