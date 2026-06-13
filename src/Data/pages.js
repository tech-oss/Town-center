// ════════════════════════════════════════════════════════════════════════════
//  Directory data for the Shop / Eat & Drink / See & Do sections.
//
//  Structure mirrors Canary Wharf's site:
//   • Each SECTION has a dropdown menu (columns of links) + a landing page.
//   • Categories filter the section's item pool.
//   • Every item has its own detail (sub) page.
//
//  All pages share ONE layout each (CategoryPage / DetailPage) — only the
//  content here differs. Add/replace dummy content freely.
//
//  Routes:
//   /:section                     → landing (all items in section)
//   /:section/category/:category  → category-filtered listing
//   /:section/place/:slug         → item detail page
// ════════════════════════════════════════════════════════════════════════════

// Stable dummy image per slug (replace with real assets later)
const img = (seed) => `https://picsum.photos/seed/${seed}/900/650`;

// Shared dummy detail content so every sub-page is fully populated
const HOURS = [
  { day: "Monday – Friday", time: "9am – 8pm" },
  { day: "Saturday", time: "9am – 7pm" },
  { day: "Sunday", time: "11am – 5pm" },
];

// Per-business News & Offers (unique to each item, styled like "In the Spotlight").
// Every article has its own sub-page at /news/:slug.
function newsFor(slug, name) {
  return [
    {
      id: `${slug}-offer`,
      slug: `${slug}-offer`,
      category: "Offer",
      date: "This week",
      title: `Exclusive: 20% off at ${name}`,
      excerpt: `For a limited time, enjoy 20% off when you show the Maidenhead app in store at ${name}. Don't miss out — offer ends Sunday.`,
      image: img(slug + "-news1"),
      body: [
        `For a limited time only, ${name} is offering 20% off to everyone who shows the Maidenhead app in store. It's our way of saying thank you for shopping local and supporting the town centre.`,
        `Simply open the app at the till to redeem. The offer runs until Sunday and can't be combined with other promotions, but there's no minimum spend — so whether you're treating yourself or stocking up, there's never been a better time to visit.`,
      ],
    },
    {
      id: `${slug}-news`,
      slug: `${slug}-news`,
      category: "News",
      date: "3 days ago",
      title: `${name} unveils a fresh new look`,
      excerpt: `${name} has just completed a stylish refit — pop in to see the new space and discover what's changed this season.`,
      image: img(slug + "-news2"),
      body: [
        `${name} has just completed a stylish refit, and the doors are now open. The refreshed space has been thoughtfully redesigned to make every visit more comfortable and welcoming.`,
        `Pop in to explore what's changed this season and see the new look for yourself. The team can't wait to show you around.`,
      ],
    },
    {
      id: `${slug}-event`,
      slug: `${slug}-event`,
      category: "What's On",
      date: "Next Saturday",
      title: `Meet the team at ${name}`,
      excerpt: `Join us for a relaxed in-store event with tastings, demos and a few surprises. All welcome — no booking needed.`,
      image: img(slug + "-news3"),
      body: [
        `Join us next Saturday for a relaxed in-store event at ${name}. Expect tastings, live demos and a few surprises along the way.`,
        `It's free to attend and there's no need to book — just drop in any time during the day. All welcome.`,
      ],
    },
  ];
}

