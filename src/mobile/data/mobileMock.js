// ─── Mock content for the mobile-demo PWA screens ──────────────────────────────
// Coordinates reused from src/Data/content.js (verified Maidenhead locations).

export const featuredSpot = {
  eyebrow: "On the River",
  title: "Boulter's Lock & Ray Mill Island",
  blurb: "One of the most photographed stretches of the Thames — a perfect spot for a riverside walk.",
  image: "/images/card-lock.jpg",
  to: "/see-do/place/boulters-lock",
};

export const heroImage = "/images/card-bridge.jpg";

export const events = [
  {
    id: "e1",
    month: "MAY",
    day: "18",
    title: "Riverside Market",
    time: "Sunday 10:00 AM",
    location: "Riverside Promenade",
    category: "Food & Drink",
  },
  {
    id: "e2",
    month: "MAY",
    day: "25",
    title: "Live Music by the River",
    time: "Sunday 2:00 PM",
    location: "Boulter's Lock",
    category: "Music",
  },
  {
    id: "e3",
    month: "JUN",
    day: "01",
    title: "Maidenhead Carnival",
    time: "Sunday 11:00 AM",
    location: "Kaiser Permanente Park",
    category: "Family",
  },
  {
    id: "e4",
    month: "JUN",
    day: "08",
    title: "Jazz on the Terrace",
    time: "Saturday 7:00 PM",
    location: "Coppa Club",
    category: "Music",
  },
  {
    id: "e5",
    month: "JUN",
    day: "14",
    title: "Family Fun Day",
    time: "Sunday 12:00 PM",
    location: "Kidwells Park",
    category: "Family",
  },
  {
    id: "e6",
    month: "JUN",
    day: "21",
    title: "Street Food Festival",
    time: "Saturday 11:00 AM",
    location: "High Street",
    category: "Food & Drink",
  },
];

export const eventFilters = ["All", "Family", "Music", "Food & Drink"];

export const exploreLinks = [
  {
    id: "getting-here",
    title: "Getting Here",
    blurb: "Travel and transport info.",
    image: "/images/getting-here.jpg",
    to: "/getting-here",
  },
  {
    id: "visitor-info",
    title: "Visitor Information",
    blurb: "Essential visitor details.",
    image: "/images/card-taplow.jpg",
    to: "/getting-here",
  },
  {
    id: "business-directory",
    title: "Business Directory",
    blurb: "Find local businesses.",
    image: "/images/card-cafe.jpg",
    to: "/traders",
  },
];

export const aboutStats = [
  { label: "Population", value: "70K+" },
  { label: "Parks & Green Spaces", value: "45" },
  { label: "Annual Events", value: "20+" },
];

// Map pins — category-coloured, pulled from real verified Maidenhead coordinates.
export const mapPins = [
  { id: 1, name: "bakedd", category: "Eat & Drink", type: "eat-drink", lat: 51.522851, lng: -0.71774 },
  { id: 2, name: "Bombay Story", category: "Eat & Drink", type: "eat-drink", lat: 51.523680, lng: -0.717180 },
  { id: 3, name: "Coppa Club", category: "Eat & Drink", type: "eat-drink", lat: 51.521889, lng: -0.716051 },
  { id: 4, name: "Hall & Woodhouse", category: "Eat & Drink", type: "eat-drink", lat: 51.526859, lng: -0.700343 },
  { id: 5, name: "Boulter's Lock", category: "See & Do", type: "see-do", lat: 51.5261, lng: -0.7155 },
  { id: 6, name: "Norden Farm Centre", category: "See & Do", type: "see-do", lat: 51.5189, lng: -0.7242 },
  { id: 7, name: "Kidwells Park", category: "See & Do", type: "see-do", lat: 51.5224, lng: -0.7268 },
  { id: 8, name: "Nicholsons Shopping Centre", category: "Shop", type: "shop", lat: 51.52250, lng: -0.72080 },
  { id: 9, name: "Zara", category: "Shop", type: "shop", lat: 51.52265, lng: -0.71975 },
  { id: 10, name: "Waitrose", category: "Shop", type: "shop", lat: 51.52010, lng: -0.72230 },
  { id: 11, name: "Maidenhead Heritage Centre", category: "Attractions", type: "see-do", lat: 51.5212, lng: -0.7198 },
];

export const PIN_COLORS = {
  "eat-drink": "#52C7B6",
  "see-do": "#2FA4A4",
  shop: "#F2A65A",
  default: "#52C7B6",
};

export const MAP_CENTRE = { lat: 51.5225, lng: -0.7188 };
