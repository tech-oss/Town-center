// ════════════════════════════════════════════════════════════════════════════
//  "Live" section — residential living in Maidenhead.
//  Mirrors Canary Wharf's Live section: Why Live Here, property search
//  (For Sale / For Rent) with filters, building pages, property detail pages
//  with a Book a Viewing form, and an Enquire page.
//
//  Listings use REAL Maidenhead developments & realistic prices. Imagery is
//  placeholder (picsum) — swap for real photography later.
//
//  Routes:
//   /live                       → Why Live Here
//   /live/overview              → Properties Overview (Find an Apartment)
//   /live/for-sale              → Properties For Sale (search + grid)
//   /live/for-rent              → Properties For Rent (search + grid)
//   /live/enquire               → Enquire form
//   /live/building/:slug        → Building detail + its properties
//   /live/property/:slug        → Apartment detail + Book a Viewing
// ════════════════════════════════════════════════════════════════════════════

const img = (seed) => `https://picsum.photos/seed/${seed}/1200/800`;

// ─── Real (free-licensed) property photography ──────────────────────────────
const PIC = {
  extWaterside: "/images/live/ext-waterside.jpg",
  extBrunel: "/images/live/ext-brunel.jpg",
  extCooper: "/images/live/ext-cooper.jpg",
  extHero: "/images/live/ext-hero.jpg",
  living: ["/images/live/living-1.jpg", "/images/live/living-2.jpg", "/images/live/living-3.jpg", "/images/live/living-4.jpg"],
  kitchen: ["/images/live/kitchen-1.jpg", "/images/live/kitchen-2.jpg", "/images/live/kitchen-3.jpg"],
  bedroom: ["/images/live/bedroom-1.jpg", "/images/live/bedroom-2.jpg", "/images/live/bedroom-3.jpg"],
  balcony: ["/images/live/balcony-1.jpg", "/images/live/balcony-2.jpg", "/images/live/balcony-3.jpg"],
};
const pick = (arr, i) => arr[i % arr.length];

// ─── Buildings / developments (real Maidenhead schemes) ──────────────────────
export const buildings = [
  {
    slug: "waterside-quarter",
    name: "Waterside Quarter",
    developer: "Shanly Homes",
    tagline: "Waterside living in the heart of the town centre",
    location: "Chapel Arches, Maidenhead",
    image: PIC.extWaterside,
    hero: PIC.extWaterside,
    description:
      "Waterside Quarter is a landmark collection of high-specification properties set right on Maidenhead's regenerated waterways. With independent restaurants, cafés and shops on the doorstep — and Maidenhead station on the Elizabeth Line just a short walk away — it brings together modern riverside living and effortless connectivity.",
    amenities: ["Waterside setting", "Concierge", "Landscaped courtyards", "Secure parking", "Elizabeth Line · 5 min walk", "Restaurants on your doorstep"],
  },
  {
    slug: "brunel-place",
    name: "Brunel Place",
    developer: "Cala Homes",
    tagline: "A boutique collection with a podium garden",
    location: "West Street, Maidenhead",
    image: PIC.extBrunel,
    hero: PIC.extBrunel,
    description:
      "Brunel Place is an intimate collection of just 26 brand-new studio, one and two-bedroom properties arranged around a beautiful residents' podium garden. Maidenhead station is around half a mile away, with direct Elizabeth Line trains to London Paddington in as little as 18 minutes.",
    amenities: ["Residents' podium garden", "Studio – 2 beds", "Bike storage", "Video entry", "0.5 mi to station", "18 min to Paddington"],
  },
  {
    slug: "cooper-square",
    name: "Cooper Square",
    developer: "Countryside",
    tagline: "Contemporary 1, 2 & 3-bedroom properties",
    location: "Town Centre, Maidenhead",
    image: PIC.extCooper,
    hero: PIC.extCooper,
    description:
      "Cooper Square is a contemporary development of one, two and three-bedroom properties close to excellent local amenities and handy transport routes. Thoughtfully designed interiors and generous open-plan layouts make it a natural choice for first-time buyers, downsizers and families alike.",
    amenities: ["1 – 3 beds", "Open-plan living", "Private balconies", "Allocated parking", "Town-centre location", "10-year warranty"],
  },
];

export const buildingBySlug = Object.fromEntries(buildings.map((b) => [b.slug, b]));

