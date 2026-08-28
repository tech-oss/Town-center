import { mock } from "../client";

// ─── Mock per-account page content ─────────────────────────────────────────
// Keyed by business account id. Same shape as the admin "Manage Business
// Content" editors so content created here is a drop-in match for that
// store once both are backed by the same database.
const DEFAULT_HOURS = [
  { day: "Monday",    open: true,  from: "09:00", to: "17:00" },
  { day: "Tuesday",   open: true,  from: "09:00", to: "17:00" },
  { day: "Wednesday", open: true,  from: "09:00", to: "17:00" },
  { day: "Thursday",  open: true,  from: "09:00", to: "17:00" },
  { day: "Friday",    open: true,  from: "09:00", to: "17:00" },
  { day: "Saturday",  open: true,  from: "10:00", to: "16:00" },
  { day: "Sunday",    open: false, from: "10:00", to: "16:00" },
];

function emptyStandardContent() {
  return {
    shortDescription: "",
    about: "",
    hours: DEFAULT_HOURS.map((h) => ({ ...h })),
    headerImages: [],
    address: "",
    phone: "",
    website: "",
    socialLinks: { instagram: "", facebook: "", twitter: "", tripadvisor: "" },
    offers: [],
  };
}

function emptyStayContent() {
  return {
    tagline: "",
    description: "",
    address: "",
    lat: "",
    lng: "",
    phone: "",
    website: "",
    email: "",
    socialLinks: { instagram: "", facebook: "", twitter: "", tripadvisor: "" },
    heroImage: null,
    galleryImages: [],
    amenities: [],
    facilities: [],
    roomFacilities: [],
  };
}

let STANDARD_CONTENT = {}; // { [accountId]: content }
let STAY_CONTENT = {};     // { [accountId]: content }

// ─── Standard content (See & Do / Eat & Drink / Shop / Services) ─────────────
export function getStandardContent(accountId) {
  return mock(STANDARD_CONTENT[accountId] ?? emptyStandardContent());
}
export function saveStandardContent(accountId, data) {
  STANDARD_CONTENT[accountId] = { ...data };
  return mock({ ok: true });
}
export function addOffer(accountId, offer) {
  const content = STANDARD_CONTENT[accountId] || emptyStandardContent();
  const newOffer = { ...offer, id: `o${Date.now()}` };
  STANDARD_CONTENT[accountId] = { ...content, offers: [newOffer, ...(content.offers ?? [])] };
  return mock(newOffer);
}
export function deleteOffer(accountId, offerId) {
  const content = STANDARD_CONTENT[accountId] || emptyStandardContent();
  STANDARD_CONTENT[accountId] = { ...content, offers: (content.offers ?? []).filter((o) => o.id !== offerId) };
  return mock({ ok: true });
}

// ─── Stay content (Live & Stay: Hotel / Accommodation) ────────────────────────
export function getStayContent(accountId) {
  return mock(STAY_CONTENT[accountId] ?? emptyStayContent());
}
export function saveStayContent(accountId, data) {
  STAY_CONTENT[accountId] = { ...data };
  return mock({ ok: true });
}