// Real News & Offers for Coppa Club, Maidenhead (sub-pages at /news/:slug)
const coppaNews = [
  {
    id: "coppa-cocktail-masterclass",
    slug: "coppa-cocktail-masterclass",
    category: "What's On",
    date: "Monthly · 7pm",
    title: "Shake, Stir & Sip: Cocktail Masterclass",
    excerpt:
      "A hands-on cocktail masterclass led by our in-house bartenders — learn to shake, stir and sip your way through Coppa Club's signature serves.",
    image: "/images/coppa/cocktail.jpg",
    body: [
      "Ever wanted to mix like a pro? Join our in-house bartenders for Shake, Stir & Sip — a hands-on cocktail masterclass at Coppa Club Maidenhead. Over the course of the evening you'll learn the techniques behind some of our most-loved serves, from balancing flavours to the all-important garnish.",
      "You'll get to shake, stir and, of course, sip your way through a selection of cocktails, with expert tips and plenty of good company along the way. It's the perfect night out with friends, a relaxed date, or a different kind of celebration.",
      "Places are limited and booking is recommended. Get in touch with the team to reserve your spot.",
    ],
  },
  {
    id: "coppa-champagne-tasting",
    slug: "coppa-champagne-tasting",
    category: "Offer",
    date: "Monthly · 6:30pm",
    title: "Champagne & Sparkling Tasting Evening",
    excerpt:
      "An evening led by our in-house expert, exploring Champagne alongside a curated selection of sparkling wines.",
    image: "/images/coppa/champagne.jpg",
    body: [
      "Raise a glass at Coppa Club Maidenhead with our Champagne & Sparkling Tasting Evening. Led by our in-house expert, you'll explore the world of Champagne alongside a curated selection of sparkling wines from around the world.",
      "Along the way you'll discover what gives each its character, how they're made, and which food pairings bring out the best in every glass — all served with a few light bites to keep you going.",
      "Whether you're a seasoned sipper or simply Champagne-curious, it's a relaxed and refined way to spend an evening. Booking is recommended as places fill quickly.",
    ],
  },
  {
    id: "coppa-wreath-making",
    slug: "coppa-wreath-making",
    category: "What's On",
    date: "Seasonal · Autumn & Winter",
    title: "Wreath-Making Workshop",
    excerpt:
      "A relaxed wreath-making session, complete with all materials provided and a complimentary drink to sip while you create.",
    image: "/images/coppa/wreath.jpg",
    body: [
      "Get creative this season at Coppa Club Maidenhead with our Wreath-Making Workshop. In a relaxed, friendly setting, you'll craft your own seasonal wreath to take home — and a complimentary drink is included to sip while you create.",
      "All materials are provided, along with plenty of foliage, ribbons and finishing touches, so there's nothing to bring but yourself. Our host will guide you through each step, whether it's your first wreath or your fifth.",
      "It makes a lovely afternoon out with friends or a thoughtful gift experience. Spaces are limited, so please book ahead.",
    ],
  },
];

// Real News & Offers for COCOBA Chocolate Café, Maidenhead (sub-pages at /news/:slug)
const cocobaNews = [
  {
    id: "cocoba-end-of-season-sale",
    slug: "cocoba-end-of-season-sale",
    category: "Offer",
    date: "While stocks last",
    title: "End of Season Sale — While Stocks Last",
    excerpt: "Stock up on handcrafted COCOBA chocolates at reduced prices — a perfect chance to discover new favourites or pick up a gift.",
    image: "/images/cocoba/truffles.jpg",
    body: [
      "There's never been a better time to treat yourself (or someone else) at COCOBA Maidenhead. Our End of Season Sale is now on in store, with a selection of handcrafted chocolates, gift boxes and seasonal treats available at reduced prices.",
      "Every piece is made with premium chocolate crafted at COCOBA's dedicated Kent chocolate factory, so it's a genuine chance to enjoy artisan quality for less.",
      "Stock is limited and selling fast — pop in to the café on the High Street while it lasts.",
    ],
  },
  {
    id: "cocoba-hot-chocolate-bombes",
    slug: "cocoba-hot-chocolate-bombes",
    category: "Featured",
    date: "All year round",
    title: "Meet the Hot Chocolate Bombes",
    excerpt: "Drop one into warm milk and watch it melt into a rich, real-chocolate hot drink — one of COCOBA's signature treats.",
    image: "/images/cocoba/bombes.jpg",
    body: [
      "If you haven't tried a COCOBA Hot Chocolate Bombe yet, you're in for something special. Drop one into a mug of warm milk and watch it melt away to reveal a rich, indulgent, real-chocolate hot drink.",
      "Available in a range of flavours and made with the same premium chocolate as everything else on our menu, they're a firm favourite with guests — and they make a lovely gift to take home, too.",
      "Ask the team in store to point you to the current flavours and bestsellers.",
    ],
  },
  {
    id: "cocoba-cafe-experience",
    slug: "cocoba-cafe-experience",
    category: "News",
    date: "Now open",
    title: "A Chocolate Café in the Heart of Maidenhead",
    excerpt: "From barista coffee and luxurious real-chocolate hot drinks to waffles, cakes and brunch — discover the full COCOBA café experience.",
    image: "/images/cocoba/storefront.jpg",
    body: [
      "Since opening in October 2024, COCOBA Maidenhead has become a much-loved spot for coffee and chocolate lovers alike. Owners Viv and Shashank have created a warm, welcoming café in the heart of the High Street.",
      "Alongside expertly prepared barista coffee and luxurious real-chocolate hot drinks, you'll find freshly made cakes, waffles, desserts, light lunches and brunch favourites — all served in a stylish, comfortable setting.",
      "Whether you're meeting friends, working, enjoying family time or simply treating yourself, there's always a reason to drop by.",
    ],
  },
];

