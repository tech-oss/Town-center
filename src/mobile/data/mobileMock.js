// ─── Mock content for the mobile-demo PWA screens ──────────────────────────────
// Coordinates reused from src/Data/content.js (verified Maidenhead locations).
// Everything links within /mobile/* so the TWA never leaves its scope.

export const heroImage = "/images/card-bridge.jpg";

export const featuredSpot = {
  eyebrow: "On the River",
  title: "Boulter's Lock & Ray Mill Island",
  blurb: "One of the most photographed stretches of the Thames.",
  image: "/images/card-lock.jpg",
  to: "/mobile/place/boulters-lock",
};

// Quick category tiles on Home
export const homeCategories = [
  { id: "see-do", label: "See & Do", icon: "compass", to: "/mobile/see-do" },
  { id: "eat-drink", label: "Eat & Drink", icon: "cup", to: "/mobile/eat-drink" },
  { id: "shop", label: "Shop", icon: "bag", to: "/mobile/shop" },
  { id: "map", label: "Map", icon: "pin", to: "/mobile/map" },
];

// ─── Events (What's On) ────────────────────────────────────────────────────────
export const eventFilters = ["All", "Family", "Music", "Food & Drink"];

export const events = [
  { id: "e1", date: "2026-06-18", month: "JUN", day: "18", title: "Riverside Market", time: "Thu 10:00 AM", location: "Riverside Promenade", category: "Food & Drink", image: "/images/events/farmers-market-1.jpg" },
  { id: "e2", date: "2026-06-20", month: "JUN", day: "20", title: "Live Music by the River", time: "Sat 2:00 PM", location: "Boulter's Lock", category: "Music", image: "/images/events/bands-1.jpg" },
  { id: "e3", date: "2026-06-21", month: "JUN", day: "21", title: "Street Food Festival", time: "Sun 11:00 AM", location: "High Street", category: "Food & Drink", image: "/images/events/popup.jpg" },
  { id: "e4", date: "2026-06-25", month: "JUN", day: "25", title: "Summer Choir Night", time: "Thu 7:00 PM", location: "Norden Farm", category: "Music", image: "/images/events/choirs-1.jpg" },
  { id: "e5", date: "2026-06-28", month: "JUN", day: "28", title: "Family Fun Day", time: "Sun 12:00 PM", location: "Kidwells Park", category: "Family", image: "/images/events/family.jpg" },
  { id: "e6", date: "2026-07-01", month: "JUL", day: "01", title: "Maidenhead Carnival", time: "Wed 11:00 AM", location: "Kidwells Park", category: "Family", image: "/images/events/summer-1.jpg" },
  { id: "e7", date: "2026-07-04", month: "JUL", day: "04", title: "Jazz on the Terrace", time: "Sat 7:00 PM", location: "Coppa Club", category: "Music", image: "/images/events/bands-3.jpg" },
  { id: "e8", date: "2026-07-05", month: "JUL", day: "05", title: "Farmers' Market", time: "Sun 9:00 AM", location: "Town Square", category: "Food & Drink", image: "/images/events/farmers-market-3.jpg" },
];

