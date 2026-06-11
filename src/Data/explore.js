// ════════════════════════════════════════════════════════════════════════════
//  "Explore → The Future" — Maidenhead's future town-centre developments.
//  Editorial feature page centred on the Nicholson Quarter regeneration, plus
//  the wider map of major planned developments and the masterplan.
//  Route: /explore/the-future → ExploreFuturePage
//  Content provided by the client (Nicholson Quarter promotional summary).
// ════════════════════════════════════════════════════════════════════════════

export const explore = {
  hero: {
    eyebrow: "The Future · Maidenhead",
    title: "A New Chapter for Maidenhead",
    subtitle: "Welcome to the future Nicholson Quarter.",
    lead: "Maidenhead is on the cusp of its most significant town-centre transformation in generations.",
    image: "/images/explore/street.jpg",
  },

  vision: [
    "The upcoming Nicholson Quarter regeneration will create a vibrant new destination at the heart of the town, reimagining the former shopping centre as a thriving, modern neighbourhood designed for people to live, work, shop, dine and spend time together.",
    "More than a redevelopment, Nicholson Quarter represents a bold vision for Maidenhead's future. Designed around a network of attractive streets, public spaces and welcoming squares, the new quarter will reconnect key parts of the town centre while creating exciting new opportunities for residents, businesses and visitors alike.",
  ],

  stats: [
    { value: "55+", label: "New shops, bars & restaurants" },
    { value: "450+", label: "New homes & senior living" },
    { value: "1000s", label: "Residents consulted" },
    { value: "1", label: "Once-in-a-generation transformation" },
  ],

  // Alternating image + text feature blocks
  features: [
    {
      id: "winton-square",
      eyebrow: "The Heart of It All",
      heading: "Sir Nicholas Winton Square",
      image: "/images/explore/market.jpg",
      body: [
        "At its heart will be Sir Nicholas Winton Square — a landmark civic space named in honour of the humanitarian hero.",
        "Surrounded by cafés, restaurants, shops and community activities, the square will provide a focal point for events, celebrations and everyday life, creating a destination that is uniquely Maidenhead.",
      ],
    },
    {
      id: "new-town-centre",
      eyebrow: "Live · Work · Shop · Dine",
      heading: "A New Town Centre",
      image: "/images/explore/street.jpg",
      body: [
        "The plans will introduce over 55 new shops, bars and restaurants, alongside flexible workspace, high-quality homes and senior living accommodation.",
        "A strong emphasis has been placed on supporting independent businesses, local entrepreneurs and creative enterprises — helping to create a distinctive town-centre experience that complements the High Street and celebrates local character.",
      ],
    },
    {
      id: "yards-lanes",
      eyebrow: "Discover & Explore",
      heading: "Yards, Lanes & Public Spaces",
      image: "/images/explore/evening.jpg",
      body: [
        "Visitors can look forward to discovering a series of unique yards, lanes and public spaces designed to encourage exploration — from artisan retail and cultural venues in Brewery Yard to vibrant new streets lined with places to eat, meet and relax.",
        "The development has been carefully planned to create activity throughout the day and evening, bringing new energy and footfall into the town centre.",
      ],
    },
    {
      id: "green-connected",
      eyebrow: "Greener & Better Connected",
      heading: "Green Spaces & Easy Streets",
      image: "/images/explore/market.jpg",
      body: [
        "Green spaces, tree-lined streets and extensive landscaping will play a major role in shaping the new quarter.",
        "New public squares, enhanced pedestrian routes and improved connections across the town centre will make Maidenhead easier to navigate and more enjoyable to experience on foot.",
      ],
    },
  ],

  masterplan: {
    eyebrow: "The Masterplan",
    heading: "Explore the Nicholson Quarter",
    body: "A network of yards and squares — from Nicholson Yard and White Hart Yard to Brewery Yard and Sir Nicholas Winton Square — knitting new streets, homes, workspace, a cinema and health club into the heart of the town.",
    image: "/images/explore/masterplan.jpg",
  },

  developments: {
    eyebrow: "Across the Town",
    heading: "Major Current & Planned Developments",
    intro: "Nicholson Quarter is the centrepiece of a town-wide programme of regeneration. Here's what's shaping the wider future of Maidenhead.",
    image: "/images/explore/developments-map.jpg",
    items: [
      { tag: "Town Centre Regeneration", title: "Nicholson Quarter", desc: "Major mixed-use regeneration of the former shopping centre — 450+ homes, retail, leisure, offices and public space." },
      { tag: "Riverside & Station Edge", title: "Chapel Arches / Waterside Quarter", desc: "Riverside heritage regeneration with homes, cafés, retail and public realm along the waterway." },
      { tag: "Riverside & Station Edge", title: "York Road / The Landing", desc: "Residential-led redevelopment along the station corridor, steps from the Elizabeth Line." },
      { tag: "Riverside & Station Edge", title: "St Cloud Way / Waypoint", desc: "Build-to-rent scheme of around 255 homes with amenities and riverside access." },
      { tag: "South-West Growth", title: "Harvest Hill", desc: "Large new housing development delivered in phases, with new homes, green spaces and infrastructure." },
      { tag: "South-West Growth", title: "Maidenhead Golf Course (A13)", desc: "Strategic allocation for ~1,500–2,000 new homes plus schools, parks and community facilities." },
      { tag: "Employment & Industrial", title: "Reform Road / Employment Quarter", desc: "Industrial and logistics redevelopment delivering modern employment space and business units." },
      { tag: "Office & Business", title: "One Maidenhead / St Cloud Gate", desc: "Office-led regeneration and mixed-use conversions around the town centre and Statesman House." },
    ],
  },

  community: {
    heading: "Shaped by the Community",
    body: "Importantly, the regeneration has been shaped by extensive community consultation, with thousands of local residents contributing ideas and aspirations that have influenced the final plans. The result is a development designed not only for today, but for future generations.",
  },

  closing: {
    heading: "A Model for Town-Centre Renewal",
    body: [
      "As one of the UK's pioneering \"shopping centre to town centre\" regeneration projects, Nicholson Quarter has the potential to become a model for town-centre renewal nationwide. For Maidenhead, it represents a once-in-a-generation opportunity to create a more vibrant, connected and welcoming destination.",
      "The future Nicholson Quarter is more than a new development. It is the creation of a new heart for Maidenhead — a place where people can gather, explore, invest, celebrate and create lasting memories for decades to come.",
    ],
  },
};

// Explore dropdown menu (header)
export const exploreMenu = {
  key: "explore",
  label: "Explore",
  path: "/explore/the-future",
  columns: [
    {
      heading: "Explore",
      links: [{ label: "The Future", to: "/explore/the-future" }],
    },
  ],
};