function item(slug, name, section, category, tag, blurb) {
  return {
    slug,
    name,
    section,
    category,
    tag,
    image: img(slug),
    gallery: [img(slug), img(slug + "-2"), img(slug + "-3")],
    description:
      blurb ||
      `${name} is one of the many places that make Maidenhead town centre special. Drop in to discover what's on offer, from everyday essentials to something a little different — all just a short walk from the station and the riverside.`,
    hours: HOURS,
    address: "The Colonnade, High Street, Maidenhead SL6 1QJ",
    phone: "01628 000 000",
    website: "www.maidenhead.example",
    news: newsFor(slug, name),
  };
}

// ─── SHOP ──────────────────────────────────────────────────────────────────
const shopItems = [
  item("pandora", "Pandora", "shop", "accessories-jewellery", "Accessories & Jewellery"),
  item("watches-of-maidenhead", "Watches of Maidenhead", "shop", "accessories-jewellery", "Accessories & Jewellery"),
  item("zara", "Zara", "shop", "clothing", "Clothing"),
  item("m-s", "M&S", "shop", "clothing", "Clothing"),
  item("the-riverside-tailor", "The Riverside Tailor", "shop", "clothing", "Clothing"),
  item("currys", "Currys", "shop", "electronics-phones", "Electronics & Phones"),
  item("ee-store", "EE Store", "shop", "electronics-phones", "Electronics & Phones"),
  item("waitrose", "Waitrose", "shop", "groceries", "Groceries"),
  item("boots", "Boots", "shop", "health-beauty", "Health & Beauty"),
  item("the-body-co", "The Body Co.", "shop", "health-beauty", "Health & Beauty"),
  item("home-thames", "Home on the Thames", "shop", "home-furniture", "Home & Furniture"),
  item("sole-mate", "Sole Mate", "shop", "shoes-footwear", "Shoes & Footwear"),
  item("riverside-runners", "Riverside Runners", "shop", "sports-fitness", "Sports & Fitness"),
  // Services
  item("barclays", "Barclays", "shop", "banks", "Banks & Foreign Exchange"),
  item("little-acorns", "Little Acorns Childcare", "shop", "childcare", "Childcare"),
  item("quick-clean", "Quick Clean & Repair", "shop", "dry-cleaning", "Dry Cleaning & Shoe Repair"),
  item("the-cut-co", "The Cut Co.", "shop", "hairdressing", "Hairdressing & Beauty"),
  item("bupa", "Bupa Health Clinic", "shop", "healthcare", "Healthcare"),
  item("specsavers", "Specsavers", "shop", "opticians", "Opticians & Pharmacies"),
  item("serenity-spa", "Serenity Spa", "shop", "spa", "Spa"),
  item("thames-travel", "Thames Travel", "shop", "travel-agents", "Travel Agents"),
];