// ─── Sections (See & Do / Eat & Drink / Shop) ──────────────────────────────────
export const sections = {
  "see-do": {
    title: "See & Do",
    intro: "Explore the best attractions, green spaces, and things to do in and around Maidenhead.",
    filters: ["All", "Attractions", "Outdoors", "Arts & Culture"],
    items: [
      { id: "boulters-lock", name: "Boulter's Lock", category: "Outdoors", blurb: "A scenic lock on the River Thames.", image: "/images/attractions/boulters-lock.jpg", lat: 51.5261, lng: -0.7155, address: "Ray Mill Rd E, Maidenhead SL6 8PE", hours: "Open 24 hours" },
      { id: "heritage-centre", name: "Maidenhead Heritage Centre", category: "Arts & Culture", blurb: "Discover local history and exhibitions.", image: "/images/explore/street.jpg", lat: 51.5212, lng: -0.7198, address: "18 Park St, Maidenhead SL6 1SL", hours: "Tue–Sat 10:00–16:00" },
      { id: "ray-mill-island", name: "Ray Mill Island", category: "Outdoors", blurb: "A tranquil island park by the weir.", image: "/images/attractions/garden-path.jpg", lat: 51.5266, lng: -0.7141, address: "Ray Mill Rd E, Maidenhead SL6 8SW", hours: "Open 24 hours" },
      { id: "norden-farm", name: "Norden Farm Centre", category: "Arts & Culture", blurb: "Arts centre with theatre, cinema and café.", image: "/images/explore/evening.jpg", lat: 51.5189, lng: -0.7242, address: "Altwood Rd, Maidenhead SL6 4PF", hours: "Box office 10:00–18:00" },
      { id: "kidwells-park", name: "Kidwells Park", category: "Outdoors", blurb: "Central park with play areas and events.", image: "/images/attractions/swan.jpg", lat: 51.5224, lng: -0.7268, address: "Kidwells Park Dr, Maidenhead SL6 8AA", hours: "Open 24 hours" },
      { id: "nicholsons", name: "Nicholsons Centre", category: "Attractions", blurb: "A modern shopping & leisure destination.", image: "/images/explore/market.jpg", lat: 51.5225, lng: -0.7208, address: "Nicholsons Walk, Maidenhead SL6 1LB", hours: "Mon–Sat 9:00–18:00" },
    ],
  },
  "eat-drink": {
    title: "Eat & Drink",
    intro: "From riverside dining to cozy cafés, explore Maidenhead's food and drink scene.",
    filters: ["All", "Restaurants", "Cafés", "Pubs & Bars"],
    items: [
      { id: "coppa-club", name: "Coppa Club", category: "Restaurants", blurb: "All-day riverside dining with a view.", image: "/images/coppa/dining.jpg", lat: 51.521889, lng: -0.716051, address: "The Arches, Bridge Ave, SL6 1RR", hours: "Daily 8:00–23:00" },
      { id: "the-fat-duck", name: "The Fat Duck", category: "Restaurants", blurb: "Heston Blumenthal's Michelin-starred icon.", image: "/images/fatduck/food-1.jpg", lat: 51.5078, lng: -0.7028, address: "High St, Bray, Maidenhead SL6 2AQ", hours: "Tue–Sat, by reservation" },
      { id: "cocoba", name: "Cocoba Chocolate Café", category: "Cafés", blurb: "Artisan chocolate café & desserts.", image: "/images/cocoba/cafe.jpg", lat: 51.523201, lng: -0.7176, address: "2B High St, Waterside Quarter, SL6 1QJ", hours: "Daily 9:00–18:00" },
      { id: "esquires", name: "Esquires Coffee", category: "Cafés", blurb: "Relaxed coffee house in the town centre.", image: "/images/esquires/cafe-1.jpg", lat: 51.5228, lng: -0.7188, address: "Nicholsons Walk, SL6 1LB", hours: "Mon–Sat 7:30–17:30" },
      { id: "el-cerdo", name: "El Cerdo", category: "Pubs & Bars", blurb: "Lively tapas bar in Waterside Quarter.", image: "/images/coppa/bar.jpg", lat: 51.52348, lng: -0.71762, address: "The Colonnade, Waterside Quarter, SL6 1QG", hours: "Daily 12:00–23:00" },
      { id: "hall-woodhouse", name: "Hall & Woodhouse", category: "Pubs & Bars", blurb: "Riverside pub & kitchen at Taplow.", image: "/images/card-taplow.jpg", lat: 51.526859, lng: -0.700343, address: "Mill Ln, Taplow, SL6 0AA", hours: "Daily 11:00–23:00" },
    ],
  },
  shop: {
    title: "Shop",
    intro: "From high-street favourites to independent boutiques, discover Maidenhead's shops.",
    filters: ["All", "Fashion", "Food & Grocery", "Electronics"],
    items: [
      { id: "nicholsons-centre", name: "Nicholsons Centre", category: "Fashion", blurb: "The town's main shopping centre.", image: "/images/explore/market.jpg", logo: null, lat: 51.5225, lng: -0.7208, address: "Nicholsons Walk, SL6 1LB", hours: "Mon–Sat 9:00–18:00" },
      { id: "zara", name: "Zara", category: "Fashion", blurb: "Contemporary fashion for all.", image: "/images/explore/street.jpg", lat: 51.52265, lng: -0.71975, address: "High St, Maidenhead SL6 1QJ", hours: "Mon–Sat 9:30–18:00" },
      { id: "waitrose", name: "Waitrose", category: "Food & Grocery", blurb: "Quality supermarket & café.", image: "/images/ql-food.jpg", lat: 51.52010, lng: -0.72230, address: "Stafferton Way, SL6 1AY", hours: "Daily 8:00–21:00" },
      { id: "whsmith", name: "WHSmith", category: "Food & Grocery", blurb: "Books, stationery & news.", image: "/images/ql-shop.jpg", lat: 51.52340, lng: -0.71955, address: "Nicholsons Walk, SL6 1LB", hours: "Mon–Sat 8:30–18:00" },
      { id: "currys", name: "Currys", category: "Electronics", blurb: "Tech, gadgets & home electronics.", image: "/images/ql-transport.jpg", lat: 51.52185, lng: -0.72090, address: "Stafferton Way, SL6 1AN", hours: "Mon–Sat 9:00–20:00" },
      { id: "bakedd", name: "bakedd", category: "Food & Grocery", blurb: "Independent artisan bakery.", image: "/images/cocoba/storefront.jpg", lat: 51.522851, lng: -0.71774, address: "1a High St, Maidenhead SL6 1JN", hours: "Tue–Sun 8:00–16:00" },
    ],
  },
};

