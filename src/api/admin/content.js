import { mock } from "../client";

// ─── Default opening hours template ──────────────────────────────────────────
const DEFAULT_HOURS = [
  { day: "Monday",    open: true,  from: "09:00", to: "17:00" },
  { day: "Tuesday",   open: true,  from: "09:00", to: "17:00" },
  { day: "Wednesday", open: true,  from: "09:00", to: "17:00" },
  { day: "Thursday",  open: true,  from: "09:00", to: "17:00" },
  { day: "Friday",    open: true,  from: "09:00", to: "17:00" },
  { day: "Saturday",  open: true,  from: "10:00", to: "16:00" },
  { day: "Sunday",    open: false, from: "10:00", to: "16:00" },
];

// ─── Business content store (keyed by bizId) ─────────────────────────────────
let CONTENT = {
  b1: { // The Velvet Lounge — Eat & Drink
    shortDescription: "A relaxed cocktail bar and restaurant in the heart of Maidenhead.",
    about: "The Velvet Lounge is Maidenhead's premier destination for craft cocktails, fine wines and contemporary British cuisine. Our welcoming atmosphere makes it perfect for date nights, business lunches and celebratory dinners alike.",
    hours: [
      { day: "Monday",    open: false, from: "12:00", to: "23:00" },
      { day: "Tuesday",   open: true,  from: "12:00", to: "23:00" },
      { day: "Wednesday", open: true,  from: "12:00", to: "23:00" },
      { day: "Thursday",  open: true,  from: "12:00", to: "23:30" },
      { day: "Friday",    open: true,  from: "12:00", to: "00:00" },
      { day: "Saturday",  open: true,  from: "11:00", to: "00:00" },
      { day: "Sunday",    open: true,  from: "11:00", to: "22:00" },
    ],
    headerImages: [],
    socialLinks: { instagram: "@thevelvetlounge", facebook: "thevelvetlounge", twitter: "", tripadvisor: "" },
    offers: [
      { id: "o1", type: "Offer", title: "Happy Hour", body: "50% off all cocktails every Tuesday and Wednesday 5pm–7pm.", image: null, expiry: "2026-12-31" },
      { id: "o2", type: "News",  title: "New Summer Menu",  body: "Our summer menu is now live, featuring fresh seasonal ingredients from local producers.", image: null, expiry: "" },
    ],
  },
  b2: { // Riverside Yoga Studio — See & Do
    shortDescription: "A peaceful yoga and wellness studio on the banks of the Thames.",
    about: "Riverside Yoga offers a full timetable of yoga, pilates, and mindfulness sessions for all levels. Our light-filled studio overlooks the River Thames, creating a tranquil environment to strengthen your body and calm your mind.",
    hours: DEFAULT_HOURS.map(h => ({ ...h })),
    headerImages: [],
    socialLinks: { instagram: "@riversideyogamaidenhead", facebook: "", twitter: "", tripadvisor: "" },
    offers: [],
  },
  b3: { // Maidenhead Book Nook — Shop
    shortDescription: "Independent boutique stocking accessories, gifts and clothing.",
    about: "Maidenhead Book Nook is a beloved local boutique offering a curated selection of accessories, jewellery and clothing sourced from independent designers. Come discover something unique on King Street.",
    hours: [
      { day: "Monday",    open: true, from: "09:30", to: "17:30" },
      { day: "Tuesday",   open: true, from: "09:30", to: "17:30" },
      { day: "Wednesday", open: true, from: "09:30", to: "17:30" },
      { day: "Thursday",  open: true, from: "09:30", to: "17:30" },
      { day: "Friday",    open: true, from: "09:30", to: "18:00" },
      { day: "Saturday",  open: true, from: "09:00", to: "18:00" },
      { day: "Sunday",    open: false, from: "11:00", to: "16:00" },
    ],
    headerImages: [],
    socialLinks: { instagram: "", facebook: "maidenheadbooknook", twitter: "", tripadvisor: "" },
    offers: [],
  },
};

// ─── Standalone pages (See & Do only) ────────────────────────────────────────
let STANDALONE_PAGES = [
  {
    id: "sp1",
    title: "Duck Derby Fun Day",
    slug: "duck-derby-fun-day",
    description: "Join us for the annual Duck Derby on the Thames — a fun-filled afternoon for all the family with rubber duck racing, live music and street food.",
    date: "2026-07-19",
    time: "12:00",
    endDate: "2026-07-19",
    endTime: "17:00",
    venue: "Ray Mill Island, Maidenhead SL6 8NB",
    ticketInfo: "Free entry. Adopt a duck for £2.",
    images: [],
    listOnCalendar: true,
    linkedBizId: null,
    tags: ["family", "community"],
  },
  {
    id: "sp2",
    title: "Open Air Cinema: Summer Classics",
    slug: "open-air-cinema-summer-classics",
    description: "Bring a blanket and enjoy classic films under the stars at Kidwells Park. Refreshments available on site.",
    date: "2026-08-02",
    time: "20:30",
    endDate: "2026-08-02",
    endTime: "23:00",
    venue: "Kidwells Park, Maidenhead SL6 5JA",
    ticketInfo: "£8 per person, book in advance.",
    images: [],
    listOnCalendar: true,
    linkedBizId: null,
    tags: ["film", "community"],
  },
];

let _pageCounter = STANDALONE_PAGES.length + 1;

// ─── Queries ──────────────────────────────────────────────────────────────────
export function getBusinessContent(bizId) {
  return mock(CONTENT[bizId] ?? {
    shortDescription: "",
    about: "",
    hours: DEFAULT_HOURS.map(h => ({ ...h })),
    headerImages: [],
    socialLinks: { instagram: "", facebook: "", twitter: "", tripadvisor: "" },
    offers: [],
  });
}

export function getStandalonePages() {
  return mock([...STANDALONE_PAGES]);
}

// ─── Mutations ────────────────────────────────────────────────────────────────
export function saveBusinessContent(bizId, data) {
  CONTENT[bizId] = { ...data };
  return mock({ ok: true });
}

export function saveStandalonePage(data) {
  if (data.id) {
    STANDALONE_PAGES = STANDALONE_PAGES.map(p => p.id === data.id ? { ...data } : p);
  } else {
    const saved = { ...data, id: `sp${_pageCounter++}` };
    STANDALONE_PAGES = [saved, ...STANDALONE_PAGES];
    return mock(saved);
  }
  return mock(data);
}

export function deleteStandalonePage(id) {
  STANDALONE_PAGES = STANDALONE_PAGES.filter(p => p.id !== id);
  return mock({ ok: true });
}

export function addOffer(bizId, offer) {
  const content = CONTENT[bizId] || {};
  const newOffer = { ...offer, id: `o${Date.now()}` };
  CONTENT[bizId] = { ...content, offers: [newOffer, ...(content.offers ?? [])] };
  return mock(newOffer);
}

export function deleteOffer(bizId, offerId) {
  const content = CONTENT[bizId] || {};
  CONTENT[bizId] = { ...content, offers: (content.offers ?? []).filter(o => o.id !== offerId) };
  return mock({ ok: true });
}
