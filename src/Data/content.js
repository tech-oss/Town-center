
// ─── Header ──────────────────────────────────────────────────────────────────
export const header = {
  logo: "MAIDENHEAD",                  // wordmark text
  markSrc: "/logo-mark.svg",           // the "M" symbol (transparent, teal)
  tagline: "Riverside. Connected. Thriving.",
  logoSrc: "/logo.svg",                // full vector lockup (used by Footer)
  logoAlt: "Maidenhead",
  navItems: [
    { label: "See & Do", href: "#see-do" },
    { label: "Eat & Drink", href: "#eat-drink" },
    { label: "Shop", href: "#shop" },
    { label: "Services", href: "#services" },
    { label: "Offers", href: "/offers" },
    { label: "Live & Stay", href: "#live" },
    { label: "Work", href: "/work" },
    { label: "Explore", href: "#explore" },
  ],
  utilityLinks: [
    { label: "Our Story", href: "/about" },
    { label: "Work with Us", href: "/work-with-us" },
    { label: "Get The Maidenhead App", href: "/get-the-app" },
  ],
};

// ─── Hero (static) ──────────────────────────────────────────────────────────
export const hero = {
  slides: [
    {
      // Maidenhead regeneration — El Cerdo / Chapel Arches waterfront development
      imageSrc: "/images/slide-river.jpg",
      imagePosition: "center 55%",
      imageAlt: "Maidenhead's regenerated waterfront with restaurants and modern properties",
      eyebrow: "Live · Work · Explore",
      headline: "A Town Reborn",
      subheadline:
        "Modern waterfront living, independent restaurants and vibrant new spaces reshaping the town centre.",
      primaryCta: { label: "See & Do", href: "/see-do" },
      secondaryCta: { label: "Browse Shops", href: "/shop" },
      featureCard: {
        image: "/images/card-cafe.jpg",
        label: "Eat & Drink",
        title: "Waterfront Dining & Bars",
        cta: { label: "See All Restaurants", to: "/attraction/waterfront-dining" },
      },
    },
  ],
};

// ─── QuickLinks ───────────────────────────────────────────────────────────────
export const quickLinks = {
  eyebrow: "Find Your Way Around",
  heading: "EXPLORE",
  intro:
    "A vibrant riverside destination where historic charm meets contemporary living. Stroll along the Thames, browse independent shops and boutiques, relax in welcoming cafés and artisan coffee shops, enjoy waterside dining, and unwind in stylish bars. Family-friendly attractions and beautiful green spaces to world-renowned Michelin-starred restaurants just minutes away, there's something for every visitor to enjoy.",
  items: [
    {
      label: "Eat & Drink",
      href: "/eat-drink",
      image: "/images/ql-food.jpg", // poster fallback while the video loads
      video: "/videos/eat-drink.mp4", // 720×1280 portrait loop
    },
    {
      label: "Shop",
      href: "/shop",
      image: "/images/ql-shop.jpg", // poster fallback while the video loads
      video: "/videos/shops.mp4", // 720×1280 portrait loop
    },
    {
      label: "See & Do",
      href: "/see-do",
      image: "/images/ql-see.jpg", // poster fallback while the video loads
      video: "/videos/see-do.mp4", // 720×1280 portrait loop
    },
    {
      label: "Green Spaces",
      href: "/see-do?category=community",
      image: "/images/ql-green.jpg", // poster fallback while the video loads
      video: "/videos/boats.mp4", // 720×1280 portrait loop
    },
    {
      label: "Wellness",
      href: "/see-do?category=sport-wellness",
      image: "/images/ql-wellness.jpg", // poster fallback while the video loads
      video: "/videos/wellness.mp4", // 720×1280 portrait loop
    },
    {
      label: "Getting Here",
      href: "/getting-here",
      image: "/images/ql-transport.jpg", // poster fallback while the video loads
      video: "/videos/getting-here.mp4", // 720×1280 portrait loop
    },
  ],
};

