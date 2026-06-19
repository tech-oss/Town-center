// ════════════════════════════════════════════════════════════════════════════
//  "Work" section — Maidenhead's local economic ecosystem.
//  A hyper-local, community-focused hub combining: Jobs · Freelance ·
//  Business Directory · Business Opportunities · Services Marketplace ·
//  Training & Learning · Networking & Events.
//
//  Route: /work → WorkPage  (category sub-pages: /work/:category)
// ════════════════════════════════════════════════════════════════════════════

export const work = {
  hero: {
    eyebrow: "Work in Maidenhead",
    title: "Work. Connect. Grow in Maidenhead",
    intro: "Find jobs, freelance projects, local services, business opportunities and more — all in one place.",
    image: "/images/slide-river.jpg",
  },

  // Location options for the hero search
  locations: ["Maidenhead", "Cookham", "Bray", "Taplow", "Furze Platt", "Royal Borough"],

  // The seven pillars of the Work ecosystem
  categories: [
    { id: "jobs", icon: "briefcase", title: "Jobs", desc: "Find full-time, part-time and contract jobs" },
    { id: "freelance", icon: "tools", title: "Freelance", desc: "Find and apply for local projects" },
    { id: "directory", icon: "building", title: "Business Directory", desc: "Discover local businesses and services" },
    { id: "opportunities", icon: "handshake", title: "Business Opportunities", desc: "Partnerships, investments & more" },
    { id: "services", icon: "services", title: "Services Marketplace", desc: "Find local services & professionals" },
    { id: "training", icon: "cap", title: "Training & Learning", desc: "Courses, workshops & skill development" },
    { id: "networking", icon: "people", title: "Networking & Events", desc: "Meetups, events & business networking" },
  ],

  // Featured opportunities (mixed types). meta items: { icon, label }
  featured: [
    {
      tag: "Job",
      type: "job",
      title: "Marketing Assistant",
      to: "/work/jobs",
      meta: [
        { icon: "badge", label: "Full-time" },
        { icon: "pin", label: "Maidenhead" },
        { icon: "pound", label: "£22,000 – £28,000" },
        { icon: "clock", label: "2 days ago" },
      ],
    },
    {
      tag: "Freelance",
      type: "freelance",
      title: "Logo Design for Café",
      to: "/work/freelance",
      meta: [
        { icon: "tag", label: "Fixed Price" },
        { icon: "pound", label: "£150 – £300" },
        { icon: "clock", label: "1 day ago" },
      ],
    },
    {
      tag: "Service",
      type: "service",
      title: "Website Development",
      to: "/work/services",
      meta: [
        { icon: "tag", label: "Fixed Price" },
        { icon: "pound", label: "£500 – £1,200" },
        { icon: "clock", label: "3 days ago" },
      ],
    },
    {
      tag: "Training",
      type: "training",
      title: "Digital Marketing Workshop",
      to: "/work/training",
      meta: [
        { icon: "award", label: "Certificate" },
        { icon: "calendar", label: "20 Jun 2026" },
        { icon: "pin", label: "Maidenhead" },
      ],
    },
  ],
};

// ─── Workplace developments ───────────────────────────────────────────────────