// Flat lookup for the place-detail screen (across all sections).
export const placesById = Object.fromEntries(
  Object.entries(sections).flatMap(([sectionKey, s]) =>
    s.items.map((it) => [it.id, { ...it, sectionKey, sectionTitle: s.title }])
  )
);

// ─── Explore hub ───────────────────────────────────────────────────────────────
export const exploreSections = [
  { id: "see-do", title: "See & Do", blurb: "Attractions & green spaces.", image: "/images/attractions/boulters-lock.jpg", to: "/mobile/see-do" },
  { id: "eat-drink", title: "Eat & Drink", blurb: "Restaurants, cafés & bars.", image: "/images/coppa/dining.jpg", to: "/mobile/eat-drink" },
  { id: "shop", title: "Shop", blurb: "High street & independents.", image: "/images/explore/market.jpg", to: "/mobile/shop" },
];

export const exploreInfo = [
  { id: "getting-here", title: "Getting Here", blurb: "Travel and transport info.", image: "/images/getting-here.jpg", to: "/mobile/info/getting-here" },
  { id: "visitor-info", title: "Visitor Information", blurb: "Essential visitor details.", image: "/images/card-taplow.jpg", to: "/mobile/info/visitor-information" },
  { id: "plan", title: "Plan Your Visit", blurb: "Everything for a great trip.", image: "/images/slide-river.jpg", to: "/mobile/plan" },
];

// ─── Content / info pages ──────────────────────────────────────────────────────
export const aboutStats = [
  { label: "Population", value: "70K+" },
  { label: "Parks & Green Spaces", value: "45" },
  { label: "Annual Events", value: "20+" },
];

export const infoPages = {
  "getting-here": {
    title: "Getting Here",
    image: "/images/getting-here.jpg",
    intro: "Maidenhead is superbly connected by rail and road, with the Elizabeth Line putting central London within easy reach.",
    blocks: [
      { heading: "By Train", body: "The Elizabeth Line and GWR services run direct to London Paddington (~20 min) and Reading. Maidenhead station is a 5-minute walk from the town centre." },
      { heading: "By Car", body: "Just off the M4 (Junction 8/9) and A404(M). Several town-centre car parks including Nicholsons and Stafferton Way." },
      { heading: "By Bus", body: "Local bus routes connect Maidenhead with Windsor, Slough, Reading and surrounding villages." },
    ],
  },
  "visitor-information": {
    title: "Visitor Information",
    image: "/images/card-taplow.jpg",
    intro: "Everything you need to know to make the most of your visit to Maidenhead.",
    blocks: [
      { heading: "Tourist Information", body: "Find maps, leaflets and local advice at the Heritage Centre on Park Street." },
      { heading: "Accessibility", body: "The town centre is largely step-free, with accessible parking and Changing Places facilities at Nicholsons Centre." },
      { heading: "Opening Hours", body: "Most shops open Mon–Sat 9:00–18:00, with riverside restaurants open later through the week." },
    ],
  },
};

