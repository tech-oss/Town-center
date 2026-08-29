// ─── Mock data for the newly-added admin screens ──────────────────────────────
// Frontend-only. Nothing here is persisted — every save/send action mocks a
// successful write and shows a toast. See individual TODO comments for the
// real backend integration points (Supabase / Resend / Stripe).

const img = (seed, w = 800, h = 500) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

// ─── Support Tickets ───────────────────────────────────────────────────────────
export const TICKET_CATEGORIES = ["General Question", "Listing Issue", "Billing", "Bug", "Other"];

export const SUPPORT_TICKETS = [
  {
    id: "t1",
    businessName: "The Velvet Lounge",
    contactEmail: "olivia@velvetlounge.co.uk",
    subject: "Can't upload new gallery photos",
    category: "Bug",
    status: "Open",
    submitted: "2026-08-26",
    thread: [
      { from: "business", author: "Olivia Grant", date: "2026-08-26 09:12", body: "Hi, every time I try to upload a new photo to my gallery it just spins and never finishes. Tried three different images." },
    ],
  },
  {
    id: "t2",
    businessName: "Elgan Davies Plumbing & Heating",
    contactEmail: "info@elgandavies.co.uk",
    subject: "Wrong opening hours showing on my page",
    category: "Listing Issue",
    status: "In Progress",
    submitted: "2026-08-24",
    thread: [
      { from: "business", author: "Elgan Davies", date: "2026-08-24 14:05", body: "My Saturday hours are showing as closed but we are open 8am-1pm on Saturdays. Can you fix this?" },
      { from: "admin", author: "Admin Support", date: "2026-08-24 16:40", body: "Thanks for flagging this Elgan — I can see the issue on our side. We're pushing a fix and will confirm once it's live." },
    ],
  },
  {
    id: "t3",
    businessName: "Maidenhead Book Nook",
    contactEmail: "priya@booknook.co.uk",
    subject: "Question about upgrading my plan",
    category: "Billing",
    status: "Resolved",
    submitted: "2026-08-18",
    thread: [
      { from: "business", author: "Priya Anand", date: "2026-08-18 11:20", body: "What's included if I upgrade from Basic to Standard?" },
      { from: "admin", author: "Admin Support", date: "2026-08-18 13:02", body: "Standard adds unlimited photos, priority placement in search, and access to the News & Offers section. I've sent a comparison sheet to your email." },
      { from: "business", author: "Priya Anand", date: "2026-08-18 13:40", body: "Perfect, that's exactly what I needed — thank you!" },
    ],
  },
  {
    id: "t4",
    businessName: "Thameside Accountancy",
    contactEmail: "hello@thamesideaccountancy.co.uk",
    subject: "How do I add a second team member?",
    category: "General Question",
    status: "Open",
    submitted: "2026-08-27",
    thread: [
      { from: "business", author: "Nadia Farooq", date: "2026-08-27 10:00", body: "I'd like to give my colleague access to manage our listing too — is that possible?" },
    ],
  },
  {
    id: "t5",
    businessName: "Bakedd",
    contactEmail: "hello@bakedd.co.uk",
    subject: "Duplicate listing showing in search",
    category: "Bug",
    status: "In Progress",
    submitted: "2026-08-20",
    thread: [
      { from: "business", author: "Tom Whitfield", date: "2026-08-20 08:55", body: "We're showing up twice in the Eat & Drink search results — can you merge or remove the duplicate?" },
      { from: "admin", author: "Admin Support", date: "2026-08-21 09:30", body: "Looking into this now, will update you shortly." },
    ],
  },
];

// ─── Articles & Guides ─────────────────────────────────────────────────────────
export const ARTICLE_CATEGORIES = ["Offers", "News", "Featured Story", "Neighbourhood Guide"];

