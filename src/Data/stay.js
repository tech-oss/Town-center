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

const img = (seed, w = 1200, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

// Pads a gallery out to 7 images (1 hero + 6 extra), matching the Eat &
// Drink/See & Do/Shop detail pages' photo grid, with additional placeholder
// shots when a listing's real gallery is shorter.
const padGallery = (slug, images) => {
  const padded = [...images];
  for (let n = images.length + 1; padded.length < 7; n++) {
    padded.push(img(`${slug}-${n}`, 900, 600));
  }
  return padded;
};

export const hotels = [
  {
    slug: "fredricks-hotel-restaurant-spa",
    name: "Fredrick's Hotel, Restaurant & Spa",
    stars: 4,
    tagline: "A 4-star Edwardian townhouse hotel with private gardens and a spa",
    description:
      "Built in the 1920s, Fredrick's is a long-standing 4-star hotel in the heart of Maidenhead, set in its own private gardens with a swimming pool, spa and an on-site restaurant.",
    address: "Shoppenhangers Road, Maidenhead SL6 2PZ",
    mapQuery: "Fredrick's Hotel, Shoppenhangers Road, Maidenhead SL6 2PZ",
    lat: 51.513295,
    lng: -0.726958,
    website: "https://www.fredricks-hotel.co.uk/",
    phone: "01628 581 000",
    social: { facebook: "https://www.facebook.com/FredricksHotelRestaurantSpa/" },
    priceFrom: null,
    image: img("fredricks-hotel", 1200, 800),
    gallery: padGallery("fredricks-hotel", [img("fredricks-hotel", 1200, 800), img("fredricks-hotel-2", 900, 600), img("fredricks-hotel-3", 900, 600)]),
    amenities: ["Spa & swimming pool", "On-site restaurant", "Private gardens", "Free Wi-Fi", "On-site parking"],
  },
  {
    slug: "premier-inn-maidenhead-town-centre",
    name: "Premier Inn Maidenhead Town Centre",
    stars: 3,
    tagline: "Budget-friendly chain hotel a short walk from the River Thames",
    description:
      "A centrally-located Premier Inn within walking distance of the River Thames and Maidenhead's shops, restaurants and station.",
    address: "Kidwells Park Drive, Maidenhead SL6 8AQ",
    mapQuery: "Premier Inn Maidenhead Town Centre, Kidwells Park Drive, Maidenhead SL6 8AQ",
    lat: 51.523428,
    lng: -0.720275,
    website: "https://www.premierinn.com/gb/en/hotels/england/berkshire/maidenhead/maidenhead-town-centre.html",
    phone: "0333 321 9357",
    social: { facebook: "https://www.facebook.com/PremierInnMaidenheadTownCentre/" },
    priceFrom: null,
    image: img("premier-inn-mh", 1200, 800),
    gallery: padGallery("premier-inn-mh", [img("premier-inn-mh", 1200, 800), img("premier-inn-mh-2", 900, 600), img("premier-inn-mh-3", 900, 600)]),
    amenities: ["Free Wi-Fi", "On-site restaurant/bar", "Family rooms", "Good night guarantee"],
  },
  {
    slug: "thames-riviera-hotel",
    name: "Thames Riviera Hotel",
    stars: 3,
    tagline: "Riverside hotel by Maidenhead Bridge, part of the Sure Hotel Collection by Best Western",
    description:
      "Set right on the riverside by Maidenhead Bridge, the Thames Riviera Hotel is a short walk from Skindles restaurant across the bridge and from the town centre.",
    address: "Bridge Road, Maidenhead SL6 8DW",
    mapQuery: "Thames Riviera Hotel, Bridge Road, Maidenhead SL6 8DW",
    lat: 51.523662,
    lng: -0.703101,
    website: "https://thamesriviera.com/",
    phone: "01628 956 370",
    email: "thamesreservations@rbhmanagement.com",
    social: { facebook: "https://www.facebook.com/thamesrivierahotel/" },
    priceFrom: null,
    image: img("thames-riviera", 1200, 800),
    gallery: padGallery("thames-riviera", [img("thames-riviera", 1200, 800), img("thames-riviera-2", 900, 600), img("thames-riviera-3", 900, 600)]),
    amenities: ["Riverside setting", "On-site restaurant", "Free Wi-Fi", "On-site parking"],
  },
  {
    slug: "travelodge-maidenhead-central",
    name: "Travelodge Maidenhead Central",
    stars: 2,
    tagline: "Simple, budget accommodation on King Street in the town centre",
    description:
      "A no-frills Travelodge on King Street, right in the town centre and close to Maidenhead's shops, restaurants and station.",
    address: "99 King Street, Maidenhead SL6 1DP",
    mapQuery: "Travelodge Maidenhead Central, 99 King Street, Maidenhead SL6 1DP",
    lat: 51.519546,
    lng: -0.721378,
    website: "https://www.travelodge.co.uk/",
    phone: "0871 984 6456",
    social: { facebook: "https://www.facebook.com/TLHotelMaidenheadCentral/" },
    priceFrom: null,
    image: img("travelodge-mh", 1200, 800),
    gallery: padGallery("travelodge-mh", [img("travelodge-mh", 1200, 800), img("travelodge-mh-2", 900, 600), img("travelodge-mh-3", 900, 600)]),
    amenities: ["Free Wi-Fi", "Town centre location", "Family rooms"],
  },
  {
    slug: "holiday-inn-maidenhead-windsor",
    name: "Holiday Inn Maidenhead / Windsor, an IHG Hotel",
    stars: 4,
    tagline: "Larger IHG hotel near the M4, geared towards business and event stays",
    description:
      "A short drive from the town centre near the M4, this Holiday Inn offers conference facilities alongside its guest rooms — a popular choice for business travellers visiting Maidenhead and Windsor.",
    address: "Manor Lane, Maidenhead SL6 2RA",
    mapQuery: "Holiday Inn Maidenhead Windsor, Manor Lane, Maidenhead SL6 2RA",
    lat: 51.508599,
    lng: -0.732536,
    website: "https://www.ihg.com/holidayinn/",
    phone: "0871 942 9053",
    social: { facebook: "https://www.facebook.com/HolidayInnMaidenheadWindsor" },
    priceFrom: null,
    image: img("holiday-inn-mh", 1200, 800),
    gallery: padGallery("holiday-inn-mh", [img("holiday-inn-mh", 1200, 800), img("holiday-inn-mh-2", 900, 600), img("holiday-inn-mh-3", 900, 600)]),
    amenities: ["Conference facilities", "On-site restaurant/bar", "Free parking", "Free Wi-Fi"],
  },
];

// Per-hotel News & Offers, same shape/pattern as Shop/Eat & Drink/See & Do
// businesses (newsFor), so a hotel's news section and its /news/:slug
// sub-pages work identically to the rest of the site.
hotels.forEach((h) => { h.news = newsFor(h.slug, h.name); });

export const hotelBySlug = Object.fromEntries(hotels.map((h) => [h.slug, h]));

// ─── Accommodation ───────────────────────────────────────────────────────────
// EXAMPLE listings only — see file header. Not sourced from Airbnb or any
// other platform; every host name and property is fictional.
export const accommodations = [
  {
    slug: "riverside-loft-apartment",
    name: "Riverside Loft Apartment",
    type: "Entire apartment",
    tagline: "Bright, modern loft overlooking the Waterside Quarter",
    description:
      "A one-bedroom loft-style apartment in Maidenhead's regenerated Waterside Quarter, a few minutes' walk from the station and the town centre's restaurants and bars.",
    area: "Waterside Quarter, Maidenhead town centre",
    mapQuery: "Waterside Quarter, Maidenhead SL6",
    lat: 51.523680,
    lng: -0.717180,
    guests: 2,
    bedrooms: 1,
    priceFrom: null,
    host: "Hosted by Emma",
    email: "stay@riverside-loft-apartment.example",
    image: img("riverside-loft", 1200, 800),
    gallery: padGallery("riverside-loft", [img("riverside-loft", 1200, 800), img("riverside-loft-2", 900, 600), img("riverside-loft-3", 900, 600)]),
    amenities: ["Free Wi-Fi", "Fully equipped kitchen", "Washer/dryer", "Riverside views", "5 min walk to station"],
  },
  {
    slug: "the-old-bakery-cottage",
    name: "The Old Bakery Cottage",
    type: "Entire cottage",
    tagline: "Two-bedroom cottage near the High Street, once a working bakery",
    description:
      "A converted cottage with two bedrooms, a private courtyard garden and period character, a short walk from Maidenhead's High Street.",
    area: "Near High Street, Maidenhead town centre",
    mapQuery: "High Street, Maidenhead SL6",
    lat: 51.522851,
    lng: -0.717740,
    guests: 4,
    bedrooms: 2,
    priceFrom: null,
    host: "Hosted by James & Priya",
    email: "stay@the-old-bakery-cottage.example",
    image: img("old-bakery-cottage", 1200, 800),
    gallery: padGallery("old-bakery-cottage", [img("old-bakery-cottage", 1200, 800), img("old-bakery-cottage-2", 900, 600), img("old-bakery-cottage-3", 900, 600)]),
    amenities: ["Private courtyard garden", "Free parking", "Free Wi-Fi", "Fully equipped kitchen", "Pet friendly"],
  },
  {
    slug: "bridge-street-studio",
    name: "Bridge Street Studio",
    type: "Private room in a home",
    tagline: "Compact studio-style room, walking distance to the river",
    description:
      "A private, self-contained studio room with its own entrance, a short walk from Maidenhead Bridge and the riverside.",
    area: "Near Bridge Street, Maidenhead",
    mapQuery: "Bridge Street, Maidenhead SL6",
    lat: 51.521889,
    lng: -0.712000,
    guests: 2,
    bedrooms: 1,
    priceFrom: null,
    host: "Hosted by Alex",
    email: "stay@bridge-street-studio.example",
    image: img("bridge-street-studio", 1200, 800),
    gallery: padGallery("bridge-street-studio", [img("bridge-street-studio", 1200, 800), img("bridge-street-studio-2", 900, 600), img("bridge-street-studio-3", 900, 600)]),
    amenities: ["Private entrance", "Free Wi-Fi", "Kettle & microwave", "Walk to the river"],
  },
  {
    slug: "thameside-boathouse-retreat",
    name: "Thameside Boathouse Retreat",
    type: "Entire home",
    tagline: "Three-bedroom riverside home with a private garden onto the Thames",
    description:
      "A spacious riverside home with a private garden running down to the Thames, a short drive from the town centre — well suited to families or small groups.",
    area: "Riverside, near Boulter's Lock, Maidenhead",
    mapQuery: "Boulter's Lock, Maidenhead SL6",
    lat: 51.534200,
    lng: -0.697600,
    guests: 6,
    bedrooms: 3,
    priceFrom: null,
    host: "Hosted by Sarah",
    email: "stay@thameside-boathouse-retreat.example",
    image: img("thameside-boathouse", 1200, 800),
    gallery: padGallery("thameside-boathouse", [img("thameside-boathouse", 1200, 800), img("thameside-boathouse-2", 900, 600), img("thameside-boathouse-3", 900, 600)]),
    amenities: ["Private garden onto the Thames", "Free parking", "Free Wi-Fi", "Fully equipped kitchen", "Garden furniture & BBQ"],
  },
];

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