export const workplaceBuildings = [
  {
    slug: "one-maidenhead",
    name: "One Maidenhead",
    developer: "Smedvig",
    tagline: "Contemporary commercial space at the heart of Maidenhead's regenerated town centre",
    location: "King Street / Queen Street, Maidenhead SL6 1DY",
    lat: 51.5231, lng: -0.7194,
    status: "Available Now",
    website: "https://www.smedvig.com/property/one-maidenhead/",
    email: "info@smedvig.com",
    phone: null,
    image: "https://www.getliving.com/wp-content/uploads/2024/07/one-maidenhead-public-realm-1000x800-1.jpg",
    hero: "https://www.getliving.com/wp-content/uploads/2024/07/one-maidenhead-public-realm-1000x800-1.jpg",
    gallery: [
      "https://www.getliving.com/wp-content/uploads/2024/07/one-maidenhead-lobby-1000x800-1.jpg",
      "https://www.getliving.com/wp-content/uploads/2024/07/one-maidenhead-resident-lounges-1000x800-1.jpg",
      "https://www.getliving.com/wp-content/uploads/2024/07/one-maidenhead-gym-1000x800-1.jpg",
      "https://www.getliving.com/wp-content/uploads/2024/03/one_maidenhead_waterways_bridge_1400x1400-1.jpeg",
    ],
    description: "One Maidenhead is a landmark mixed-use development at the heart of Maidenhead's regenerated town centre, delivering 36,000 sq ft of contemporary retail and commercial space alongside 429 new homes.",
    longDescription: [
      "One Maidenhead is one of the most significant commercial developments in Maidenhead's recent history — a bold, mixed-use scheme that brings together contemporary workspace, retail and dining in one landmark address spanning King Street, Queen Street and Broadway.",
      "Delivered by Smedvig, the development's 36,000 sq ft of ground-floor commercial space is designed for modern occupiers seeking flexible, well-connected space in a vibrant town-centre environment. The retail and restaurant units generate natural footfall, while 429 new homes above create a thriving built-in community from day one.",
      "With Maidenhead station and the Elizabeth Line just minutes away, One Maidenhead offers businesses a genuinely strategic base: proximity to London, excellent road connections via the M4, and the energy of a fast-growing riverside town.",
    ],
    quickStats: [
      { icon: "🏢", label: "Space type",      value: "Retail & Commercial" },
      { icon: "📐", label: "Commercial area", value: "36,000 sq ft" },
      { icon: "📍", label: "Location",        value: "Town Centre, SL6" },
      { icon: "✅", label: "Status",           value: "Available Now" },
    ],
    amenities: [
      { icon: "🏙", text: "Prime town-centre location" },
      { icon: "🚂", text: "Elizabeth Line · 5 min walk" },
      { icon: "🍽", text: "Restaurant & café units" },
      { icon: "🛍", text: "Retail space available" },
      { icon: "🏠", text: "429 residents on-site" },
      { icon: "💻", text: "High-speed connectivity" },
      { icon: "🅿️", text: "Town-centre parking nearby" },
      { icon: "♿", text: "Fully accessible" },
    ],
    nearbyPlaces: [
      { name: "Maidenhead Station (Elizabeth Line)", distance: "5 min walk",  mode: "walk" },
      { name: "London Paddington",                  distance: "18 min",       mode: "train" },
      { name: "Maidenhead High Street",             distance: "2 min walk",   mode: "walk" },
      { name: "M4 Motorway (J8/9)",                distance: "8 min drive",  mode: "car" },
      { name: "Heathrow Airport",                  distance: "25 min drive", mode: "car" },
      { name: "Windsor & Eton",                    distance: "15 min drive", mode: "car" },
    ],
  },
  {
    slug: "trehus",
    name: "Trehus",
    developer: "Hub & Smedvig",
    tagline: "Designed differently — a sustainable timber office for forward-thinking businesses",
    location: "King Street, Maidenhead SL6 1DY",
    lat: 51.5231, lng: -0.7194,
    status: "Ready Q4 2026",
    website: "https://www.trehus.work",
    email: "stuart.chambers@savills.com",
    phone: "07870 999 339",
    image: "https://www.trehus.work/images/home-blocks/Trehus_1000_04.webp",
    hero: "https://www.trehus.work/images/home-blocks/Trehus_1000_02.webp",
    gallery: [
      "https://www.trehus.work/images/home-blocks/Trehus_1000_04.webp",
      "https://www.trehus.work/images/home-blocks/Trehus_1000_01.webp",
      "https://www.trehus.work/images/home-blocks/Trehus_1000_03.webp",
      "https://www.trehus.work/images/home-blocks/Trehus_1000_02.webp",
    ],
    description: "Trehus is a sustainably-designed timber office building offering 61,677 sq ft of future-proof workspace within the One Maidenhead development. Designed by award-winning Waugh Thistleton Architects, it lets businesses reflect their values through low-energy, ESG-aligned space.",
    longDescription: [
      "Trehus is designed differently. Built around an engineered timber structure rather than conventional concrete, it dramatically reduces the embodied carbon of the building — offering forward-thinking businesses a genuinely sustainable home that reflects their values. Designed by award-winning Waugh Thistleton Architects, Trehus pairs striking architecture with the low energy usage and ESG credentials that modern occupiers and their people increasingly demand.",
      "Offering 61,677 sq ft of workspace to let, Trehus is built for the way people work today: flexible floorplates, generous co-working areas, dedicated event space, a landscaped roof terrace and a ground-level café all foster collaboration and wellbeing. A new public garden square brings greenery and calm right to the door, while 53 bicycle spaces with showers make active, sustainable commuting effortless.",
      "Part of the wider One Maidenhead regeneration, Trehus sits in the heart of the town with direct Elizabeth Line and South Western Railway connections placing London, Reading and the wider region within easy reach. Trehus is ready for occupation in Q4 2026.",
    ],
    quickStats: [
      { icon: "🌲", label: "Building",    value: "Timber-structured" },
      { icon: "📐", label: "Space to let", value: "61,677 sq ft" },
      { icon: "📍", label: "Location",    value: "One Maidenhead, SL6" },
      { icon: "🔜", label: "Ready",       value: "Q4 2026" },
    ],
    amenities: [
      { icon: "🌲", text: "Low-carbon timber structure" },
      { icon: "💻", text: "Co-working areas" },
      { icon: "🎤", text: "Dedicated event space" },
      { icon: "🌅", text: "Landscaped roof terrace" },
      { icon: "☕", text: "Ground-level café" },
      { icon: "🌳", text: "Public garden square" },
      { icon: "🚲", text: "53 cycle spaces + showers" },
      { icon: "♻️", text: "ESG-aligned, low energy use" },
    ],
    nearbyPlaces: [
      { name: "Maidenhead Station (Elizabeth Line)", distance: "5 min walk",   mode: "walk" },
      { name: "London Paddington",                  distance: "18 min",       mode: "train" },
      { name: "Reading",                            distance: "15 min",       mode: "train" },
      { name: "Maidenhead High Street",             distance: "2 min walk",   mode: "walk" },
      { name: "M4 Motorway (J8/9)",                distance: "8 min drive",  mode: "car" },
      { name: "Heathrow Airport",                  distance: "25 min drive", mode: "car" },
    ],
  },
];

export const workplaceBySlug = Object.fromEntries(
  workplaceBuildings.map((b) => [b.slug, b])
);

// ─── Work nav menu (adds dropdown to "Work" header item) ─────────────────────
export const workMenu = {
  key: "work",
  label: "Work",
  path: "/work",
  columns: [
    {
      heading: "Work in Maidenhead",
      links: [
        { label: "Jobs, Projects & Networking", to: "/work" },
      ],
    },
    {
      heading: "Developments",
      links: [
        { label: "One Maidenhead", to: "/work/developments/one-maidenhead" },
        { label: "Trehus", to: "/work/developments/trehus" },
      ],
    },
  ],
};

// Tag colours for featured cards
export const tagColors = {
  job: { bg: "#E0E7FF", text: "#4338CA" },        // indigo
  freelance: { bg: "#EDE9FE", text: "#6D28D9" },  // purple
  service: { bg: "#FFEDD5", text: "#C2410C" },    // amber
  training: { bg: "#DCFCE7", text: "#15803D" },   // green
};