// ─── EAT & DRINK ─────────────────────────────────────────────────────────────
const eatItems = [
  {
    // ── Real content: Coppa Club, Maidenhead ──
    ...item("coppa-club", "Coppa Club", "eat-drink", "restaurants", "Restaurants"),
    image: "/images/coppa/hero.jpg",
    gallery: [
      "/images/coppa/hero.jpg",
      "/images/coppa/terrace.jpg",
      "/images/coppa/garden.jpg",
      "/images/coppa/bar.jpg",
      "/images/coppa/dining.jpg",
    ],
    description:
      "Located in the centre of Maidenhead overlooking the waterway, Coppa Club provides a welcoming space to relax and dine. Whether you're enjoying the garden room or meeting friends for drinks at the bar, you're welcome any time.",
    hours: [
      { day: "Monday – Thursday", time: "9am – 11pm" },
      { day: "Friday – Saturday", time: "9am – 11:30pm" },
      { day: "Sunday", time: "9am – 10pm" },
    ],
    address: "The Arches, 2 Bridge Avenue, Maidenhead SL6 1RR",
    mapQuery: "Coppa Club, Maidenhead SL6 1RR",
    phone: "01628 951108",
    email: "maidenhead@coppaclub.co.uk",
    social: {
      instagram: "https://www.instagram.com/coppaclub",
      facebook: "https://www.facebook.com/share/1BYPndXk8G/?mibextid=wwXIfr",
      // X / Twitter not available for Coppa Club
      whatsappPhone: "441628951108",
    },
    website: "www.coppaclub.co.uk/maidenhead",
    news: coppaNews,
  },
  item("el-cerdo", "El Cerdo Tapas & Bar", "eat-drink", "restaurants", "Restaurants"),
  item("bombay-story", "Bombay Story", "eat-drink", "indian", "Indian"),
  item("the-lock-bar", "The Lock Bar", "eat-drink", "bars", "Bars"),
  item("riverside-tap", "Riverside Tap", "eat-drink", "bars", "Bars"),
  {
    // ── Real content: COCOBA Chocolate Café, Maidenhead ──
    ...item("cocoba", "COCOBA Chocolate Café", "eat-drink", "cafes", "Cafés"),
    image: "/images/cocoba/storefront.jpg",
    gallery: [
      "/images/cocoba/storefront.jpg",
      "/images/cocoba/dessert.jpg",
      "/images/cocoba/interior.jpg",
    ],
    paragraphs: [
      "Nestled in the heart of Maidenhead, COCOBA Chocolate Café is more than just a coffee shop—it's a destination for chocolate lovers, coffee enthusiasts, and anyone looking to relax and indulge.",
      "Opened in October 2024, COCOBA Maidenhead combines the warmth of a welcoming neighbourhood café with the craftsmanship of an artisan chocolate maker. Every hot chocolate, dessert, and chocolate treat is created using premium chocolate crafted at COCOBA's dedicated Kent chocolate factory, delivering a truly authentic chocolate experience.",
      "Guests can enjoy expertly prepared barista coffee, luxurious real-chocolate hot drinks, freshly made cakes, waffles, desserts, light lunches, and brunch favourites in a stylish and comfortable setting. Whether you're catching up with friends, holding an informal meeting, enjoying family time, or simply treating yourself, COCOBA provides the perfect atmosphere to unwind.",
      "Beyond the café experience, visitors can browse an extensive selection of handcrafted chocolates, gift boxes, hampers, and seasonal treats, making every visit an opportunity to take a little chocolate magic home.",
      "With its friendly service, premium products, and inviting atmosphere, COCOBA Chocolate Café Maidenhead has quickly become one of the town's most enjoyable destinations for coffee, chocolate, and memorable moments.",
    ],
    hours: [
      { day: "Monday – Tuesday", time: "7:30am – 6pm" },
      { day: "Wednesday – Saturday", time: "7:30am – 9:30pm" },
      { day: "Sunday", time: "9am – 5pm" },
    ],
    address: "2B High Street, Maidenhead SL6 1QJ",
    mapQuery: "COCOBA Chocolate Cafe, High Street, Maidenhead SL6 1QJ",
    phone: "—",
    email: "maidenhead@cocobachocolate.com",
    social: {
      instagram: "https://www.instagram.com/cocobachocolatecafe_maidenhead",
      facebook: "https://www.facebook.com/CocobaChocolate/",
      x: "https://x.com/cocobachocolate",
      // no public WhatsApp number — falls back to a "share via WhatsApp" link
    },
    website: "www.cocobachocolate.com",
    news: cocobaNews,
  },
  {
    // ── Esquires Coffee — "free plan +" listing (2-image header, description, website) ──
    ...item("esquires-coffee", "Esquires Coffee", "eat-drink", "cafes", "Café"),
    freePlan: true,
    containHero: true,
    image: "/images/esquires/hero-2.png",
    gallery: ["/images/esquires/hero-2.png", "/images/esquires/hero-1.png"],
    description:
      "Esquires Coffee is an ethical coffeehouse brand known for serving organic, Fairtrade coffee in welcoming, community-focused cafés.",
    hours: [
      { day: "Monday – Friday", time: "7:30am – 5:30pm" },
      { day: "Saturday", time: "8am – 5:30pm" },
      { day: "Sunday", time: "9am – 4pm" },
    ],
    address: "High Street, Maidenhead SL6",
    mapQuery: "Esquires Coffee, Maidenhead",
    phone: "01628 000 000",
    website: "www.esquirescoffee.co.uk",
  },
  item("pret-a-manger", "Pret A Manger", "eat-drink", "grab-go", "Grab & Go"),
  {
    // ── Real content: Bakedd, Maidenhead — "free plan" listing (logo-only header) ──
    ...item("bakedd", "Bakedd", "eat-drink", "bakery", "Bakery & Café"),
    // Listed under both Bakery and Cafés in the Eat & Drink menu
    categories: ["bakery", "cafes"],
    freePlan: true,
    logoHeader: true,
    hideDescription: true,
    hideWeb: true,
    logo: "/images/logos/bakedd.png",
    paragraphs: [
      "Bakedd is an artisan bakery where every visit feels like coming home. Everything is freshly handcrafted on-site each day, using honest ingredients and time-honoured traditions with an innovative twist.",
      "From freshly baked breads and pastries to cakes, coffee and light bites, Bakedd brings a warm, welcoming corner of craft baking to the heart of Maidenhead's High Street — the perfect spot to pause, treat yourself or pick something up to take home.",
    ],
    hours: [
      { day: "Monday – Saturday", time: "7:30am – 5pm" },
      { day: "Sunday", time: "Closed" },
    ],
    address: "1A High Street, Maidenhead SL6 1NJ",
    mapQuery: "Bakedd, 1A High Street, Maidenhead SL6 1NJ",
    phone: "01628 299 303",
    email: "hello@bakedd.co.uk",
    website: "www.bakedd.co.uk",
  },
  item("thai-river", "Thai River", "eat-drink", "thai", "Thai"),
  item("sakura", "Sakura", "eat-drink", "japanese", "Japanese"),
  item("la-cucina", "La Cucina", "eat-drink", "italian", "Italian"),
  item("the-bridge-house", "The Bridge House", "eat-drink", "british", "British"),
  item("golden-lotus", "Golden Lotus", "eat-drink", "chinese", "Chinese"),
  item("maison-thames", "Maison Thames", "eat-drink", "french", "French"),
  item("hall-woodhouse", "Hall & Woodhouse", "eat-drink", "private-dining", "Private Dining"),
];