export const ARTICLES = [
  {
    id: "a1", title: "Summer Happy Hour Returns to The Velvet Lounge", category: "Offers",
    author: "The Velvet Lounge", published: "2026-06-01", status: "Published",
    thumbnail: img("velvet-offer", 300, 300), heroImage: img("velvet-offer", 1200, 700),
    body: "The Velvet Lounge's popular Happy Hour is back for the summer — 50% off all cocktails every weekday between 5pm and 7pm.",
    tags: ["cocktails", "happy hour", "summer"], businessId: "b1",
    metaTitle: "Summer Happy Hour — The Velvet Lounge", metaDescription: "50% off cocktails every weekday 5-7pm this summer at The Velvet Lounge, Maidenhead.",
  },
  {
    id: "a2", title: "Elizabeth Line ridership hits record high", category: "News",
    author: "Admin", published: "2026-06-01", status: "Published",
    thumbnail: img("elizabeth-line", 300, 300), heroImage: img("elizabeth-line", 1200, 700),
    body: "New figures show Maidenhead station has seen its busiest month yet since the Elizabeth Line opened, with commuter numbers up 22% year-on-year.",
    tags: ["transport", "elizabeth line"], businessId: null,
    metaTitle: "Elizabeth Line ridership hits record high", metaDescription: "Maidenhead station sees record commuter numbers on the Elizabeth Line.",
  },
  {
    id: "a3", title: "Meet the Maker: Inside Maidenhead Book Nook", category: "Featured Story",
    author: "Admin", published: "2026-05-15", status: "Published",
    thumbnail: img("book-nook-story", 300, 300), heroImage: img("book-nook-story", 1200, 700),
    body: "We sat down with Priya Anand, owner of the beloved independent bookshop on King Street, to talk community, curation and why physical books still matter.",
    tags: ["local business", "shopping", "interview"], businessId: "b3",
    metaTitle: "Meet the Maker: Maidenhead Book Nook", metaDescription: "An interview with Priya Anand, owner of Maidenhead Book Nook.",
  },
  {
    id: "a4", title: "A Local's Guide to the Riverside", category: "Neighbourhood Guide",
    author: "Admin", published: "2026-04-20", status: "Draft",
    thumbnail: img("riverside-guide", 300, 300), heroImage: img("riverside-guide", 1200, 700),
    body: "From riverside walks to waterside dining, here's how to spend a perfect day along the Thames in Maidenhead.",
    tags: ["riverside", "things to do"], businessId: null,
    metaTitle: "A Local's Guide to the Riverside", metaDescription: "How to spend a perfect day along the Thames in Maidenhead.",
  },
  {
    id: "a5", title: "New Menu Launch at Bakedd", category: "Offers",
    author: "Bakedd", published: "2026-07-10", status: "Hidden",
    thumbnail: img("bakedd-menu", 300, 300), heroImage: img("bakedd-menu", 1200, 700),
    body: "Bakedd's brand new autumn menu features seasonal sourdough, spiced pastries and a new single-origin coffee.",
    tags: ["menu", "coffee", "bakery"], businessId: "ed2",
    metaTitle: "New Menu Launch at Bakedd", metaDescription: "Bakedd unveils its new autumn menu.",
  },
  {
    id: "a6", title: "Maidenhead Festival Opening Night Recap", category: "News",
    author: "Admin", published: "2026-07-05", status: "Published",
    thumbnail: img("festival-recap", 300, 300), heroImage: img("festival-recap", 1200, 700),
    body: "Thousands turned out for the opening night of this year's Maidenhead Festival — here's what you missed.",
    tags: ["festival", "events"], businessId: null,
    metaTitle: "Maidenhead Festival Opening Night Recap", metaDescription: "Highlights from this year's Maidenhead Festival opening night.",
  },
];

// ─── Neighbourhood Guides ───────────────────────────────────────────────────────
export const NEIGHBOURHOOD_GUIDES = [
  {
    id: "g1", title: "Town Centre: Shops, Cafés & Nightlife", area: "Town Centre", status: "Published",
    thumbnail: img("town-centre-guide", 300, 300), heroImage: img("town-centre-guide", 1200, 700),
    body: "Maidenhead's town centre is home to the High Street's independent shops, a growing food and drink scene, and the Nicholsons Quarter regeneration.",
    showOnHomepage: true, showOnPlatform: true,
  },
  {
    id: "g2", title: "Riverside: Walks, Dining & The Thames", area: "Riverside", status: "Published",
    thumbnail: img("riverside-guide-2", 300, 300), heroImage: img("riverside-guide-2", 1200, 700),
    body: "From Boulter's Lock to Ray Mill Island, the riverside is Maidenhead's green lung — and home to some of its best waterside restaurants.",
    showOnHomepage: true, showOnPlatform: true,
  },
  {
    id: "g3", title: "Bray: Fine Dining & Village Charm", area: "Bray", status: "Draft",
    thumbnail: img("bray-guide", 300, 300), heroImage: img("bray-guide", 1200, 700),
    body: "Just outside Maidenhead, the village of Bray punches well above its weight with two Michelin-starred restaurants and a picture-postcard high street.",
    showOnHomepage: false, showOnPlatform: true,
  },
];

