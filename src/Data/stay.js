// ════════════════════════════════════════════════════════════════════════════
//  "Stay" — visitor accommodation in and around Maidenhead.
//  Routes:
//   /live/stay/hotels                    → Hotels listing
//   /live/stay/hotels/:slug              → Hotel detail
//   /live/stay/accommodation             → Privately-owned accommodation listing
//   /live/stay/accommodation/:slug       → Accommodation detail
//
//  HOTELS — real, publicly-listed Maidenhead hotels (name/address verified via
//  web search, Aug 2026). No live pricing/availability feed is wired up, so
//  `priceFrom` is a rounded "from" indicator only, and every card links out to
//  the hotel's own site/OTA listing for booking — this site does not take
//  reservations.
//
//  ACCOMMODATION — there is no public API for Airbnb/private-host listings,
//  and scraping or fabricating real hosts' homes and addresses would publish
//  private individuals' property details without consent. These entries are
//  clearly-labelled examples in the same spirit as the site's other seeded
//  demo listings (e.g. shop/services placeholders) — replace with a real
//  channel-manager or Airbnb partner feed before launch.
// ════════════════════════════════════════════════════════════════════════════

import { newsFor } from "./pages";


// Pads a gallery out to 7 images (1 hero + 6 extra), matching the Eat &
// Drink/See & Do/Shop detail pages' photo grid, with additional placeholder
// shots when a listing's real gallery is shorter.

// Demo hotels removed: only registered businesses are listed.
export const hotels = [];

// Per-hotel News & Offers, same shape/pattern as Shop/Eat & Drink/See & Do
// businesses (newsFor), so a hotel's news section and its /news/:slug
// sub-pages work identically to the rest of the site.
hotels.forEach((h) => { h.news = newsFor(h.slug, h.name); });

export const hotelBySlug = Object.fromEntries(hotels.map((h) => [h.slug, h]));

// ─── Accommodation ───────────────────────────────────────────────────────────
// EXAMPLE listings only — see file header. Not sourced from Airbnb or any
// other platform; every host name and property is fictional.
// Demo accommodations removed: only registered businesses are listed.
export const accommodations = [];

accommodations.forEach((a) => { a.news = newsFor(a.slug, a.name); });

export const accommodationBySlug = Object.fromEntries(accommodations.map((a) => [a.slug, a]));

// ─── News & Offers articles, surfaced on the main Offers page ──────────────
// Every hotel/accommodation article carries a `business` reference — same
// pattern as Data/pages.js's allArticles — but with `section: "stay"` (a
// shared "Hotels & Stay" filter category on the Offers page) plus its own
// detail-page path, since Stay listings live outside the shop/eat-drink/
// see-do/services `sections` routing scheme (`/live/stay/...` not
// `/:section/place/:slug`).
function stayArticles(list, listPath, tagFor) {
  return list.flatMap((b) =>
    (b.news ?? []).map((a) => ({
      ...a,
      business: {
        slug: b.slug,
        name: b.name,
        section: "stay",
        sectionLabel: "Hotels & Stay",
        sectionPath: "/live/stay/hotels",
        tag: tagFor(b),
        image: b.image,
        address: b.address ?? b.area,
        news: b.news,
        detailPath: `${listPath}/${b.slug}`,
      },
    }))
  );
}

export const allStayArticles = [
  ...stayArticles(hotels, "/live/stay/hotels", (b) => `${b.stars}-Star Hotel`),
  ...stayArticles(accommodations, "/live/stay/accommodation", (b) => b.type),
];
export const stayArticleBySlug = Object.fromEntries(allStayArticles.map((a) => [a.slug, a]));
