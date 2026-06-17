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
    { label: "Our Story", href: "/about" },
    { label: "Work with Us", href: "/work-with-us" },
    { label: "Get the App", href: "/get-the-app" },
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
      primaryCta: { label: "Live", href: "/live" },
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
      href: "/see-do?category=community",
      image: "/images/ql-green.jpg", // riverside park
    },
    {
      label: "Wellness",
      href: "/see-do?category=sport-wellness",
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

// ─── Extra traders (TEMP load-test set) ───────────────────────────────────────
// ~40 real Maidenhead town-centre businesses added purely to preview how the
// homepage map + directory behave with ~50 pins (clustering, density, list).
// One placeholder picture each (picsum), no detail pages. Remove when done.
// Tuple: [name, category, section, lat, lng]
const extraTraders = [
  ["Costa Coffee", "Coffee Shop", "food-drink", 51.52210, -0.71880],
  ["Caffè Nero", "Coffee Shop", "food-drink", 51.52185, -0.71930],
  ["Starbucks", "Coffee Shop", "food-drink", 51.52240, -0.71990],
  ["Greggs", "Bakery", "food-drink", 51.52160, -0.71960],
  ["McDonald's", "Fast Food", "food-drink", 51.52090, -0.72050],
  ["Burger King", "Fast Food", "food-drink", 51.52050, -0.72110],
  ["KFC", "Fast Food", "food-drink", 51.52030, -0.72180],
  ["Subway", "Sandwiches", "food-drink", 51.52120, -0.72020],
  ["Pizza Express", "Italian", "food-drink", 51.52260, -0.71850],
  ["Prezzo", "Italian", "food-drink", 51.52280, -0.71910],
  ["Wagamama", "Asian", "food-drink", 51.52015, -0.72240],
  ["Bill's", "Restaurant", "food-drink", 51.52310, -0.71880],
  ["The Bear", "Pub", "food-drink", 51.52175, -0.71845],
  ["The Greyhound", "Pub", "food-drink", 51.52330, -0.71800],
  ["Boots", "Pharmacy", "health-beauty", 51.52195, -0.71905],
  ["Superdrug", "Health & Beauty", "health-beauty", 51.52150, -0.71930],
  ["Holland & Barrett", "Health Foods", "health-beauty", 51.52175, -0.71975],
  ["Specsavers", "Opticians", "health-beauty", 51.52205, -0.71955],
  ["Vision Express", "Opticians", "health-beauty", 51.52225, -0.71925],
  ["Toni & Guy", "Hair Salon", "health-beauty", 51.52145, -0.71990],
  ["Pure Gym", "Gym", "health-beauty", 51.52000, -0.72190],
  ["Nuffield Health", "Gym & Spa", "health-beauty", 51.51975, -0.72090],
  ["The Beauty Rooms", "Beauty Salon", "health-beauty", 51.52120, -0.72085],
  ["Marks & Spencer", "Department Store", "shopping", 51.52210, -0.71990],
  ["WHSmith", "Books & Stationery", "shopping", 51.52185, -0.72010],
  ["Waterstones", "Bookshop", "shopping", 51.52230, -0.71965],
  ["TK Maxx", "Fashion", "shopping", 51.52165, -0.72060],
  ["Card Factory", "Cards & Gifts", "shopping", 51.52150, -0.71910],
  ["The Body Shop", "Cosmetics", "shopping", 51.52200, -0.71945],
  ["Clarks", "Footwear", "shopping", 51.52175, -0.72035],
  ["Pandora", "Jewellery", "shopping", 51.52195, -0.71980],
  ["H Samuel", "Jewellery", "shopping", 51.52160, -0.71995],
  ["Mountain Warehouse", "Outdoor", "shopping", 51.52135, -0.72050],
  ["Sports Direct", "Sportswear", "shopping", 51.52110, -0.72095],
  ["Poundland", "Discount Store", "shopping", 51.52100, -0.72020],
  ["Trespass", "Outdoor", "shopping", 51.52125, -0.71930],
  ["Barclays", "Bank", "services", 51.52215, -0.71870],
  ["NatWest", "Bank", "services", 51.52190, -0.71855],
  ["Lloyds Bank", "Bank", "services", 51.52165, -0.71865],
  ["HSBC", "Bank", "services", 51.52235, -0.71840],
  ["Santander", "Bank", "services", 51.52145, -0.71880],
  ["Post Office", "Postal Services", "services", 51.52125, -0.71840],
  ["Timpson", "Key Cutting & Repairs", "services", 51.52105, -0.71905],
  ["Maidenhead Library", "Library", "services", 51.52055, -0.71810],
  // Batch 2 — added for 100-pin density test
  ["Flavio's", "Café & Restaurant", "food-drink", 51.52260, -0.71950],
  ["The Maiden's Head", "Pub", "food-drink", 51.52295, -0.71830],
  ["Knead Pizza", "Pizza", "food-drink", 51.52320, -0.71865],
  ["A Hoppy Place", "Craft Beer Bar", "food-drink", 51.52345, -0.71900],
  ["Sushi Point", "Sushi", "food-drink", 51.52370, -0.71870],
  ["IRO Sushi", "Sushi", "food-drink", 51.52135, -0.71960],
  ["German Doner Kebab", "Fast Food", "food-drink", 51.52080, -0.72000],
  ["Sauce and Flour", "Pasta", "food-drink", 51.52290, -0.71980],
  ["Kokoro", "Asian Kitchen", "food-drink", 51.52060, -0.72130],
  ["Noodle Nation", "Noodles", "food-drink", 51.52040, -0.72070],
  ["Presto Pizza", "Pizza", "food-drink", 51.52355, -0.71940],
  ["Yao Thai Supermarket", "Asian Grocery", "shopping", 51.52380, -0.71960],
  ["Grape Tree", "Health Foods", "shopping", 51.52100, -0.71940],
  ["Ginco Foods", "Specialty Grocery", "shopping", 51.52070, -0.71970],
  ["Next", "Fashion", "shopping", 51.52240, -0.72050],
  ["New Look", "Fashion", "shopping", 51.52255, -0.72030],
  ["River Island", "Fashion", "shopping", 51.52270, -0.72010],
  ["JD Sports", "Sportswear", "shopping", 51.52250, -0.72080],
  ["Primark", "Fashion", "shopping", 51.52230, -0.72100],
  ["Argos", "General Retail", "shopping", 51.52215, -0.72070],
  ["Robert Dyas", "Hardware & Home", "shopping", 51.52200, -0.72055],
  ["Currys", "Electronics", "shopping", 51.52185, -0.72090],
  ["Phones 4u", "Mobile Phones", "shopping", 51.52170, -0.72110],
  ["Three Mobile", "Telecoms", "shopping", 51.52155, -0.72130],
  ["EE", "Telecoms", "shopping", 51.52140, -0.72150],
  ["Vodafone", "Telecoms", "shopping", 51.52125, -0.72170],
  ["O2", "Telecoms", "shopping", 51.52110, -0.72140],
  ["Craft Coop", "Arts & Crafts", "shopping", 51.52325, -0.71935],
  ["Kingdom of Sweets", "Confectionery", "shopping", 51.52308, -0.71915],
  ["WHSmith", "Books & News", "shopping", 51.52340, -0.71955],
  ["Snappy Snaps", "Photography", "services", 51.52090, -0.71980],
  ["Halifax", "Bank", "services", 51.52245, -0.71835],
  ["TSB", "Bank", "services", 51.52260, -0.71815],
  ["Metro Bank", "Bank", "services", 51.52275, -0.71800],
  ["Co-op", "Convenience Store", "shopping", 51.52365, -0.72005],
  ["Tesco Express", "Supermarket", "shopping", 51.52060, -0.72150],
  ["Lidl", "Supermarket", "shopping", 51.51990, -0.72300],
  ["Aldi", "Supermarket", "shopping", 51.51975, -0.72270],
  ["Waitrose", "Supermarket", "shopping", 51.52010, -0.72230],
  ["Anytime Fitness", "Gym", "health-beauty", 51.52380, -0.72020],
  ["Salon 54", "Hair Salon", "health-beauty", 51.52350, -0.71980],
  ["Regis", "Hair Salon", "health-beauty", 51.52135, -0.72010],
  ["Nail & Co", "Nail Salon", "health-beauty", 51.52115, -0.71955],
  ["Zara", "Fashion", "shopping", 51.52265, -0.71975],
  ["Peacocks", "Fashion", "shopping", 51.52280, -0.72000],
  ["Deichmann", "Footwear", "shopping", 51.52180, -0.71960],
  ["Cancer Research UK", "Charity Shop", "shopping", 51.52075, -0.71940],
  ["Oxfam", "Charity Shop", "shopping", 51.52095, -0.71960],
];

const extraBrands = extraTraders.map(([name, category, section, lat, lng], i) => ({
  id: 100 + i,
  name,
  category,
  section,
  logo: `https://picsum.photos/seed/mh${100 + i}/240/240`,
  lat,
  lng,
}));

// ─── BrandGrid ────────────────────────────────────────────────────────────────
export const brandGrid = {
  eyebrow: "Curated for Work and Wellbeing",
  heading: "Our Traders",
  subheading:
    "A vibrant collection of shops, restaurants, and services — all surrounded by green spaces and riverside tranquility.",
  ctas: [
    { label: "Browse Eat & Drink", href: "/eat-drink" },
    { label: "Browse Shops", href: "/shop" },
  ],
  brands: [
    // Coordinates verified from live postcodes via postcodes.io (June 2026)
    { id: 1, name: "bakedd", category: "Bakery", section: "food-drink", logo: "/images/logos/bakedd.png", to: "/eat-drink/place/bakedd", address: "1a High Street, Maidenhead SL6 1JN", lat: 51.522851, lng: -0.71774 },
    { id: 2, name: "Bombay Story", category: "Indian Kitchen", section: "food-drink", logo: "/images/logos/bombay.png", to: "/eat-drink/place/bombay-story", address: "The Colonnade, Waterside Quarter, Maidenhead SL6 1QG", lat: 51.523680, lng: -0.717180 },
    { id: 3, name: "Cocoba", category: "Chocolate Café", section: "food-drink", logo: "/images/logos/cocoba.jpg", to: "/eat-drink/place/cocoba", address: "2B High Street, Waterside Quarter, Maidenhead SL6 1QJ", lat: 51.523201, lng: -0.7176 },
    { id: 4, name: "Coppa Club", category: "Restaurant & Bar", section: "food-drink", logo: "/images/logos/coppa-club.png", to: "/eat-drink/place/coppa-club", address: "The Arches, Bridge Avenue, Maidenhead SL6 1RR", lat: 51.521889, lng: -0.716051 },
    { id: 5, name: "El Cerdo", category: "Tapas Bar", section: "food-drink", logo: "/images/logos/el-cerdo.png", to: "/eat-drink/place/el-cerdo", address: "The Colonnade, Waterside Quarter, Maidenhead SL6 1QG", lat: 51.523480, lng: -0.717620 },
    { id: 6, name: "Nando's", category: "Flame-Grilled", section: "food-drink", logo: "/images/logos/nandos.png", to: "/eat-drink?category=restaurants", address: "57 King Street, Maidenhead SL6 1JR", lat: 51.520859, lng: -0.722249 },
    { id: 7, name: "Pret A Manger", category: "Coffee & Food", section: "food-drink", logo: "/images/logos/pret.png", to: "/eat-drink/place/pret-a-manger", address: "Unit D, 7 Garden Boulevard, Maidenhead SL6 1QQ", lat: 51.520813, lng: -0.721299 },
    { id: 8, name: "Hall & Woodhouse", category: "Pub & Kitchen", section: "food-drink", logo: "/images/logos/hall-woodhouse.jpg", to: "/eat-drink/place/hall-woodhouse", address: "Mill Lane, Taplow, Maidenhead SL6 0AA", lat: 51.526859, lng: -0.700343 },
    ...extraBrands,
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
  blurb: "Maidenhead is a vibrant riverside town, where history, community and opportunity come together.",
  columns: [
    {
      heading: "Visit",
      links: [
        { label: "Getting Here",   href: "/getting-here" },
        { label: "Parking",        href: "/getting-here#parking" },
        { label: "Accessibility",  href: "/getting-here#accessibility" },
        { label: "Opening Hours",  href: "/getting-here#opening-hours" },
      ],
    },
    {
      heading: "Discover",
      links: [
        { label: "Eat & Drink", href: "/eat-drink" },
        { label: "Shop",        href: "/shop" },
        { label: "See & Do",    href: "/see-do" },
        { label: "Events",      href: "/see-do?category=events" },
      ],
    },
    {
      heading: "About",
      links: [
        { label: "Our Story",    href: "/about" },
        { label: "Traders",      href: "/traders" },
        { label: "Work With Us", href: "/work-with-us" },
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