// ─── SEE & DO ────────────────────────────────────────────────────────────────
const seeItems = [
  item("winter-makers-market", "Winter Makers Market", "see-do", "events", "What's On"),
  item("riverside-jazz-festival", "Riverside Jazz Festival", "see-do", "events", "What's On"),
  item("maidenhead-heritage-walk", "Maidenhead Heritage Walk", "see-do", "art-culture", "Art & Culture"),
  item("community-garden-day", "Community Garden Day", "see-do", "community", "Community"),
  item("kids-craft-club", "Kids' Craft Club", "see-do", "family", "Family"),
  item("style-edit-evening", "Style Edit Evening", "see-do", "fashion-beauty", "Fashion & Beauty"),
  item("riverside-film-nights", "Riverside Film Nights", "see-do", "film", "Film"),
  item("retro-arcade-takeover", "Retro Arcade Takeover", "see-do", "gaming", "Gaming"),
  item("thames-life-drawing", "Thames Life Drawing", "see-do", "learning", "Learning"),
  item("parkrun-maidenhead", "Maidenhead parkrun", "see-do", "sport-wellness", "Sport & Wellness"),
];

// ─── Section definitions (drives nav dropdowns + landing pages) ──────────────
export const sections = {
  shop: {
    key: "shop",
    label: "Shop",
    path: "/shop",
    landing: {
      title: "Shopping at Maidenhead",
      intro:
        "From independent boutiques to high-street favourites — spanning beauty, fashion, homeware and more, you'll find everything you need across Maidenhead town centre.",
      hero: "/images/ql-shop.jpg",
    },
    columns: [
      {
        heading: "Shops",
        links: [
          { label: "See All Shops", to: "/shop" },
          { label: "Accessories & Jewellery", to: "/shop/category/accessories-jewellery" },
          { label: "Clothing", to: "/shop/category/clothing" },
          { label: "Electronics & Phones", to: "/shop/category/electronics-phones" },
          { label: "Groceries", to: "/shop/category/groceries" },
          { label: "Health & Beauty", to: "/shop/category/health-beauty" },
          { label: "Home & Furniture", to: "/shop/category/home-furniture" },
          { label: "Shoes & Footwear", to: "/shop/category/shoes-footwear" },
          { label: "Sports & Fitness", to: "/shop/category/sports-fitness" },
        ],
      },
      {
        heading: "Services",
        links: [
          { label: "Banks & Foreign Exchange", to: "/shop/category/banks" },
          { label: "Childcare", to: "/shop/category/childcare" },
          { label: "Dry Cleaning & Shoe Repair", to: "/shop/category/dry-cleaning" },
          { label: "Hairdressing & Beauty", to: "/shop/category/hairdressing" },
          { label: "Healthcare", to: "/shop/category/healthcare" },
          { label: "Opticians & Pharmacies", to: "/shop/category/opticians" },
          { label: "Spa", to: "/shop/category/spa" },
          { label: "Travel Agents", to: "/shop/category/travel-agents" },
        ],
      },
      {
        heading: "Popular",
        links: [
          { label: "Zara", to: "/shop/place/zara" },
          { label: "M&S", to: "/shop/place/m-s" },
          { label: "Boots", to: "/shop/place/boots" },
          { label: "Barclays", to: "/shop/place/barclays" },
          { label: "Bupa", to: "/shop/place/bupa" },
          { label: "Currys", to: "/shop/place/currys" },
        ],
      },
    ],
    items: shopItems,
  },

  "eat-drink": {
    key: "eat-drink",
    label: "Eat & Drink",
    path: "/eat-drink",
    landing: {
      title: "Eat, Drink & Explore at Maidenhead",
      intro:
        "Experience Maidenhead differently — from riverside terraces and independent restaurants to cosy cafés and lively bars, there's a table for every occasion.",
      hero: "/images/card-cafe.jpg",
    },
    columns: [
      {
        heading: "Venue Type",
        links: [
          { label: "See All", to: "/eat-drink" },
          { label: "Bars", to: "/eat-drink/category/bars" },
          { label: "Restaurants", to: "/eat-drink/category/restaurants" },
          { label: "Cafes", to: "/eat-drink/category/cafes" },
          { label: "Grab & Go", to: "/eat-drink/category/grab-go" },
          { label: "Private Dining", to: "/eat-drink/category/private-dining" },
        ],
      },
      {
        heading: "Cuisine Type",
        links: [
          { label: "British", to: "/eat-drink/category/british" },
          { label: "Italian", to: "/eat-drink/category/italian" },
          { label: "Chinese", to: "/eat-drink/category/chinese" },
          { label: "Indian", to: "/eat-drink/category/indian" },
          { label: "French", to: "/eat-drink/category/french" },
          { label: "Thai", to: "/eat-drink/category/thai" },
          { label: "Japanese", to: "/eat-drink/category/japanese" },
          { label: "Bakery", to: "/eat-drink/category/bakery" },
        ],
      },
      {
        heading: "New To Maidenhead",
        links: [
          { label: "Coppa Club", to: "/eat-drink/place/coppa-club" },
          { label: "Bakedd", to: "/eat-drink/place/bakedd" },
          { label: "Esquires Coffee", to: "/eat-drink/place/esquires-coffee" },
          { label: "El Cerdo Tapas & Bar", to: "/eat-drink/place/el-cerdo" },
          { label: "Bombay Story", to: "/eat-drink/place/bombay-story" },
          { label: "La Cucina", to: "/eat-drink/place/la-cucina" },
        ],
      },
    ],
    items: eatItems,
  },

  "see-do": {
    key: "see-do",
    label: "See & Do",
    path: "/see-do",
    landing: {
      title: "See & Do at Maidenhead",
      intro:
        "Whatever you're into, there's always something happening in Maidenhead — events, culture, family days out, sport and more, right on the river.",
      hero: "/images/ql-see.jpg",
    },
    columns: [
      {
        heading: "What's On",
        links: [{ label: "See All Events", to: "/see-do/category/events" }],
      },
      {
        heading: "Browse By Interest",
        links: [
          { label: "See All Activities", to: "/see-do" },
          { label: "Art & Culture", to: "/see-do/category/art-culture" },
          { label: "Community", to: "/see-do/category/community" },
          { label: "Family", to: "/see-do/category/family" },
          { label: "Fashion & Beauty", to: "/see-do/category/fashion-beauty" },
          { label: "Film", to: "/see-do/category/film" },
          { label: "Gaming", to: "/see-do/category/gaming" },
          { label: "Learning", to: "/see-do/category/learning" },
          { label: "Sport & Wellness", to: "/see-do/category/sport-wellness" },
        ],
      },
    ],
    items: seeItems,
  },
};

