import { mock } from "../client";

// ─── Eat & Drink businesses available for news/offers ─────────────────────────
export const EAT_DRINK_BUSINESSES = [
  { id: "coppa-club", name: "Coppa Club" },
  { id: "cocoba", name: "COCOBA Chocolate Café" },
  { id: "james-kitchen", name: "James's Kitchen" },
  { id: "spice-garden", name: "Spice Garden Restaurant" },
  { id: "the-bar", name: "The Boathouse Bar" },
  { id: "gourmet-kitchen", name: "Gourmet Kitchen" },
];

// ─── Mock news & offers ───────────────────────────────────────────────────────
// Shape mirrors the public biz.news[] items. Extra admin fields:
//   businessId, businessName, featuredOnHome, status
let NEWS_OFFERS = [
  {
    id: "no1",
    slug: "coppa-cocktail-masterclass",
    businessId: "coppa-club",
    businessName: "Coppa Club",
    category: "What's On",
    type: "news",
    title: "Shake, Stir & Sip: Cocktail Masterclass",
    excerpt: "A hands-on cocktail masterclass led by our in-house bartenders — learn to shake, stir and sip your way through Coppa Club's signature serves.",
    body: "Join our in-house bartenders for Shake, Stir & Sip — a hands-on cocktail masterclass at Coppa Club Maidenhead. Over the course of the evening you'll learn the techniques behind some of our most-loved serves, from balancing flavours to the all-important garnish.\n\nYou'll get to shake, stir and, of course, sip your way through a selection of cocktails, with expert tips and plenty of good company along the way. Places are limited — booking recommended.",
    image: "/images/coppa/cocktail.jpg",
    date: "Monthly · 7pm",
    status: "Published",
    featuredOnHome: true,
    createdAt: "2026-05-10",
  },
  {
    id: "no2",
    slug: "coppa-champagne-tasting",
    businessId: "coppa-club",
    businessName: "Coppa Club",
    category: "Offer",
    type: "offer",
    title: "Champagne & Sparkling Tasting Evening",
    excerpt: "An evening led by Coppa Club's in-house expert, exploring Champagne alongside a curated selection of sparkling wines.",
    body: "Raise a glass at Coppa Club Maidenhead with our Champagne & Sparkling Tasting Evening. Led by our in-house expert, you'll explore the world of Champagne alongside a curated selection of sparkling wines from around the world.\n\nWhether you're a seasoned sipper or simply Champagne-curious, it's a relaxed and refined way to spend an evening. Booking recommended as places fill quickly.",
    image: "/images/coppa/champagne.jpg",
    date: "Monthly · 6:30pm",
    status: "Published",
    featuredOnHome: true,
    createdAt: "2026-05-12",
  },
  {
    id: "no3",
    slug: "cocoba-end-of-season-sale",
    businessId: "cocoba",
    businessName: "COCOBA Chocolate Café",
    category: "Offer",
    type: "offer",
    title: "End of Season Sale — While Stocks Last",
    excerpt: "Stock up on handcrafted COCOBA chocolates at reduced prices — a perfect chance to discover new favourites or pick up a gift.",
    body: "There's never been a better time to treat yourself (or someone else) at COCOBA Maidenhead. Our End of Season Sale is now on in store, with a selection of handcrafted chocolates, gift boxes and seasonal treats available at reduced prices.\n\nEvery piece is made with premium chocolate crafted at COCOBA's dedicated chocolate factory. Stock is limited and selling fast — pop in while it lasts.",
    image: "/images/cocoba/truffles.jpg",
    date: "While stocks last",
    status: "Published",
    featuredOnHome: true,
    createdAt: "2026-05-15",
  },
  {
    id: "no4",
    slug: "cocoba-hot-chocolate-bombes",
    businessId: "cocoba",
    businessName: "COCOBA Chocolate Café",
    category: "Featured",
    type: "news",
    title: "Meet the Hot Chocolate Bombes",
    excerpt: "Drop one into warm milk and watch it melt into a rich, real-chocolate hot drink — one of COCOBA's signature treats.",
    body: "If you haven't tried a COCOBA Hot Chocolate Bombe yet, you're in for something special. Drop one into a mug of warm milk and watch it melt away to reveal a rich, indulgent, real-chocolate hot drink.\n\nAvailable in a range of flavours and made with the same premium chocolate as everything else on our menu — ask the team in store about the current flavours.",
    image: "/images/cocoba/bombes.jpg",
    date: "All year round",
    status: "Published",
    featuredOnHome: false,
    createdAt: "2026-05-18",
  },
  {
    id: "no5",
    slug: "coppa-wreath-making",
    businessId: "coppa-club",
    businessName: "Coppa Club",
    category: "What's On",
    type: "news",
    title: "Wreath-Making Workshop",
    excerpt: "A relaxed wreath-making session, complete with all materials provided and a complimentary drink to sip while you create.",
    body: "Get creative this season at Coppa Club Maidenhead with our Wreath-Making Workshop. In a relaxed, friendly setting, you'll craft your own seasonal wreath to take home — and a complimentary drink is included.\n\nAll materials are provided. Spaces are limited, so please book ahead.",
    image: "/images/coppa/wreath.jpg",
    date: "Seasonal",
    status: "Draft",
    featuredOnHome: false,
    createdAt: "2026-06-01",
  },
  {
    id: "no6",
    slug: "james-kitchen-lunch-deal",
    businessId: "james-kitchen",
    businessName: "James's Kitchen",
    category: "Offer",
    type: "offer",
    title: "20% Off Weekday Lunch",
    excerpt: "Enjoy 20% off your entire food order when dining in Monday to Friday, 12pm–3pm.",
    body: "Enjoy 20% off your entire food order when dining in Monday to Friday, 12pm–3pm. Applies to our full lunch menu including sandwiches, hot dishes, and specials.\n\nNot valid with other offers or on bank holidays. Quote LUNCH20 at the counter.",
    image: "/images/events/popup.jpg",
    date: "Mon–Fri · 12pm–3pm",
    status: "Published",
    featuredOnHome: false,
    createdAt: "2026-06-19",
  },
];

