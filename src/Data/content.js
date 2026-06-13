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
    { label: "Live", href: "#live" },
    { label: "Work", href: "/work" },
    { label: "Explore", href: "#explore" },
  ],
  utilityLinks: [
    { label: "Maps", href: "/getting-here#maps" },
    { label: "Get the App", href: "#app" },
    { label: "Newsletter", href: "/#newsletter" },
  ],
};

// ─── Hero Slider ─────────────────────────────────────────────────────────────
export const hero = {
  autoplayInterval: 3800, // ms between slides
  slides: [
    {
      // Maidenhead Bridge over the Thames — © Wikimedia Commons (CC BY-SA)
      imageSrc: "/images/slide-bridge.jpg",
      imagePosition: "center 62%",
      imageAlt: "Maidenhead Bridge spanning the River Thames",
      eyebrow: "Welcome to",
      headline: "Maidenhead",
      subheadline:
        "A fast-growing riverside town set on the banks of the Thames, with excellent Elizabeth Line links into central London.",
      primaryCta: { label: "Explore What's On", href: "/see-do" },
      secondaryCta: { label: "Plan Your Visit", href: "/getting-here" },
      featureCard: {
        image: "/images/card-lock.jpg",
        label: "On the River",
        title: "Boulter's Lock & Ray Mill Island",
        cta: { label: "Find Out More", to: "/attraction/boulters-lock" },
      },
    },
    {
      // Maidenhead regeneration — El Cerdo / Chapel Arches waterfront development
      imageSrc: "/images/slide-river.jpg",
      imagePosition: "center 55%",
      imageAlt: "Maidenhead's regenerated waterfront with restaurants and modern apartments",
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
    {
      // H&W Taplow — riverside restaurant & terrace on the Thames near Maidenhead
      imageSrc: "/images/slide-cafe.jpg",
      imagePosition: "center 50%",
      imageAlt: "H&W Taplow riverside restaurant terrace on the Thames",
      eyebrow: "Eat · Drink · Relax",
      headline: "Waterfront Dining",
      subheadline:
        "From riverside terraces to independent restaurants — soak up the Thames views with great food and drink to match.",
      primaryCta: { label: "Eat & Drink", href: "/eat-drink" },
      secondaryCta: { label: "Plan Your Visit", href: "/getting-here" },
      featureCard: {
        image: "/images/card-taplow.jpg",
        label: "Featured Venue",
        title: "H&W Taplow — Thames Terrace",
        cta: { label: "Discover More", to: "/attraction/hw-taplow" },
      },
    },
  ],
};

// ─── QuickLinks ───────────────────────────────────────────────────────────────
export const quickLinks = {
  eyebrow: "Find Your Way Around",
  heading: "Explore Maidenhead",
  items: [
    {
      label: "Eat & Drink",
      href: "/eat-drink",
      image: "/images/ql-food.jpg", // restaurant table — swap for a real Maidenhead venue later
    },
    {
      label: "Shop",
      href: "/shop",
      image: "/images/ql-shop.jpg", // high-street boutique
    },
    {
      label: "See & Do",
      href: "/see-do",
      image: "/images/ql-see.jpg", // theatre / live performance
    },
    {
      label: "Green Spaces",
      href: "/see-do/category/community",
      image: "/images/ql-green.jpg", // riverside park
    },
    {
      label: "Wellness",
      href: "/see-do/category/sport-wellness",
      image: "/images/ql-wellness.jpg", // padel court / active wellness
    },
    {
      label: "Getting Here",
      href: "/getting-here",
      image: "/images/ql-transport.jpg", // railway station platform
    },
  ],
};

// ─── PlanVisit (Getting Here — bottom practical-info section) ──────────────────
export const planVisit = {
  eyebrow: "Plan Your Visit",
  heading: "Getting Here & Good to Know",
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
  heading: "In the Spotlight",
  cta: { label: "See All Stories", href: "/news" },
  posts: [
    {
      id: 1,
      category: "COCOBA · Offer",
      title: "End of Season Sale — While Stocks Last",
      excerpt:
        "Stock up on handcrafted COCOBA chocolates at reduced prices — a perfect chance to discover new favourites or pick up a gift.",
      imageSrc: "/images/cocoba/truffles.jpg",
      imageAlt: "COCOBA handcrafted chocolates",
      href: "/news/cocoba-end-of-season-sale",
      date: "While stocks last",
    },
    {
      id: 2,
      category: "Coppa Club · Offer",
      title: "Champagne & Sparkling Tasting Evening",
      excerpt:
        "An evening led by Coppa Club's in-house expert, exploring Champagne alongside a curated selection of sparkling wines.",
      imageSrc: "/images/coppa/champagne.jpg",
      imageAlt: "Champagne tasting at Coppa Club",
      href: "/news/coppa-champagne-tasting",
      date: "Monthly · 6:30pm",
    },
    {
      id: 3,
      category: "COCOBA · Featured",
      title: "Meet the Hot Chocolate Bombes",
      excerpt:
        "Drop one into warm milk and watch it melt into a rich, real-chocolate hot drink — one of COCOBA's signature treats.",
      imageSrc: "/images/cocoba/bombes.jpg",
      imageAlt: "COCOBA hot chocolate bombes",
      href: "/news/cocoba-hot-chocolate-bombes",
      date: "All year round",
    },
  ],
};

// ─── EventsGrid ───────────────────────────────────────────────────────────────
export const eventsGrid = {
  eyebrow: "Upcoming",
  heading: "What's On",
  cta: { label: "View full calendar", href: "/see-do/category/events" },
  events: [
    {
      id: 1,
      date: "SAT 22 NOV",
      time: "10am – 4pm",
      title: "Winter Makers Market",
      location: "The Green",
      tag: "Market",
      image: "/images/events/market.jpg",
      href: "/see-do/category/events",
    },
    {
      id: 2,
      date: "FRI 28 NOV",
      time: "6pm – 9pm",
      title: "Late-Night Shopping Eve",
      location: "All Shops",
      tag: "Shopping",
      image: "/images/events/shopping.jpg",
      href: "/see-do/category/events",
    },
    {
      id: 3,
      date: "SAT 29 NOV",
      time: "2pm – 5pm",
      title: "Kids' Christmas Craft Workshop",
      location: "Community Room",
      tag: "Family",
      image: "/images/events/family.jpg",
      href: "/see-do/category/events",
    },
    {
      id: 4,
      date: "SUN 30 NOV",
      time: "12pm – 3pm",
      title: "Live Jazz Brunch",
      location: "The Atrium",
      tag: "Music",
      image: "/images/events/music.jpg",
      href: "/see-do/category/events",
    },
    {
      id: 5,
      date: "SAT 6 DEC",
      time: "11am – 7pm",
      title: "Independent Designers Pop-Up",
      location: "Upper Mall",
      tag: "Shopping",
      image: "/images/events/popup.jpg",
      href: "/see-do/category/events",
    },
    {
      id: 6,
      date: "SUN 7 DEC",
      time: "3pm – 5pm",
      title: "Carol Singing on the Green",
      location: "The Green",
      tag: "Festive",
      image: "/images/events/festive.jpg",
      href: "/see-do/category/events",
    },
  ],
};

// ─── BrandGrid ────────────────────────────────────────────────────────────────
export const brandGrid = {
  eyebrow: "Independent at Heart",
  heading: "Our Traders",
  subheading:
    "Over 80 independent shops, restaurants, and services — all in one place.",
  cta: { label: "Browse All Traders", href: "/eat-drink" },
  brands: [
    { id: 1, name: "bakedd", category: "Bakery", logo: "/images/logos/bakedd.png", to: "/eat-drink/place/bakedd" },
    { id: 2, name: "Bombay Story", category: "Indian Kitchen", logo: "/images/logos/bombay.png", to: "/eat-drink/place/bombay-story" },
    { id: 3, name: "Cocoba", category: "Chocolate Café", logo: "/images/logos/cocoba.jpg", to: "/eat-drink/place/cocoba" },
    { id: 4, name: "Coppa Club", category: "Restaurant & Bar", logo: "/images/logos/coppa-club.png", to: "/eat-drink/place/coppa-club" },
    { id: 5, name: "El Cerdo", category: "Tapas Bar", logo: "/images/logos/el-cerdo.png", to: "/eat-drink/place/el-cerdo" },
    { id: 6, name: "Nando's", category: "Flame-Grilled", logo: "/images/logos/nandos.png", to: "/eat-drink/category/restaurants" },
    { id: 7, name: "Pret A Manger", category: "Coffee & Food", logo: "/images/logos/pret.png", to: "/eat-drink/place/pret-a-manger" },
    { id: 8, name: "Hall & Woodhouse", category: "Pub & Kitchen", logo: "/images/logos/hall-woodhouse.jpg", to: "/eat-drink/place/hall-woodhouse" },
  ],
};

// ─── FeatureBlocks ────────────────────────────────────────────────────────────
export const featureBlocks = {
  blocks: [
    {
      id: 1,
      eyebrow: "Eat & Drink",
      heading: "Thirty Places to Eat. Zero Chains.",
      body: "From third-wave coffee and wood-fired sourdough to small-plates wine bars and proper Sunday roasts — every single one independently owned.",
      cta: { label: "Explore Eat & Drink", href: "/eat-drink" },
      // TODO: replace with actual Maidenhead restaurant / dining scene
      imageSrc: "https://picsum.photos/id/493/800/600",
      imageAlt: "Restaurants and cafes at Maidenhead",
      imageLeft: false,
    },
    {
      id: 2,
      eyebrow: "The Green",
      heading: "A Park at the Heart of It All",
      body: "Two acres of managed green space, a weekend farmers' market, and a summer events programme that runs June through September.",
      cta: { label: "See What's On the Green", href: "/see-do" },
      // TODO: replace with actual Thames riverside / Maidenhead waterfront photo
      imageSrc: "https://picsum.photos/id/1002/800/600",
      imageAlt: "The Green park at Maidenhead",
      imageLeft: true,
    },
  ],
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
  logo: "MAIDENHEAD",
  tagline: "Your urban village.",
  columns: [
    {
      heading: "Visit",
      links: [
        { label: "Getting Here", href: "/getting-here" },
        { label: "Parking", href: "/getting-here#parking" },
        { label: "Accessibility", href: "/getting-here#accessibility" },
        { label: "Opening Hours", href: "/getting-here#opening-hours" },
      ],
    },
    {
      heading: "Discover",
      links: [
        { label: "Eat & Drink", href: "/eat-drink" },
        { label: "Shop", href: "/shop" },
        { label: "See & Do", href: "/see-do" },
        { label: "Events", href: "/see-do/category/events" },
      ],
    },
    {
      heading: "About",
      links: [
        { label: "Our Story", href: "/about" },
        { label: "Traders", href: "/eat-drink" },
        { label: "Work With Us", href: "/work" },
        { label: "Press", href: "/press" },
      ],
    },
  ],
  social: [
    { label: "Instagram", href: "https://www.instagram.com" },
    { label: "Facebook", href: "https://www.facebook.com" },
    { label: "X / Twitter", href: "https://x.com" },
  ],
  legal: "© 2025 Maidenhead. All rights reserved.",
};