export const planItems = [
  { id: "getting-here", title: "Getting Here", blurb: "Find the best way to reach Maidenhead.", icon: "train", to: "/mobile/info/getting-here" },
  { id: "where-to-stay", title: "Where to Stay", blurb: "Hotels and accommodation.", icon: "bed", to: "/mobile/info/visitor-information" },
  { id: "accessibility", title: "Accessibility", blurb: "Information for accessible travel.", icon: "access", to: "/mobile/info/visitor-information" },
  { id: "visitor-info", title: "Visitor Information", blurb: "Essential visitor details.", icon: "info", to: "/mobile/info/visitor-information" },
];

export const aboutPage = {
  title: "About Maidenhead",
  image: "/images/attractions/lock-boat.jpg",
  body: "Maidenhead is a vibrant riverside town in Berkshire, offering a perfect balance of historic charm and modern convenience. With the River Thames on its doorstep and the Elizabeth Line connecting it to central London, it's a thriving place to visit, live and work.",
};

// ─── Map ───────────────────────────────────────────────────────────────────────
export const mapPins = [
  { id: 1, name: "Coppa Club", category: "Eat & Drink", type: "eat-drink", lat: 51.521889, lng: -0.716051, to: "/mobile/place/coppa-club" },
  { id: 2, name: "Cocoba", category: "Eat & Drink", type: "eat-drink", lat: 51.523201, lng: -0.7176, to: "/mobile/place/cocoba" },
  { id: 3, name: "El Cerdo", category: "Eat & Drink", type: "eat-drink", lat: 51.52348, lng: -0.71762, to: "/mobile/place/el-cerdo" },
  { id: 4, name: "Hall & Woodhouse", category: "Eat & Drink", type: "eat-drink", lat: 51.526859, lng: -0.700343, to: "/mobile/place/hall-woodhouse" },
  { id: 5, name: "Boulter's Lock", category: "See & Do", type: "see-do", lat: 51.5261, lng: -0.7155, to: "/mobile/place/boulters-lock" },
  { id: 6, name: "Norden Farm Centre", category: "See & Do", type: "see-do", lat: 51.5189, lng: -0.7242, to: "/mobile/place/norden-farm" },
  { id: 7, name: "Kidwells Park", category: "See & Do", type: "see-do", lat: 51.5224, lng: -0.7268, to: "/mobile/place/kidwells-park" },
  { id: 8, name: "Heritage Centre", category: "See & Do", type: "see-do", lat: 51.5212, lng: -0.7198, to: "/mobile/place/heritage-centre" },
  { id: 9, name: "Nicholsons Centre", category: "Shop", type: "shop", lat: 51.5225, lng: -0.7208, to: "/mobile/place/nicholsons-centre" },
  { id: 10, name: "Zara", category: "Shop", type: "shop", lat: 51.52265, lng: -0.71975, to: "/mobile/place/zara" },
  { id: 11, name: "Waitrose", category: "Shop", type: "shop", lat: 51.52010, lng: -0.72230, to: "/mobile/place/waitrose" },
];

export const mapFilters = [
  { key: "all", label: "All" },
  { key: "eat-drink", label: "Eat & Drink" },
  { key: "see-do", label: "See & Do" },
  { key: "shop", label: "Shop" },
];

export const PIN_COLORS = {
  "eat-drink": "#52C7B6",
  "see-do": "#2FA4A4",
  shop: "#F2A65A",
  default: "#52C7B6",
};

export const MAP_CENTRE = { lat: 51.5223, lng: -0.7185 };
