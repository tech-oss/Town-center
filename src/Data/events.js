// ════════════════════════════════════════════════════════════════════════════
//  "What's On" — real, current Maidenhead events.
//  Sourced from Maidenhead Festival (mheadfestival.weebly.com), Norden Farm and
//  the face2face Maidenhead what's-on listings. Imagery is placeholder (the
//  source images are hotlink-protected) — swap for licensed event photos later.
//  Detail pages live at /event/:slug.
// ════════════════════════════════════════════════════════════════════════════

// Category → coloured dot (matches the pill style on cards & detail pages)
export const categoryColors = {
  Music: "#2F8C8C",
  Family: "#E8A33D",
  Market: "#4C9A2A",
  Festive: "#C0392B",
  Theatre: "#8E44AD",
};

export const events = [
  {
    slug: "duck-derby-fun-day",
    category: "Family",
    title: "Duck Derby & Fun Day",
    date: "Sunday 14 June 2026",
    time: "12pm – 5pm",
    location: "Ray Mill Island, Maidenhead",
    tickets: "Free entry",
    image: "/images/events/family.jpg",
    excerpt: "A family-favourite afternoon of duck racing, games and riverside fun on Ray Mill Island.",
    standfirst:
      "A family-favourite afternoon of duck racing, games and riverside fun in one of Maidenhead's prettiest spots.",
    body: [
      { lead: "A day out for all the family", text: "The much-loved Duck Derby returns to Ray Mill Island with a packed programme of family activities, stalls and games throughout the afternoon." },
      { text: "Cheer on your duck as it races along the river, then enjoy the relaxed riverside atmosphere with food, refreshments and plenty to keep all ages entertained." },
    ],
    gallery: ["/images/events/family.jpg", "/images/events/market.jpg", "/images/events/popup.jpg"],
  },
  {
    slug: "maidenhead-farmers-market",
    category: "Market",
    title: "Maidenhead Farmers' Market",
    date: "Every Sunday",
    time: "9:30am – 1pm",
    location: "Grove Road Car Park, Maidenhead",
    tickets: "Free entry",
    image: "/images/events/market.jpg",
    excerpt: "Fresh, local produce from independent growers and makers, every Sunday in the town centre.",
    standfirst:
      "Fresh, local produce from independent growers and makers — every Sunday, right in the heart of town.",
    body: [
      { lead: "Shop local, every Sunday", text: "Maidenhead Farmers' Market brings together local produce vendors offering fresh fruit and vegetables, artisan breads, cheeses, meats, preserves and more." },
      { text: "It's the perfect way to support local producers, discover seasonal ingredients and pick up something special for the week ahead." },
    ],
    gallery: ["/images/events/market.jpg", "/images/events/shopping.jpg", "/images/events/popup.jpg"],
  },
  {
    slug: "battle-of-the-choirs",
    category: "Music",
    title: "Maidenhead Festival: Battle of the Choirs",
    date: "Saturday 18 July 2026",
    time: "From 2pm",
    location: "Maidenhead Town Centre",
    tickets: "Free, non-ticketed",
    image: "/images/events/music.jpg",
    excerpt: "Local choirs go head-to-head with bold arrangements, big voices and an electric atmosphere.",
    standfirst:
      "Think Battle of the Bands, but for choirs — local choirs go head-to-head in a celebration of big voices and bold arrangements.",
    body: [
      { lead: "Big voices, bold arrangements", text: "Local choirs take to the stage with high-energy sets that range from classic anthems to contemporary reworkings, each bringing their own character and flair to the competition." },
      { text: "With an electric atmosphere and a friendly competitive spirit, it's a wonderful showcase of the singing talent that thrives across Maidenhead and the surrounding area." },
      { text: "Part of Maidenhead Festival — organised for the community, by the community." },
    ],
    gallery: ["/images/events/music.jpg", "/images/events/popup.jpg", "/images/events/shopping.jpg"],
  },
  {
    slug: "live-and-local-summer-sounds",
    category: "Music",
    title: "Live & Local: Summer Sounds",
    date: "Saturday 22 August 2026",
    time: "Afternoon",
    location: "Maidenhead Town Centre",
    tickets: "Free, non-ticketed",
    image: "/images/events/popup.jpg",
    excerpt: "A relaxed afternoon of live, local acoustic music in the heart of the town centre.",
    standfirst:
      "A relaxed afternoon of live, local music in the heart of the town centre.",
    body: [
      { lead: "Live & Local", text: "Summer Sounds brings local acoustic artists to the town centre for a casual, free-to-attend afternoon of music." },
      { text: "Grab a refreshment, find a spot in the sun and enjoy the relaxed atmosphere as performers fill the streets with the sounds of summer." },
    ],
    gallery: ["/images/events/popup.jpg", "/images/events/music.jpg", "/images/events/family.jpg"],
  },
  {
    slug: "battle-of-the-bands",
    category: "Music",
    title: "Maidenhead Festival: Battle of the Bands",
    date: "Saturday 19 September 2026",
    time: "Evening",
    location: "Maidenhead Town Centre",
    tickets: "Free, non-ticketed",
    image: "/images/events/shopping.jpg",
    excerpt: "Emerging artists compete across indie, rock, electronic and acoustic — and the audience decides the winner.",
    standfirst:
      "Emerging artists go head-to-head across indie, rock, electronic and acoustic — and the audience decides the winner.",
    body: [
      { lead: "The crowd picks the champion", text: "Battle of the Bands showcases some of the area's most exciting emerging artists across a range of genres, all competing for your vote." },
      { text: "Expect a high-energy evening of live music, standout performances and a real sense of community spirit as the town centre comes alive after dark." },
    ],
    gallery: ["/images/events/shopping.jpg", "/images/events/music.jpg", "/images/events/popup.jpg"],
  },
  {
    slug: "christmas-lights-switch-on",
    category: "Festive",
    title: "Christmas Lights Switch-On: Stage Takeover",
    date: "Saturday 21 November 2026",
    time: "Afternoon & evening",
    location: "Maidenhead Town Centre & Christmas Market",
    tickets: "Free, non-ticketed",
    image: "/images/events/festive.jpg",
    excerpt: "A multi-stage takeover bringing the town centre to life as the Christmas lights are switched on.",
    standfirst:
      "A multi-stage takeover bringing the town centre to life as Maidenhead switches on its Christmas lights.",
    body: [
      { lead: "A festive stage takeover", text: "Acoustic artists, choirs, bands, dance groups and performing arts schools take over multiple stages throughout the day during the Christmas Market." },
      { text: "Join the crowds for a magical evening of performances, festive food and seasonal cheer as Maidenhead officially switches on its Christmas lights." },
    ],
    gallery: ["/images/events/festive.jpg", "/images/events/shopping.jpg", "/images/events/music.jpg"],
  },
];

export const eventBySlug = Object.fromEntries(events.map((e) => [e.slug, e]));