// ─── Apartment listings (For Sale / For Rent) ────────────────────────────────
let propIndex = 0;
function prop(slug, buildingSlug, status, beds, bedLabel, price, baths, sqft, floor) {
  const b = buildingBySlug[buildingSlug];
  const k = propIndex++;
  // Build a realistic gallery: living → kitchen → bedroom → balcony view
  const gallery = [pick(PIC.living, k), pick(PIC.kitchen, k), pick(PIC.bedroom, k), pick(PIC.balcony, k)];
  return {
    slug,
    buildingSlug,
    building: b.name,
    location: b.location,
    status, // "sale" | "rent"
    beds, // numeric for filtering (0 = studio, 99 = penthouse rank)
    bedLabel, // display, e.g. "2 Bedroom" / "Penthouse" / "Studio"
    price, // numeric (sale = total, rent = pcm)
    baths,
    sqft,
    floor,
    image: gallery[0],
    gallery,
    propertyType: "flat",
    description:
      `A beautifully presented ${bedLabel.toLowerCase()} property at ${b.name}, finished to a high specification throughout. Bright open-plan living space, a contemporary fitted kitchen and a private outdoor space make this a standout home in one of Maidenhead's most sought-after addresses.`,
    features: [
      `${bedLabel} property`,
      `${baths} bathroom${baths > 1 ? "s" : ""}`,
      `${sqft} sq ft`,
      floor,
      "Fitted kitchen with integrated appliances",
      "Private balcony / terrace",
      "Allocated parking",
      "Elizabeth Line within walking distance",
    ],
  };
}

export const properties = [
  // ── For Sale ──
  prop("ws-2bed-apt-4", "waterside-quarter", "sale", 2, "2 Bedroom", 475000, 2, 785, "4th floor"),
  prop("ws-penthouse-9", "waterside-quarter", "sale", 99, "Penthouse", 850000, 2, 1240, "9th floor"),
  prop("ws-1bed-apt-2", "waterside-quarter", "sale", 1, "1 Bedroom", 350000, 1, 560, "2nd floor"),
  prop("bp-studio-1", "brunel-place", "sale", 0, "Studio", 255000, 1, 395, "1st floor"),
  prop("bp-1bed-apt-3", "brunel-place", "sale", 1, "1 Bedroom", 315000, 1, 520, "3rd floor"),
  prop("bp-2bed-apt-5", "brunel-place", "sale", 2, "2 Bedroom", 430000, 2, 740, "5th floor"),
  prop("cs-2bed-apt-2", "cooper-square", "sale", 2, "2 Bedroom", 420000, 2, 760, "2nd floor"),
  prop("cs-3bed-apt-6", "cooper-square", "sale", 3, "3 Bedroom", 565000, 2, 1010, "6th floor"),

  // ── For Rent (pcm) ──
  prop("ws-1bed-rent-3", "waterside-quarter", "rent", 1, "1 Bedroom", 1500, 1, 560, "3rd floor"),
  prop("ws-2bed-rent-6", "waterside-quarter", "rent", 2, "2 Bedroom", 1950, 2, 790, "6th floor"),
  prop("bp-1bed-rent-2", "brunel-place", "rent", 1, "1 Bedroom", 1425, 1, 515, "2nd floor"),
  prop("bp-2bed-rent-4", "brunel-place", "rent", 2, "2 Bedroom", 1850, 2, 745, "4th floor"),
  prop("cs-2bed-rent-3", "cooper-square", "rent", 2, "2 Bedroom", 1795, 2, 760, "3rd floor"),
  prop("cs-3bed-rent-7", "cooper-square", "rent", 3, "3 Bedroom", 2200, 2, 1010, "7th floor"),
];

export const propertyBySlug = Object.fromEntries(properties.map((p) => [p.slug, p]));

// ─── Filter option sets ──────────────────────────────────────────────────────
export const bedroomOptions = [
  { value: "all", label: "All" },
  { value: "0", label: "Studio" },
  { value: "1", label: "1 Bedroom" },
  { value: "2", label: "2 Bedrooms" },
  { value: "3", label: "3 Bedrooms" },
  { value: "99", label: "Penthouse" },
];

export const salePrices = [100000, 250000, 350000, 450000, 550000, 750000, 1000000];
export const rentPrices = [1000, 1250, 1500, 1750, 2000, 2500, 3000];