// Human-readable titles for category pages, keyed by category slug
export const categoryTitles = {
  // shop
  "accessories-jewellery": "Accessories & Jewellery",
  clothing: "Clothing",
  "electronics-phones": "Electronics & Phones",
  groceries: "Groceries",
  "health-beauty": "Health & Beauty",
  "home-furniture": "Home & Furniture",
  "shoes-footwear": "Shoes & Footwear",
  "sports-fitness": "Sports & Fitness",
  banks: "Banks & Foreign Exchange",
  childcare: "Childcare",
  "dry-cleaning": "Dry Cleaning & Shoe Repair",
  hairdressing: "Hairdressing & Beauty",
  healthcare: "Healthcare",
  opticians: "Opticians & Pharmacies",
  spa: "Spa",
  "travel-agents": "Travel Agents",
  // eat & drink
  bars: "Bars",
  restaurants: "Restaurants",
  cafes: "Cafés",
  "grab-go": "Grab & Go",
  "private-dining": "Private Dining",
  british: "British",
  italian: "Italian",
  chinese: "Chinese",
  indian: "Indian",
  french: "French",
  thai: "Thai",
  japanese: "Japanese",
  bakery: "Bakery",
  // see & do
  events: "What's On",
  "art-culture": "Art & Culture",
  community: "Community",
  family: "Family",
  "fashion-beauty": "Fashion & Beauty",
  film: "Film",
  gaming: "Gaming",
  learning: "Learning",
  "sport-wellness": "Sport & Wellness",
};

// Flat lookup of every item by slug (for detail pages)
export const allItems = Object.values(sections).flatMap((s) => s.items);
export const itemBySlug = Object.fromEntries(allItems.map((i) => [i.slug, i]));

// Flat lookup of every news/offer article by slug (for article sub-pages).
// Each article carries a reference to its parent business.
export const allArticles = allItems.flatMap((biz) =>
  (biz.news ?? []).map((a) => ({ ...a, business: biz }))
);
export const articleBySlug = Object.fromEntries(allArticles.map((a) => [a.slug, a]));

// The three dropdown menus, in nav order
export const menus = [sections["see-do"], sections["eat-drink"], sections.shop];