// ─── Public: homepage spotlight posts (featured items) ────────────────────────
export function getSpotlightPosts() {
  const featured = NEWS_OFFERS.filter((n) => n.featuredOnHome && n.status === "Published");
  // Map to the shape BlogCards expects
  return mock(
    featured.map((n) => ({
      id: n.id,
      slug: n.slug,
      category: `${n.businessName} · ${n.category}`,
      title: n.title,
      excerpt: n.excerpt,
      imageSrc: n.image,
      imageAlt: n.title,
      href: `/news/${n.slug}`,
      date: n.date,
    }))
  );
}

// ─── Admin: full CRUD ─────────────────────────────────────────────────────────
export function getNewsOffers({ businessId, status } = {}) {
  let list = [...NEWS_OFFERS];
  if (businessId) list = list.filter((n) => n.businessId === businessId);
  if (status) list = list.filter((n) => n.status === status);
  return mock(list);
}

export function getNewsOfferById(id) {
  return mock(NEWS_OFFERS.find((n) => n.id === id) ?? null);
}

export function saveNewsOffer(item) {
  const saved = {
    ...item,
    id: item.id || `no${Date.now()}`,
    slug: item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    createdAt: item.createdAt || new Date().toISOString().slice(0, 10),
  };
  if (item.id) {
    NEWS_OFFERS = NEWS_OFFERS.map((n) => (n.id === item.id ? saved : n));
  } else {
    NEWS_OFFERS = [...NEWS_OFFERS, saved];
  }
  return mock(saved);
}

export function deleteNewsOffer(id) {
  NEWS_OFFERS = NEWS_OFFERS.filter((n) => n.id !== id);
  return mock({ id, deleted: true });
}

export function toggleHomepageFeature(id) {
  const item = NEWS_OFFERS.find((n) => n.id === id);
  if (!item) return mock(null);
  const featuredCount = NEWS_OFFERS.filter((n) => n.featuredOnHome && n.id !== id).length;
  // Allow toggle off always; only allow toggle on if < 3 currently featured
  if (!item.featuredOnHome && featuredCount >= 3) {
    return mock({ error: "Maximum 3 items can be featured on the homepage at once. Remove one first." });
  }
  NEWS_OFFERS = NEWS_OFFERS.map((n) => n.id === id ? { ...n, featuredOnHome: !n.featuredOnHome } : n);
  return mock({ id, featuredOnHome: !item.featuredOnHome });
}