// ─── "Why Live Here" lifestyle content ───────────────────────────────────────
export const live = {
  hero: {
    eyebrow: "Live",
    title: "Why Live in Maidenhead",
    intro:
      "A riverside town unlike anywhere else within easy reach of the city — a green, connected and thriving place to call home, with the Thames on your doorstep and London just 18 minutes away.",
    image: PIC.extHero,
  },
  // Lifestyle bento tiles (desktop grid + mobile auto-slider).
  // Order matters for the desktop grid auto-flow:
  //   Nature (tall, left) · Community (wide, top-right) · Safe & Secure · Convenience
  pillars: [
    {
      icon: "🌳",
      title: "Nature",
      subtitle: "The Thames on your doorstep",
      image: "/images/slide-bridge.jpg",
      lines: ["5km riverside trails", "Acres of green space", "Thames Path access"],
      link: { label: "Explore Outdoors", to: "/see-do" },
      span: "md:col-span-1 md:row-span-2",
      big: true,
    },
    {
      icon: "🎭",
      title: "Community & Culture",
      subtitle: "Everything happening on your doorstep",
      image: "/images/slide-river.jpg",
      lines: ["Independent shops", "Vibrant food scene", "Year-round events"],
      link: { label: "See What's On", to: "/see-do" },
      span: "md:col-span-2",
    },
    {
      icon: "🛡️",
      title: "Safe & Secure",
      subtitle: "Peace of mind, built in",
      image: "/images/live/ext-waterside.jpg",
      lines: ["Well-managed neighbourhoods", "Concierge buildings", "A genuine sense of community"],
      link: { label: "Learn More", to: "/live/overview" },
      span: "",
    },
    {
      icon: "🚄",
      title: "Convenience",
      subtitle: "London in under 20 minutes",
      image: "/images/getting-here.jpg",
      lines: ["Elizabeth Line & GWR", "18–20 mins to Paddington", "Everything close to home"],
      link: { label: "Travel Connections", to: "/live/overview" },
      span: "",
    },
  ],
  designedAroundYou: [
    {
      tab: "Green Spaces",
      title: "Green Spaces",
      body: "From Kidwells Park to the riverside meadows, nature is never more than a short stroll away.",
      stats: [
        { icon: "🌳", value: "120+", label: "Acres of green space" },
        { icon: "🚶", value: "5km", label: "Riverside walks" },
        { icon: "🦢", value: "15+", label: "Nature spots" },
      ],
      images: ["/images/live/dau/green-1.jpg", "/images/live/dau/green-2.jpg", "/images/live/dau/green-3.jpg", "/images/ql-green.jpg"],
    },
    {
      tab: "Eating & Drinking",
      title: "Eating & Drinking",
      body: "Waterfront restaurants, independent cafés and lively bars line the regenerated town centre.",
      stats: [
        { icon: "🍽", value: "80+", label: "Cafés, bars & restaurants" },
        { icon: "🌍", value: "20+", label: "Cuisines to explore" },
        { icon: "🛶", value: "5 min", label: "To the riverside" },
      ],
      images: ["/images/coppa/terrace.jpg", "/images/slide-river.jpg", "/images/coppa/dining.jpg", "/images/card-cafe.jpg"],
    },
    {
      tab: "Shopping",
      title: "Shopping",
      body: "Nicholsons Quarter, the high street and weekend markets cover everything from everyday essentials to something special.",
      stats: [
        { icon: "🛍", value: "120+", label: "Shops & services" },
        { icon: "🏬", value: "2", label: "Shopping quarters" },
        { icon: "🧺", value: "Sat", label: "Weekly market" },
      ],
      images: ["/images/live/dau/shop-1.jpg", "/images/live/dau/shop-2.jpg", "/images/live/dau/shop-3.jpg", "/images/ql-shop.jpg"],
    },
    {
      tab: "Fitness & Wellness",
      title: "Fitness & Wellness",
      body: "Gyms, studios, padel courts and the leisure centre keep an active lifestyle effortless.",
      stats: [
        { icon: "🏋️", value: "10+", label: "Gyms & studios" },
        { icon: "🎾", value: "4", label: "Padel courts" },
        { icon: "🧘", value: "1", label: "Leisure centre" },
      ],
      images: ["/images/live/dau/fit-1.jpg", "/images/live/dau/fit-2.jpg", "/images/live/dau/fit-3.jpg", "/images/ql-wellness.jpg"],
    },
  ],
};

// ─── Live dropdown menu (mirrors Canary Wharf) ───────────────────────────────
export const liveMenu = {
  key: "live",
  label: "Live",
  path: "/live",
  columns: [
    {
      heading: "For Sale & Rent",
      links: [
        { label: "Properties For Sale", to: "/live/for-sale" },
        { label: "Properties For Rent", to: "/live/for-rent" },
        { label: "Enquire", to: "/live/enquire" },
      ],
    },
    {
      heading: "Living in Maidenhead",
      links: [
        { label: "Why Live Here", to: "/live" },
        { label: "The Future", to: "/explore/the-future" },
      ],
    },
    {
      heading: "Our Buildings",
      links: buildings.map((b) => ({ label: b.name, to: `/live/building/${b.slug}` })),
    },
  ],
};

// Shared price formatting
export const fmtPrice = (p, status) =>
  status === "rent" ? `£${p.toLocaleString()} pcm` : `£${p.toLocaleString()}`;
