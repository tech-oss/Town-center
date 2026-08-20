// ─── Mobile-app-only content ────────────────────────────────────────────────────
// Business/place/event/guide listings now come straight from the same
// Data/*.js the desktop site uses (see SectionScreen, PlaceDetailScreen,
// WhatsOnScreen, HomeScreen, GuidesScreen, OffersScreen, LiveScreen). What's
// left here is content genuinely specific to the app shell: nav tiles, the
// map's curated pins, and the static Explore/Plan/About screens.

export const heroImage = "/images/card-bridge.jpg";

// Quick category tiles on Home
export const homeCategories = [
  { id: "see-do", label: "See & Do", icon: "compass", to: "/mobile/see-do" },
  { id: "eat-drink", label: "Eat & Drink", icon: "cup", to: "/mobile/eat-drink" },
  { id: "shop", label: "Shop", icon: "bag", to: "/mobile/shop" },
  { id: "services", label: "Services", icon: "services", to: "/mobile/services" },
  { id: "live", label: "Live & Stay", icon: "home", to: "/mobile/live" },
  { id: "offers", label: "Offers", icon: "tag", to: "/mobile/offers" },
  { id: "guides", label: "Guides", icon: "book", to: "/mobile/guides" },
  { id: "map", label: "Map", icon: "pin", to: "/mobile/map" },
];

// ─── Explore hub ───────────────────────────────────────────────────────────────
export const exploreSections = [
  { id: "see-do", title: "See & Do", blurb: "Attractions & green spaces.", image: "/images/attractions/boulters-lock.jpg", to: "/mobile/see-do" },
  { id: "eat-drink", title: "Eat & Drink", blurb: "Restaurants, cafés & bars.", image: "/images/coppa/dining.jpg", to: "/mobile/eat-drink" },
  { id: "shop", title: "Shop", blurb: "High street & independents.", image: "/images/explore/market.jpg", to: "/mobile/shop" },
  { id: "services", title: "Services", blurb: "Trades, health & professionals.", image: "/images/explore/street.jpg", to: "/mobile/services" },
  { id: "live", title: "Live & Stay", blurb: "Hotels & places to stay.", image: "/images/live/ext-hero.jpg", to: "/mobile/live" },
  { id: "offers", title: "Offers", blurb: "The latest news & offers.", image: "/images/coppa/terrace.jpg", to: "/mobile/offers" },
  { id: "guides", title: "Neighbourhood Guides", blurb: "Curated guides to the town.", image: "/images/eat-drink-hero-desktop.png", to: "/mobile/guides" },
  { id: "work", title: "Work", blurb: "Jobs & business — coming soon.", image: "/images/slide-river.jpg", to: "/mobile/work" },
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
// `to` links into a real business's mobile detail page where one exists
// (Data/pages.js); landmarks without a standalone business profile just show
// their name + a "Get Directions" action in the map sheet instead.
export const mapPins = [
  { id: 1, name: "Coppa Club", category: "Eat & Drink", type: "eat-drink", lat: 51.521889, lng: -0.716051, to: "/mobile/place/coppa-club" },
  { id: 2, name: "Cocoba", category: "Eat & Drink", type: "eat-drink", lat: 51.523201, lng: -0.7176, to: "/mobile/place/cocoba" },
  { id: 3, name: "El Cerdo", category: "Eat & Drink", type: "eat-drink", lat: 51.52348, lng: -0.71762, to: "/mobile/place/el-cerdo" },
  { id: 4, name: "Hall & Woodhouse", category: "Eat & Drink", type: "eat-drink", lat: 51.526859, lng: -0.700343, to: "/mobile/place/hall-woodhouse" },
  { id: 5, name: "Boulter's Lock", category: "See & Do", type: "see-do", lat: 51.5261, lng: -0.7155 },
  { id: 6, name: "Norden Farm Centre", category: "See & Do", type: "see-do", lat: 51.5189, lng: -0.7242 },
  { id: 7, name: "Kidwells Park", category: "See & Do", type: "see-do", lat: 51.5224, lng: -0.7268 },
  { id: 8, name: "Maidenhead Heritage Centre", category: "See & Do", type: "see-do", lat: 51.5212, lng: -0.7198 },
  { id: 9, name: "Nicholsons Centre", category: "Shop", type: "shop", lat: 51.5225, lng: -0.7208 },
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