// ─── PlanVisit (Getting Here — bottom practical-info section) ──────────────────
export const planVisit = {
  eyebrow: "Plan Your Visit",
  heading: "GETTING HERE & GOOD TO KNOW",
  intro:
    "By rail, road, bus or bicycle, getting to and around Maidenhead is easy.",
  // Live 7-day forecast for Maidenhead (lat/lon used by the weather widget)
  weather: {
    label: "Maidenhead",
    latitude: 51.5217,
    longitude: -0.7177,
  },
  getAround: {
    image: "/images/getting-here.jpg",
    imageAlt: "Elizabeth Line train at Maidenhead station at dusk",
    options: [
      {
        id: "parking",
        title: "Parking",
        subtitle: "Car parks, Blue Badge bays & rates",
        href: "/getting-here#parking",
      },
      {
        id: "transport",
        title: "Transport",
        subtitle: "Elizabeth Line, GWR, buses & cycle routes",
        href: "/getting-here#transport",
      },
      {
        id: "maps",
        title: "Maps",
        subtitle: "Find your way around the town centre",
        href: "/getting-here#maps",
      },
    ],
  },
};

// ─── BlogCards ────────────────────────────────────────────────────────────────
export const blogCards = {
  eyebrow: "From the Journal",
  heading: "IN THE SPOTLIGHT",
  cta: { label: "See All Stories", href: "/offers" },
  // Demo spotlight posts removed: the homepage shows admin's own picks.
  posts: [],
};

// ~40 real Maidenhead town-centre businesses added purely to preview how the
// homepage map + directory behave with ~50 pins (clustering, density, list).
// One placeholder picture each (picsum), no detail pages. Remove when done.
// Tuple: [name, category, section, lat, lng]



// ─── BrandGrid ────────────────────────────────────────────────────────────────
export const brandGrid = {
  eyebrow: "Curated for Work and Wellbeing",
  heading: "OUR TRADERS",
  subheading:
    "A vibrant collection of shops, restaurants, and services — all surrounded by green spaces and riverside tranquility.",
  ctas: [
    { label: "Browse Eat & Drink", href: "/eat-drink" },
    { label: "Browse Shops", href: "/shop" },
  ],
  // Demo traders removed: the map shows registered businesses with a location.
  brands: [],
};

// ─── Newsletter ───────────────────────────────────────────────────────────────
export const newsletter = {
  eyebrow: "Newsletter",
  heading: "Stay in the Loop",
  body: "Get the weekly round-up: new openings, events, offers, and stories.",
  placeholder: "Your email address",
  buttonLabel: "Subscribe",
  disclaimer: "No spam. Unsubscribe any time.",
};

// ─── Newsletter Modal (auto-open popup) ───────────────────────────────────────
export const newsletterModal = {
  openDelay: 1200, // ms after load before the modal opens
  heading: "Sign up to our newsletter",
  subtext:
    "Sign up for email updates to hear about events, news and offers in Maidenhead.",
  fields: {
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email Address",
  },
  visitReason: {
    label: "Why do you visit Maidenhead?",
    options: [
      "I live here",
      "I work here",
      "I visit",
      "I live and work here",
    ],
  },
  hearAbout: {
    label: "How did you hear about us?",
    options: [
      "Search engine",
      "Social media",
      "Friend or family",
      "Local press",
      "Other",
    ],
  },
  consent:
    "I agree to receive news, updates and relevant offers from Maidenhead. You can unsubscribe at any time.",
  buttonLabel: "Sign Up",
  privacyNote: "We care about your data. Read our",
  privacyLinkLabel: "Privacy Policy",
  privacyLinkHref: "#privacy",
  success:
    "🎉 You're successfully subscribed! Thanks for joining — keep an eye on your inbox for the latest from Maidenhead.",
};

// ─── Footer ───────────────────────────────────────────────────────────────────
export const footer = {
  blurb: "Maidenhead is a vibrant riverside town, where history, community and opportunity come together.",
  columns: [
    {
      heading: "About",
      links: [
        { label: "Our Story",    href: "/about" },
        { label: "Traders",      href: "/traders" },
        { label: "Work With Us", href: "/work-with-us" },
      ],
    },
    {
      heading: "Legal",
      links: [
        { label: "Privacy Policy",       href: "/privacy" },
        { label: "Terms & Conditions",   href: "/terms" },
      ],
    },
  ],
  social: [
    { label: "Instagram", icon: "instagram", href: "https://www.instagram.com" },
    { label: "Facebook",  icon: "facebook",  href: "https://www.facebook.com" },
    { label: "X",         icon: "x",         href: "https://x.com" },
    { label: "LinkedIn",  icon: "linkedin",   href: "https://www.linkedin.com" },
  ],
  app: {
    heading: "Get the Maidenhead App",
    body: "Your guide to everything in Maidenhead.",
  },
  legal: "© 2025 Maidenhead. All rights reserved.",
};