// ─── Site Content (page hero/header editor) ────────────────────────────────────
export const SITE_CONTENT_SECTIONS = [
  {
    key: "homepage", label: "Homepage", kind: "homepage",
    heroVideoName: "maidenhead-hero-loop.mp4",
    heroHeadline: "WELCOME TO MAIDENHEAD",
    heroTagline: "RIVERSIDE · CONNECTED · THRIVING",
    heroSubtitle: "Discover a town centre reborn — independent shops, riverside dining, fast links to London and a community that's grown up around the Thames.",
  },
  {
    key: "see-do", label: "See & Do", kind: "listing",
    headerImage: img("see-do-hero", 1200, 700),
    headline: "SEE & DO",
    subtitle: "Leisure, entertainment and things to do",
    intro: "With a vibrant mix of leisure, entertainment, shopping, dining and wellbeing experiences, alongside a year-round calendar of events, there's always something new to discover in Maidenhead.",
  },
  {
    key: "eat-drink", label: "Eat & Drink", kind: "listing",
    headerImage: img("eat-drink-hero", 1200, 700),
    headline: "EAT & DRINK",
    subtitle: "Riverside terraces, cafés and independent restaurants",
    intro: "Experience Maidenhead in a whole new way — from scenic riverside terraces and independent restaurants to cosy cafés and vibrant bars, there's a perfect spot for every occasion.",
  },
  {
    key: "shop", label: "Shop", kind: "listing",
    headerImage: img("shop-hero", 1200, 700),
    headline: "SHOP",
    subtitle: "Independent boutiques and high street favourites",
    intro: "From independent boutiques to well-loved high street names, Maidenhead's shopping scene has something for everyone.",
  },
  {
    key: "services", label: "Services", kind: "listing",
    headerImage: img("services-hero", 1200, 700),
    headline: "SERVICES",
    subtitle: "Trusted tradespeople and professionals",
    intro: "Trusted local tradespeople and professionals — from builders and electricians to accountants and solicitors — all on hand in Maidenhead.",
  },
  {
    key: "live-stay", label: "Live & Stay", kind: "listing",
    headerImage: img("live-hero", 1200, 700),
    headline: "LIVE & STAY",
    subtitle: "Homes, hotels and places to stay",
    intro: "Discover what makes Maidenhead home — from new developments along the river to hotels and serviced apartments for every visit.",
  },
  {
    key: "work", label: "Work", kind: "listing",
    headerImage: img("work-hero", 1200, 700),
    headline: "WORK",
    subtitle: "A new home for local jobs and business",
    intro: "We're building a home for local jobs, freelance projects and business opportunities in Maidenhead's growing town centre.",
  },
  {
    key: "explore", label: "Explore", kind: "listing",
    headerImage: img("explore-hero", 1200, 700),
    headline: "EXPLORE THE FUTURE",
    subtitle: "The regeneration projects shaping Maidenhead",
    intro: "Explore the regeneration projects transforming Maidenhead town centre over the next decade.",
  },
  {
    key: "offers", label: "Offers", kind: "listing",
    headerImage: img("offers-hero", 1200, 700),
    headline: "OFFERS",
    subtitle: "The latest deals from local businesses",
    intro: "Browse the latest offers and promotions from businesses across Maidenhead town centre.",
  },
  {
    key: "events", label: "Events", kind: "listing",
    headerImage: img("events-hero", 1200, 700),
    headline: "WHAT'S ON",
    subtitle: "Maidenhead's events calendar",
    intro: "From markets and festivals to live music and family fun days, here's what's on in Maidenhead.",
  },
  {
    key: "properties", label: "Properties", kind: "listing",
    headerImage: img("properties-hero", 1200, 700),
    headline: "PROPERTIES",
    subtitle: "New developments across the town centre",
    intro: "Explore new residential developments and property opportunities across Maidenhead.",
  },
];

// ─── Subscription extensions (features / payment history) ─────────────────────
export const TIER_FEATURES = {
  Basic:    ["Listing page", "Up to 3 photos", "Business contact details"],
  Standard: ["Everything in Basic", "Unlimited photos", "News & Offers section", "Priority in search results"],
  Premium:  ["Everything in Standard", "Featured placement on category page", "Analytics dashboard", "Homepage spotlight eligibility"],
  Free:     ["Listing page", "1 photo"],
};

export const SUBSCRIPTION_PAYMENTS = {
  s1: [
    { date: "2026-06-12", amount: "£79.00", status: "Paid" },
    { date: "2026-05-12", amount: "£79.00", status: "Paid" },
    { date: "2026-04-12", amount: "£79.00", status: "Paid" },
  ],
  s2: [
    { date: "2026-06-01", amount: "£39.00", status: "Paid" },
    { date: "2026-05-01", amount: "£39.00", status: "Paid" },
  ],
  s3: [
    { date: "2026-01-08", amount: "£39.00", status: "Failed" },
    { date: "2025-12-08", amount: "£39.00", status: "Failed" },
    { date: "2025-11-08", amount: "£39.00", status: "Paid" },
  ],
  s4: [
    { date: "2026-01-07", amount: "£948.00", status: "Paid" },
    { date: "2025-01-07", amount: "£948.00", status: "Paid" },
  ],
  s5: [
    { date: "2026-06-10", amount: "£0.00", status: "Paid" },
  ],
};

// ─── Team members per business (Business Registrations extension) ────────────
export const BUSINESS_TEAM_MEMBERS = {
  b1: [
    { id: "tm1", name: "Olivia Grant", email: "olivia@velvetlounge.co.uk", role: "Owner" },
    { id: "tm2", name: "Marcus Lee", email: "marcus@velvetlounge.co.uk", role: "Manager" },
  ],
  b6: [
    { id: "tm3", name: "Elgan Davies", email: "info@elgandavies.co.uk", role: "Owner" },
    { id: "tm4", name: "Rhys Owen", email: "rhys@elgandavies.co.uk", role: "Staff" },
  ],
};

export const TEAM_ROLES = ["Owner", "Manager", "Staff"];
