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

import {
  CATEGORY_TITLES, VENUE_TYPES, CUISINE_TYPES, SEE_DO_CATEGORIES,
  TRADESPERSON_CATEGORIES, PROFESSIONAL_CATEGORIES, FREELANCER_CATEGORIES,
  categoryLinks, shopGroup,
} from "./taxonomy";

// Stable dummy image per slug (replace with real assets later)
const img = (seed) => `https://picsum.photos/seed/${seed}/900/650`;

// Pads a gallery out to 7 images (1 hero + 6 extra, filling the detail page's
// photo grid) with placeholder shots when a real gallery is shorter.

// Shared dummy detail content so every sub-page is fully populated

// Per-business News & Offers (unique to each item, styled like "In the Spotlight").
// Every article has its own sub-page at /news/:slug.
export function newsFor(slug, name) {
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

// Real News & Offers for COCOBA Chocolate Café, Maidenhead (sub-pages at /news/:slug)


// ─── SHOP ──────────────────────────────────────────────────────────────────
// Demo shop listings removed: this section shows registered businesses only.
const shopItems = [];

// ─── SERVICES ────────────────────────────────────────────────────────────────
// Demo services listings removed: this section shows registered businesses only.
const servicesItems = [];

// ─── EAT & DRINK ─────────────────────────────────────────────────────────────
// Demo eat listings removed: this section shows registered businesses only.
const eatItems = [];

// ─── SEE & DO ────────────────────────────────────────────────────────────────
// Demo see listings removed: this section shows registered businesses only.
const seeItems = [];

// ─── Section definitions (drives nav dropdowns + landing pages) ──────────────
export const sections = {
  shop: {
    key: "shop",
    label: "Shop",
    path: "/shop",
    landing: {
      title: "Shop",
      intro:
        "From independent boutiques to high-street favourites — spanning beauty, fashion, homeware and more, you'll find everything you need across Maidenhead.",
      hero: "/images/shop-hero.png",
      heroDesktop: "/images/shop-hero-desktop.png",
    },
    columns: [
      {
        heading: "Shop",
        links: categoryLinks("/shop", shopGroup("Shop"), { seeAll: "See All Shops" }),
      },
      {
        heading: "Local Services",
        links: categoryLinks("/shop", shopGroup("Local Services")),
      },
    ],
    items: shopItems,
  },

  services: {
    key: "services",
    label: "Services",
    path: "/services",
    landing: {
      title: "Services in Maidenhead",
      intro:
        "Trusted local tradespeople and professionals – from builders and electricians to accountants and solicitors – all on hand in Maidenhead",
      hero: "/images/services/hero-square.jpg",
      heroDesktop: "/images/services/hero-desktop.jpg",
    },
    columns: [
      {
        heading: "Tradesperson",
        links: categoryLinks("/services/tradespeople", TRADESPERSON_CATEGORIES, { seeAll: "See All Tradespeople" }),
      },
      {
        heading: "Professionals",
        links: categoryLinks("/services/professionals", PROFESSIONAL_CATEGORIES, { seeAll: "See All Professionals" }),
      },
      {
        heading: "Freelancers",
        links: categoryLinks("/services/freelancers", FREELANCER_CATEGORIES, { seeAll: "See All Freelancers" }),
      },
    ],
    // Dedicated listing pages at /services/:key — each scoped to only its
    // own column's categories, so "See All Tradespeople" no longer lands on
    // the same combined list as "See All Professionals"/"See All Freelancers".
    groups: [
      {
        key: "tradespeople",
        label: "Tradespeople",
        heading: "Tradesperson",
        intro: "Trusted local tradespeople — from builders and electricians to plumbers, decorators and cleaners — all on hand in Maidenhead.",
      },
      {
        key: "professionals",
        label: "Professionals",
        heading: "Professionals",
        intro: "Local professional services — accountants, solicitors, financial advisers, estate agents and more — all based in Maidenhead.",
      },
      {
        key: "freelancers",
        label: "Freelancers",
        heading: "Freelancers",
        intro: "Independent local freelancers — designers, developers, photographers, trainers and more — ready to work with you in Maidenhead.",
      },
    ],
    items: servicesItems,
  },

  "eat-drink": {
    key: "eat-drink",
    label: "Eat & Drink",
    path: "/eat-drink",
    landing: {
      title: "Eat & Drink",
      intro:
        "Experience Maidenhead in a whole new way from scenic riverside terraces and independent restaurants to cosy cafés and vibrant bars, there's a perfect spot for every occasion.",
      hero: "/images/eat-drink/hero.jpg",
      heroDesktop: "/images/eat-drink/hero.jpg",
    },
    columns: [
      {
        heading: "Venue Type",
        links: categoryLinks("/eat-drink", VENUE_TYPES, { seeAll: "See All" }),
      },
      {
        heading: "Cuisine Type",
        links: categoryLinks("/eat-drink", CUISINE_TYPES),
      },
    ],
    items: eatItems,
  },

  "see-do": {
    key: "see-do",
    label: "See & Do",
    path: "/see-do",
    landing: {
      title: "See & Do",
      intro:
        "With a vibrant mix of leisure, entertainment, shopping, dining and wellbeing experiences, alongside a year-round calendar of events, there's always something new to discover in Maidenhead. Explore everything the town has to offer and start planning your visit today.",
      hero: "/images/see-do-hero.png",
    },
    categoryHeroes: {
      film: { src: "/images/cinema.png", fit: "contain", bg: "#0a0a0f" },
    },
    columns: [
      {
        heading: "Browse By Interest",
        links: categoryLinks("/see-do", SEE_DO_CATEGORIES, { seeAll: "See All Activities" }),
      },
    ],
    items: seeItems,
  },
};

// Human-readable titles for category pages, keyed by category slug
// Every category label on the public site, straight off the canonical
// taxonomy — so a category can never appear in a picker but render as a raw
// slug here, which is what used to happen whenever the two drifted.
export const categoryTitles = CATEGORY_TITLES;

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
export const menus = [sections["see-do"], sections["eat-drink"], sections.shop, sections.services];
