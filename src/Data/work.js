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
const _img = (seed, w = 1200, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const workplaceBuildings = [
  {
    slug: "one-maidenhead",
    name: "One Maidenhead",
    developer: "Smedvig",
    tagline: "Contemporary commercial space at the heart of Maidenhead's regenerated town centre",
    location: "King Street / Queen Street, Maidenhead SL6 1DY",
    status: "Available Now",
    website: "https://www.smedvig.com/property/one-maidenhead/",
    email: "info@smedvig.com",
    phone: null,
    image: _img("mh-one-hero", 1400, 900),
    hero: _img("mh-one-hero", 1400, 900),
    gallery: [
      _img("mh-one-hero", 1200, 800),
      _img("mh-one-office-a", 900, 600),
      _img("mh-one-lobby", 900, 600),
      _img("mh-one-exterior", 900, 600),
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
    slug: "maidenhead-enterprise-centre",
    name: "Maidenhead Enterprise Centre",
    developer: "Royal Borough of Windsor & Maidenhead",
    tagline: "Affordable managed workspace for start-ups and growing businesses",
    location: "Stafferton Way, Maidenhead SL6 1AW",
    status: "Available Now",
    website: null,
    email: "enterprise@rbwm.gov.uk",
    phone: "01628 000 400",
    image: _img("mh-mec-hero", 1400, 900),
    hero: _img("mh-mec-hero", 1400, 900),
    gallery: [
      _img("mh-mec-hero", 1200, 800),
      _img("mh-mec-office", 900, 600),
      _img("mh-mec-meeting", 900, 600),
      _img("mh-mec-reception", 900, 600),
    ],
    description: "Maidenhead Enterprise Centre offers affordable, flexible managed workspace for start-ups and growing businesses close to the town centre — from private offices to hot-desking, with a built-in community of entrepreneurs.",
    longDescription: [
      "Maidenhead Enterprise Centre is the borough's dedicated hub for entrepreneurial growth, providing affordable managed workspace in a professionally run, community-focused environment. Whether you need a private office suite, a shared desk or simply a registered business address, the centre is designed to flex around your business as it develops.",
      "Beyond the physical space, the centre provides genuine added value: a community of like-minded businesses creates organic opportunities for collaboration, partnership and peer learning. Regular networking sessions, workshops and business support events are hosted on-site, making it far more than just a place to work.",
      "Located close to Maidenhead town centre with strong road connections to the M4, the Enterprise Centre gives growing SMEs a cost-effective, professional base at the heart of one of Berkshire's most dynamic business communities.",
    ],
    quickStats: [
      { icon: "🏢", label: "Space type", value: "Managed Offices" },
      { icon: "📐", label: "Unit size",  value: "From 150 sq ft" },
      { icon: "📍", label: "Location",   value: "Stafferton Way, SL6" },
      { icon: "✅", label: "Status",      value: "Available Now" },
    ],
    amenities: [
      { icon: "🔑", text: "Private offices available" },
      { icon: "💻", text: "Hot-desking & co-working" },
      { icon: "🤝", text: "Business networking events" },
      { icon: "📋", text: "Registered business address" },
      { icon: "🖨", text: "Shared print & meeting rooms" },
      { icon: "🅿️", text: "On-site parking" },
      { icon: "☕", text: "Break-out & kitchen areas" },
      { icon: "🔒", text: "24/7 secure access" },
    ],
    nearbyPlaces: [
      { name: "Maidenhead Town Centre",             distance: "5 min walk",   mode: "walk" },
      { name: "Maidenhead Station (Elizabeth Line)", distance: "10 min walk", mode: "walk" },
      { name: "London Paddington",                  distance: "18 min",       mode: "train" },
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
        { label: "Workplace Developments", to: "/work/developments" },
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
