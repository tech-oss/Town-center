// ─── Mobile-app-only content ────────────────────────────────────────────────────
// Business/place/event/guide listings now come straight from the same
// Data/*.js the desktop site uses (see SectionScreen, PlaceDetailScreen,
// WhatsOnScreen, HomeScreen, GuidesScreen, OffersScreen, LiveScreen). What's
// left here is content genuinely specific to the app shell: nav tiles, the
// map's curated pins, and the static Explore/Plan/About screens.

export const heroImage = "/images/card-bridge.jpg";

// Quick Links on Home — one row of four, matching the website's primary
// directory sections.
export const homeCategories = [
  { id: "see-do", label: "See & Do", image: "/images/quick-links/see-do.jpg", to: "/mobile/see-do" },
  { id: "eat-drink", label: "Eat & Drink", image: "/images/quick-links/eat-drink.jpg", to: "/mobile/eat-drink" },
  { id: "shop", label: "Shop", image: "/images/quick-links/shop.jpg", to: "/mobile/shop" },
  { id: "services", label: "Services", image: "/images/quick-links/services.jpg", to: "/mobile/services" },
];

// ─── Explore hub ───────────────────────────────────────────────────────────────
export const exploreSections = [
  { id: "offers", title: "Offers", blurb: "The latest news & offers.", image: "/images/offers/hero.jpg", to: "/mobile/offers" },
  { id: "live", title: "Live & Stay", blurb: "Hotels & places to stay.", image: "/images/live/accommodation-hero.jpg", to: "/mobile/live" },
  { id: "see-do", title: "See & Do", blurb: "Attractions & green spaces.", image: "/images/attractions/boulters-lock.jpg", to: "/mobile/see-do" },
  { id: "eat-drink", title: "Eat & Drink", blurb: "Restaurants, cafés & bars.", image: "/images/eat-drink/hero.jpg", to: "/mobile/eat-drink" },
  { id: "shop", title: "Shop", blurb: "High street & independents.", image: "/images/explore/market.jpg", to: "/mobile/shop" },
  { id: "services", title: "Services", blurb: "Trades, health & professionals.", image: "/images/services/hero-desktop.jpg", to: "/mobile/services" },
  { id: "work", title: "Work", blurb: "Jobs & business — coming soon.", image: "/images/slide-river.jpg", to: "/mobile/work" },
];

// Practical information — the two things visitors actually need before they
// travel. (The old "Visitor Information" and "Plan Your Visit" stubs were
// removed in favour of the website's full Getting Here and Parking content.)
export const exploreInfo = [
  { id: "transport", title: "Transport & Getting Here", blurb: "Trains, buses, driving and cycling.", image: "/images/getting-here.jpg", to: "/mobile/transport" },
  { id: "parking", title: "Parking", blurb: "Town-centre car parks and directions.", image: "/images/parking/mobile-hero.jpg", to: "/mobile/parking" },
];

// ─── Content / info pages ──────────────────────────────────────────────────────
export const aboutStats = [
  { label: "Population", value: "70K+" },
  { label: "Parks & Green Spaces", value: "45" },
  { label: "Annual Events", value: "20+" },
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
