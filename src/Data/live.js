// ════════════════════════════════════════════════════════════════════════════
//  "Live" section — residential living in Maidenhead.
//  Routes:
//   /live                       → Why Live Here
//   /live/overview              → Properties Overview (Find an Apartment)
//   /live/for-sale              → Properties For Sale (search + grid)
//   /live/for-rent              → Properties For Rent (search + grid)
//   /live/enquire               → Enquire form
//   /live/building/:slug        → Building detail + its properties
//   /live/property/:slug        → Apartment detail + Book a Viewing
// ════════════════════════════════════════════════════════════════════════════

const img = (seed, w = 1200, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

// ─── Real (free-licensed) property photography ──────────────────────────────
const PIC = {
  extWaterside: "/images/live/ext-waterside.jpg",
  extBrunel: "/images/live/ext-brunel.jpg",
  extCooper: "/images/live/ext-cooper.jpg",
  extHero: "/images/live/ext-hero.jpg",
  living: ["/images/live/living-1.jpg", "/images/live/living-2.jpg", "/images/live/living-3.jpg", "/images/live/living-4.jpg"],
  kitchen: ["/images/live/kitchen-1.jpg", "/images/live/kitchen-2.jpg", "/images/live/kitchen-3.jpg"],
  bedroom: ["/images/live/bedroom-1.jpg", "/images/live/bedroom-2.jpg", "/images/live/bedroom-3.jpg"],
  balcony: ["/images/live/balcony-1.jpg", "/images/live/balcony-2.jpg", "/images/live/balcony-3.jpg"],
};
const pick = (arr, i) => arr[i % arr.length];

// ─── Buildings / developments ────────────────────────────────────────────────
export const buildings = [
  {
    slug: "waterside-quarter",
    name: "Waterside Quarter",
    developer: "Shanly Homes",
    tagline: "Waterside living in the heart of the town centre",
    location: "Chapel Arches, Maidenhead SL6 1QJ",
    status: "Available Now",
    website: null,
    email: "sales@waterside-maidenhead.co.uk",
    phone: "01628 000 100",
    image: PIC.extWaterside,
    hero: PIC.extWaterside,
    gallery: [
      PIC.extWaterside,
      img("mh-ws-int-a", 900, 600),
      img("mh-ws-int-b", 900, 600),
      img("mh-ws-ext-b", 900, 600),
    ],
    description:
      "Waterside Quarter is a landmark collection of high-specification properties set right on Maidenhead's regenerated waterways. With independent restaurants, cafés and shops on the doorstep — and Maidenhead station on the Elizabeth Line just a short walk away — it brings together modern riverside living and effortless connectivity.",
    longDescription: [
      "Waterside Quarter represents the very best of what Maidenhead's regeneration has delivered. Set directly alongside the town's revitalised waterways, this landmark development combines striking contemporary architecture with a genuinely vibrant community atmosphere — all within metres of the independent restaurants, boutique cafés and riverside bars that make Waterside Quarter one of the most sought-after addresses in Berkshire.",
      "Each home has been finished to an exceptional specification throughout, with open-plan living spaces designed to maximise natural light and connection with the waterside setting. A dedicated concierge team, beautifully landscaped courtyards and secure underground parking complete the picture of effortless urban living.",
      "Maidenhead station — with direct Elizabeth Line services to London Paddington in as little as 18 minutes — is just a five-minute walk away, making Waterside Quarter the ideal base whether you're commuting, exploring or simply enjoying everything Maidenhead has to offer.",
    ],
    quickStats: [
      { icon: "🏢", label: "Home type", value: "Apartments" },
      { icon: "🛏", label: "Bedrooms", value: "Studio – Penthouse" },
      { icon: "📍", label: "Location", value: "Town Centre, SL6" },
      { icon: "✅", label: "Status", value: "Available Now" },
    ],
    amenities: [
      { icon: "💧", text: "Waterside setting" },
      { icon: "🛎", text: "24/7 concierge service" },
      { icon: "🌿", text: "Landscaped courtyards" },
      { icon: "🚗", text: "Secure underground parking" },
      { icon: "🚂", text: "Elizabeth Line · 5 min walk" },
      { icon: "🍽", text: "Restaurants on your doorstep" },
      { icon: "📷", text: "Video entry & security" },
      { icon: "🚲", text: "Secure cycle storage" },
    ],
    nearbyPlaces: [
      { name: "Maidenhead Station (Elizabeth Line)", distance: "5 min walk", mode: "walk" },
      { name: "London Paddington", distance: "18 min", mode: "train" },
      { name: "Coppa Club & Waterside bars", distance: "1 min walk", mode: "walk" },
      { name: "Nicholsons Quarter", distance: "3 min walk", mode: "walk" },
      { name: "M4 Motorway (J8/9)", distance: "8 min drive", mode: "car" },
      { name: "Heathrow Airport", distance: "25 min drive", mode: "car" },
    ],
  },
  {
    slug: "brunel-place",
    name: "Brunel Place",
    developer: "Cala Homes",
    tagline: "A boutique collection with a podium garden",
    location: "West Street, Maidenhead SL6 1QU",
    status: "Available Now",
    website: null,
    email: "sales@brunelplace-maidenhead.co.uk",
    phone: "01628 000 200",
    image: PIC.extBrunel,
    hero: PIC.extBrunel,
    gallery: [
      PIC.extBrunel,
      img("mh-bp-int-a", 900, 600),
      img("mh-bp-int-b", 900, 600),
      img("mh-bp-garden", 900, 600),
    ],
    description:
      "Brunel Place is an intimate collection of just 26 brand-new studio, one and two-bedroom properties arranged around a beautiful residents' podium garden. Maidenhead station is around half a mile away, with direct Elizabeth Line trains to London Paddington in as little as 18 minutes.",
    longDescription: [
      "Brunel Place is a carefully considered boutique development of just 26 homes, offering an exclusivity that larger schemes simply cannot replicate. Arranged around a beautifully landscaped podium garden — an elevated private retreat accessible only to residents — every home benefits from a genuine sense of space and tranquillity in the heart of Maidenhead.",
      "Finished to Cala's renowned high specification, interiors combine quality materials with intelligent design: open-plan kitchen and living areas, generous storage, and contemporary bathrooms that feel genuinely luxurious. Studio, one and two-bedroom layouts are all available, making Brunel Place equally suited to first-time buyers, young professionals and downsizers.",
      "The Elizabeth Line is approximately half a mile away, offering direct journeys to London Paddington in as little as 18 minutes. Maidenhead's vibrant high street, independent cafés and riverside walks are all on the doorstep.",
    ],
    quickStats: [
      { icon: "🏢", label: "Home type", value: "Apartments" },
      { icon: "🛏", label: "Bedrooms", value: "Studio, 1 & 2 bed" },
      { icon: "📍", label: "Location", value: "West Street, SL6" },
      { icon: "✅", label: "Status", value: "Available Now" },
    ],
    amenities: [
      { icon: "🌺", text: "Residents' podium garden" },
      { icon: "🏠", text: "Just 26 exclusive homes" },
      { icon: "🚲", text: "Secure bike storage" },
      { icon: "📟", text: "Video entry system" },
      { icon: "🚂", text: "Station · 0.5 mi" },
      { icon: "⚡", text: "18 min to Paddington" },
      { icon: "🏗", text: "NHBC 10-year warranty" },
      { icon: "🔆", text: "A-rated energy efficient" },
    ],
    nearbyPlaces: [
      { name: "Maidenhead Station (Elizabeth Line)", distance: "0.5 mi / 10 min walk", mode: "walk" },
      { name: "London Paddington", distance: "18 min", mode: "train" },
      { name: "Maidenhead High Street", distance: "5 min walk", mode: "walk" },
      { name: "Kidwells Park", distance: "8 min walk", mode: "walk" },
      { name: "M4 Motorway (J8/9)", distance: "8 min drive", mode: "car" },
      { name: "Windsor Castle", distance: "15 min drive", mode: "car" },
    ],
  },
  {
    slug: "cooper-square",
    name: "Cooper Square",
    developer: "Bellway Homes",
    tagline: "Contemporary 1, 2 & 3-bedroom properties",
    location: "Town Centre, Maidenhead SL6 1DY",
    status: "Available Now",
    website: null,
    email: "sales@coopersquare-maidenhead.co.uk",
    phone: "01628 000 300",
    image: PIC.extCooper,
    hero: PIC.extCooper,
    gallery: [
      PIC.extCooper,
      img("mh-cs-int-a", 900, 600),
      img("mh-cs-int-b", 900, 600),
      img("mh-cs-balcony", 900, 600),
    ],
    description:
      "Cooper Square is a contemporary development of one, two and three-bedroom properties close to excellent local amenities and handy transport routes. Thoughtfully designed interiors and generous open-plan layouts make it a natural choice for first-time buyers, downsizers and families alike.",
    longDescription: [
      "Cooper Square is a vibrant collection of one, two and three-bedroom apartments sitting right in the heart of Maidenhead's thriving town centre. Built by Bellway Homes — one of the UK's most trusted housebuilders — every property has been designed to combine versatility, efficiency and comfort with contemporary architecture that feels right at home in the regenerating town.",
      "Interiors are finished to Bellway's elevated specification: fitted kitchens with integrated appliances, contemporary bathrooms, and open-plan living spaces flooded with natural light. Each home benefits from a private balcony, and allocated parking is available on selected plots.",
      "From Cooper Square, Maidenhead's independent shops, restaurants and bars are a matter of minutes on foot. The Elizabeth Line station, providing direct access to London Paddington in around 18 minutes, is within comfortable walking distance — making this an outstanding choice for commuters and town-centre enthusiasts alike.",
    ],
    quickStats: [
      { icon: "🏢", label: "Home type", value: "Apartments" },
      { icon: "🛏", label: "Bedrooms", value: "1, 2 & 3 bed" },
      { icon: "📍", label: "Location", value: "Town Centre, SL6" },
      { icon: "✅", label: "Status", value: "Available Now" },
    ],
    amenities: [
      { icon: "🏙", text: "Town-centre location" },
      { icon: "🛋", text: "Open-plan living" },
      { icon: "🌅", text: "Private balconies" },
      { icon: "🚗", text: "Allocated parking" },
      { icon: "⚡", text: "A-rated energy efficient" },
      { icon: "🏗", text: "NHBC 10-year warranty" },
      { icon: "🔑", text: "Fitted kitchen, integrated appliances" },
      { icon: "🚂", text: "Elizabeth Line nearby" },
    ],
    nearbyPlaces: [
      { name: "Maidenhead Station (Elizabeth Line)", distance: "11 min walk", mode: "walk" },
      { name: "London Paddington", distance: "18 min", mode: "train" },
      { name: "Maidenhead High Street", distance: "5 min walk", mode: "walk" },
      { name: "Windsor & Eton", distance: "16 min drive", mode: "car" },
      { name: "M4 Motorway (J8/9)", distance: "8 min drive", mode: "car" },
      { name: "Heathrow Airport", distance: "25 min drive", mode: "car" },
    ],
  },
  {
    slug: "the-waypoint",
    name: "The Waypoint",
    developer: "Allsop Letting & Management",
    tagline: "Premium build-to-rent living steps from the Elizabeth Line",
    location: "Station Road, Maidenhead SL6 1NB",
    status: "Available Now",
    website: "https://www.thewaypoint-maidenhead.co.uk",
    email: "hello@thewaypoint-maidenhead.co.uk",
    phone: null,
    image: img("mh-wp-hero", 1400, 900),
    hero: img("mh-wp-hero", 1400, 900),
    gallery: [
      img("mh-wp-hero", 1200, 800),
      img("mh-wp-lounge", 900, 600),
      img("mh-wp-gym", 900, 600),
      img("mh-wp-garden", 900, 600),
    ],
    description:
      "The Waypoint is Maidenhead's flagship build-to-rent community — a professionally managed collection of one, two and three-bedroom apartments positioned just moments from the Elizabeth Line, offering residents an unrivalled combination of premium amenities, flexible tenure and genuine community.",
    longDescription: [
      "The Waypoint redefines what it means to rent in Maidenhead. Unlike traditional rental properties, this is a purpose-built community designed from the ground up around the needs of modern renters — with a dedicated professional management team on-site, exceptional shared amenities, and flexible leasing options to suit every lifestyle.",
      "At the heart of The Waypoint is a suite of resident-only amenities that genuinely set it apart: a fully equipped fitness studio, co-working spaces and private meeting rooms for those working from home, a beautifully designed residents' lounge for socialising, and landscaped communal gardens that bring the outside in. Every detail has been considered.",
      "Homes are available furnished — with stylish BoConcept furniture packages — or unfurnished, giving residents the freedom to make their apartment truly their own. With Maidenhead Elizabeth Line station just moments away, Central London is under an hour. The Thames, independent restaurants and the regenerated waterfront are all within a short walk.",
    ],
    quickStats: [
      { icon: "🏢", label: "Home type", value: "Apartments" },
      { icon: "🛏", label: "Bedrooms", value: "1, 2 & 3 bed" },
      { icon: "📍", label: "Location", value: "Station Road, SL6" },
      { icon: "🔑", label: "Tenure", value: "Rental (BTR)" },
    ],
    amenities: [
      { icon: "🏋️", text: "Residents' fitness studio" },
      { icon: "💻", text: "Co-working spaces" },
      { icon: "🤝", text: "Private meeting rooms" },
      { icon: "🛋", text: "Residents' lounge" },
      { icon: "🛎", text: "Professional on-site management" },
      { icon: "🌿", text: "Landscaped communal gardens" },
      { icon: "🛏", text: "BoConcept furnished option" },
      { icon: "🚂", text: "Elizabeth Line · moments away" },
    ],
    nearbyPlaces: [
      { name: "Maidenhead Station (Elizabeth Line)", distance: "2 min walk", mode: "walk" },
      { name: "London Paddington", distance: "18 min", mode: "train" },
      { name: "Waterside Quarter & Restaurants", distance: "5 min walk", mode: "walk" },
      { name: "Maidenhead High Street", distance: "7 min walk", mode: "walk" },
      { name: "Thames Riverside Walks", distance: "10 min walk", mode: "walk" },
      { name: "Heathrow Airport", distance: "25 min drive", mode: "car" },
    ],
  },
  {
    slug: "willows-edge",
    name: "Willows Edge",
    developer: "Bellway Homes",
    tagline: "Stunning new-build homes at the semi-rural edge of Maidenhead",
    location: "Aldebury Road, North Town, Maidenhead SL6 7HJ",
    status: "Coming Soon",
    website: "https://www.bellway.co.uk/new-homes/thames-valley/willows-edge",
    email: "thamesvalley@bellway.co.uk",
    phone: "01628 879 418",
    image: img("mh-we-hero", 1400, 900),
    hero: img("mh-we-hero", 1400, 900),
    gallery: [
      img("mh-we-hero", 1200, 800),
      img("mh-we-street", 900, 600),
      img("mh-we-interior", 900, 600),
      img("mh-we-garden", 900, 600),
    ],
    description:
      "Willows Edge is a wonderful addition to the North Town community of Maidenhead, bringing stunning new-build 2, 3 and 4-bedroom homes to the desirable semi-rural edge of this thriving market town. Built by Bellway Homes, each property is designed with energy efficiency at its core.",
    longDescription: [
      "Willows Edge sits at the northern edge of Maidenhead, where the town meets open countryside — a rare combination of semi-rural tranquillity and genuine urban convenience. Set just off Aldebury Road in North Town, the development is moments from North Town Moor, a National Trust-maintained green open space, yet within easy reach of Maidenhead's town centre, schools and transport links.",
      "Bellway Homes has designed Willows Edge with sustainability and future-ready living at the forefront. Every home is built to an energy-efficient specification and comes equipped with EV charging points, solar panels and an air-source heat pump — significantly reducing both carbon footprint and running costs for residents.",
      "With 2, 3 and 4-bedroom homes available, Willows Edge appeals to a broad range of buyers: families looking to upsize, first-time buyers seeking more space, and existing Maidenhead residents ready to move into a brand-new, low-maintenance home. Furze Platt station — with connections to Maidenhead and the Elizabeth Line — is just a 10-minute walk away.",
    ],
    quickStats: [
      { icon: "🏡", label: "Home type", value: "Houses" },
      { icon: "🛏", label: "Bedrooms", value: "2, 3 & 4 bed" },
      { icon: "📍", label: "Location", value: "North Town, SL6" },
      { icon: "🔜", label: "Status", value: "Coming Soon" },
    ],
    amenities: [
      { icon: "⚡", text: "EV charging points" },
      { icon: "☀️", text: "Solar panels" },
      { icon: "🌡", text: "Air-source heat pumps" },
      { icon: "🌿", text: "Semi-rural setting" },
      { icon: "🏡", text: "Private gardens" },
      { icon: "🚗", text: "Driveway parking" },
      { icon: "🏗", text: "NHBC 10-year warranty" },
      { icon: "🌳", text: "North Town Moor · 2 min walk" },
    ],
    nearbyPlaces: [
      { name: "North Town Moor (National Trust)", distance: "2 min walk", mode: "walk" },
      { name: "St Mary's Catholic Primary School", distance: "3 min walk", mode: "walk" },
      { name: "Furze Platt Station", distance: "10 min walk", mode: "walk" },
      { name: "Maidenhead Town Centre", distance: "5 min drive", mode: "car" },
      { name: "Summerleaze Lake", distance: "8 min drive", mode: "car" },
      { name: "M4 Motorway (J8/9)", distance: "8 min drive", mode: "car" },
      { name: "Heathrow Airport", distance: "25 min drive", mode: "car" },
    ],
  },
];

export const buildingBySlug = Object.fromEntries(buildings.map((b) => [b.slug, b]));

// ─── Apartment / home listings ────────────────────────────────────────────────
let propIndex = 0;
function prop(slug, buildingSlug, status, beds, bedLabel, price, baths, sqft, floor) {
  const b = buildingBySlug[buildingSlug];
  const k = propIndex++;
  const gallery = [pick(PIC.living, k), pick(PIC.kitchen, k), pick(PIC.bedroom, k), pick(PIC.balcony, k)];
  return {
    slug,
    buildingSlug,
    building: b.name,
    location: b.location,
    status,
    beds,
    bedLabel,
    price,
    baths,
    sqft,
    floor,
    image: gallery[0],
    gallery,
    propertyType: "flat",
    description:
      `A beautifully presented ${bedLabel.toLowerCase()} property at ${b.name}, finished to a high specification throughout. Bright open-plan living space, a contemporary fitted kitchen and a private outdoor space make this a standout home in one of Maidenhead's most sought-after addresses.`,
    features: [
      `${bedLabel} property`,
      `${baths} bathroom${baths > 1 ? "s" : ""}`,
      `${sqft} sq ft`,
      floor,
      "Fitted kitchen with integrated appliances",
      "Private balcony / terrace",
      "Allocated parking",
      "Elizabeth Line within walking distance",
    ],
  };
}

export const properties = [
  // ── Waterside Quarter ──
  prop("ws-2bed-apt-4",   "waterside-quarter", "sale", 2,  "2 Bedroom",  475000, 2, 785,  "4th floor"),
  prop("ws-penthouse-9",  "waterside-quarter", "sale", 99, "Penthouse",  850000, 2, 1240, "9th floor"),
  prop("ws-1bed-apt-2",   "waterside-quarter", "sale", 1,  "1 Bedroom",  350000, 1, 560,  "2nd floor"),
  prop("ws-1bed-rent-3",  "waterside-quarter", "rent", 1,  "1 Bedroom",  1500,   1, 560,  "3rd floor"),
  prop("ws-2bed-rent-6",  "waterside-quarter", "rent", 2,  "2 Bedroom",  1950,   2, 790,  "6th floor"),

  // ── Brunel Place ──
  prop("bp-studio-1",     "brunel-place", "sale", 0, "Studio",    255000, 1, 395, "1st floor"),
  prop("bp-1bed-apt-3",   "brunel-place", "sale", 1, "1 Bedroom", 315000, 1, 520, "3rd floor"),
  prop("bp-2bed-apt-5",   "brunel-place", "sale", 2, "2 Bedroom", 430000, 2, 740, "5th floor"),
  prop("bp-1bed-rent-2",  "brunel-place", "rent", 1, "1 Bedroom", 1425,   1, 515, "2nd floor"),
  prop("bp-2bed-rent-4",  "brunel-place", "rent", 2, "2 Bedroom", 1850,   2, 745, "4th floor"),

  // ── Cooper Square ──
  prop("cs-2bed-apt-2",   "cooper-square", "sale", 2, "2 Bedroom",  420000, 2, 760,  "2nd floor"),
  prop("cs-3bed-apt-6",   "cooper-square", "sale", 3, "3 Bedroom",  565000, 2, 1010, "6th floor"),
  prop("cs-2bed-rent-3",  "cooper-square", "rent", 2, "2 Bedroom",  1795,   2, 760,  "3rd floor"),
  prop("cs-3bed-rent-7",  "cooper-square", "rent", 3, "3 Bedroom",  2200,   2, 1010, "7th floor"),

  // ── The Waypoint (BTR — rent only) ──
  prop("wp-1bed-rent-1",  "the-waypoint", "rent", 1, "1 Bedroom", 1550, 1, 580,  "3rd floor"),
  prop("wp-2bed-rent-2",  "the-waypoint", "rent", 2, "2 Bedroom", 2050, 2, 820,  "7th floor"),
  prop("wp-3bed-rent-3",  "the-waypoint", "rent", 3, "3 Bedroom", 2750, 2, 1150, "12th floor"),

  // ── Willows Edge (sale only — coming soon, no current listings) ──
];

export const propertyBySlug = Object.fromEntries(properties.map((p) => [p.slug, p]));

// ─── Filter option sets ──────────────────────────────────────────────────────
export const bedroomOptions = [
  { value: "all", label: "All" },
  { value: "0",   label: "Studio" },
  { value: "1",   label: "1 Bedroom" },
  { value: "2",   label: "2 Bedrooms" },
  { value: "3",   label: "3 Bedrooms" },
  { value: "4",   label: "4 Bedrooms" },
  { value: "99",  label: "Penthouse" },
];

export const salePrices = [100000, 250000, 350000, 450000, 550000, 750000, 1000000];
export const rentPrices  = [1000, 1250, 1500, 1750, 2000, 2500, 3000];

// ─── "Why Live Here" lifestyle content ───────────────────────────────────────
export const live = {
  hero: {
    eyebrow: "Live",
    title: "Why Live in Maidenhead",
    intro:
      "A riverside town unlike anywhere else within easy reach of the city — a green, connected and thriving place to call home, with the Thames on your doorstep and London just 18 minutes away.",
    image: PIC.extHero,
  },
  pillars: [
    {
      icon: "🌳",
      title: "Nature",
      subtitle: "The Thames on your doorstep",
      image: "/images/slide-bridge.jpg",
      lines: ["5km riverside trails", "Acres of green space", "Thames Path access"],
      link: { label: "Explore Outdoors", to: "/see-do" },
      span: "md:col-span-1 md:row-span-2",
      big: true,
    },
    {
      icon: "🎭",
      title: "Community & Culture",
      subtitle: "Everything happening on your doorstep",
      image: "/images/slide-river.jpg",
      lines: ["Independent shops", "Vibrant food scene", "Year-round events"],
      link: { label: "See What's On", to: "/see-do" },
      span: "md:col-span-2",
    },
    {
      icon: "🛡️",
      title: "Safe & Secure",
      subtitle: "Peace of mind, built in",
      image: "/images/live/ext-waterside.jpg",
      lines: ["Well-managed neighbourhoods", "Concierge buildings", "A genuine sense of community"],
      link: { label: "Learn More", to: "/live/overview" },
      span: "",
    },
    {
      icon: "🚄",
      title: "Convenience",
      subtitle: "London in under 20 minutes",
      image: "/images/getting-here.jpg",
      lines: ["Elizabeth Line & GWR", "18–20 mins to Paddington", "Everything close to home"],
      link: { label: "Travel Connections", to: "/live/overview" },
      span: "",
    },
  ],
  designedAroundYou: [
    {
      tab: "Green Spaces",
      title: "Green Spaces",
      body: "From Kidwells Park to the riverside meadows, nature is never more than a short stroll away.",
      stats: [
        { icon: "🌳", value: "120+", label: "Acres of green space" },
        { icon: "🚶", value: "5km",  label: "Riverside walks" },
        { icon: "🦢", value: "15+",  label: "Nature spots" },
      ],
      images: ["/images/live/dau/green-1.jpg", "/images/live/dau/green-2.jpg", "/images/live/dau/green-3.jpg", "/images/ql-green.jpg"],
    },
    {
      tab: "Eating & Drinking",
      title: "Eating & Drinking",
      body: "Waterfront restaurants, independent cafés and lively bars line the regenerated town centre.",
      stats: [
        { icon: "🍽", value: "80+",   label: "Cafés, bars & restaurants" },
        { icon: "🌍", value: "20+",   label: "Cuisines to explore" },
        { icon: "🛶", value: "5 min", label: "To the riverside" },
      ],
      images: ["/images/coppa/terrace.jpg", "/images/slide-river.jpg", "/images/coppa/dining.jpg", "/images/card-cafe.jpg"],
    },
    {
      tab: "Shopping",
      title: "Shopping",
      body: "Nicholsons Quarter, the high street and weekend markets cover everything from everyday essentials to something special.",
      stats: [
        { icon: "🛍", value: "120+", label: "Shops & services" },
        { icon: "🏬", value: "2",    label: "Shopping quarters" },
        { icon: "🧺", value: "Sat",  label: "Weekly market" },
      ],
      images: ["/images/live/dau/shop-1.jpg", "/images/live/dau/shop-2.jpg", "/images/live/dau/shop-3.jpg", "/images/ql-shop.jpg"],
    },
    {
      tab: "Fitness & Wellness",
      title: "Fitness & Wellness",
      body: "Gyms, studios, padel courts and the leisure centre keep an active lifestyle effortless.",
      stats: [
        { icon: "🏋️", value: "10+", label: "Gyms & studios" },
        { icon: "🎾", value: "4",   label: "Padel courts" },
        { icon: "🧘", value: "1",   label: "Leisure centre" },
      ],
      images: ["/images/live/dau/fit-1.jpg", "/images/live/dau/fit-2.jpg", "/images/live/dau/fit-3.jpg", "/images/ql-wellness.jpg"],
    },
  ],
};

// ─── Live dropdown menu ───────────────────────────────────────────────────────
export const liveMenu = {
  key: "live",
  label: "Live",
  path: "/live",
  columns: [
    {
      heading: "For Sale & Rent",
      links: [
        { label: "Properties For Sale", to: "/live/for-sale" },
        { label: "Properties For Rent", to: "/live/for-rent" },
      ],
    },
    {
      heading: "Living in Maidenhead",
      links: [
        { label: "Why Live Here", to: "/live" },
        { label: "The Future",   to: "/explore/the-future" },
      ],
    },
    {
      heading: "Developments",
      links: buildings.map((b) => ({ label: b.name, to: `/live/building/${b.slug}` })),
    },
  ],
};

// Shared price formatting
export const fmtPrice = (p, status) =>
  status === "rent" ? `£${p.toLocaleString()} pcm` : `£${p.toLocaleString()}`;
