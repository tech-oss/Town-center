// ════════════════════════════════════════════════════════════════════════════
//  Travel, parking and "good to know" content for Maidenhead.
//  Single source of truth shared by the website's Getting Here page
//  (components/GettingHerePage.jsx) and the mobile app's Transport and
//  Parking screens (mobile/pages/TransportScreen, ParkingScreen).
// ════════════════════════════════════════════════════════════════════════════

export const travelSections = [
  {
    id: "transport",
    eyebrow: "By Train & Bus",
    heading: "Public Transport",
    image: "/images/getting-here.jpg",
    intro:
      "Maidenhead is one of the best-connected towns in the Thames Valley, sitting on the Elizabeth Line with direct, frequent services into central London and out towards Reading.",
    blocks: [
      {
        title: "Elizabeth Line",
        body: "Direct trains to London Paddington in around 25–30 minutes, continuing across central London to Liverpool Street, Canary Wharf and Abbey Wood without changing. Westbound services run to Twyford and Reading.",
      },
      {
        title: "Great Western Railway",
        body: "GWR services also call at Maidenhead, with connections towards Reading and the West, plus the branch line to Furze Platt, Cookham, Bourne End and Marlow.",
      },
      {
        title: "Buses",
        body: "Local bus services link the town centre with surrounding neighbourhoods, the station and nearby towns. Main stops are a short walk from the High Street.",
      },
    ],
  },
  {
    id: "driving",
    eyebrow: "By Car",
    heading: "Driving & Roads",
    image: "/images/card-bridge.jpg",
    intro:
      "Maidenhead is easily reached from the motorway and trunk-road network, making it a simple drive from London, Reading, Heathrow and the wider Thames Valley.",
    blocks: [
      {
        title: "From the M4",
        body: "Leave at Junction 8/9 (Maidenhead) and follow the A404(M) and A308(M) into the town centre. Junction 7 (Slough West) also gives access via the A4.",
      },
      {
        title: "From the M40 & A404",
        body: "The A404 links down through Marlow to Maidenhead and the M4 — a convenient route from High Wycombe and the north.",
      },
      {
        title: "Main routes",
        body: "The A4 (Bath Road), A308 (towards Windsor) and A4094 (towards Cookham) all feed directly into the town centre.",
      },
    ],
  },
  {
    id: "parking",
    eyebrow: "Where to Park",
    heading: "Parking",
    image: "/images/ql-parking.jpg",
    intro:
      "There are several town-centre car parks within a short walk of the shops, restaurants and the waterway — most operated by the Royal Borough of Windsor & Maidenhead.",
    blocks: [
      {
        title: "Nicholsons Car Park",
        body: "Multi-storey parking in the heart of the town centre, directly serving Nicholsons Quarter, the High Street and the shopping area.",
      },
      {
        title: "Vicus Way & Hines Meadow",
        body: "Large multi-storey car parks close to the station — ideal for commuters and longer visits to the town centre.",
      },
      {
        title: "Broadway, West Street & Stafferton Way",
        body: "Additional surface and multi-storey parking, with short-stay options handy for a quick shop or coffee.",
      },
    ],
    note:
      "Blue Badge holders can use designated accessible bays across the town-centre car parks. Always check on-site signage for the latest tariffs and opening times.",
  },
  {
    id: "cycling",
    eyebrow: "On Foot & By Bike",
    heading: "Walking & Cycling",
    image: "/images/slide-river.jpg",
    intro:
      "The town centre is compact and flat, making it easy to get around on foot, with a growing network of cycle routes linking the town with the river and surrounding villages.",
    blocks: [
      {
        title: "Cycle routes",
        body: "Signed cycle routes connect the town centre, the station and residential neighbourhoods, with quieter riverside paths towards Boulter's Lock and the Thames Path.",
      },
      {
        title: "The riverside",
        body: "The Thames Path runs alongside the river just east of the town — a scenic, traffic-free walking and cycling route towards Boulter's Lock, Ray Mill Island and beyond.",
      },
    ],
  },
];

export const travelStats = [
  { value: "~25 min", label: "To London Paddington" },
  { value: "Elizabeth", label: "Line & GWR services" },
  { value: "6+", label: "Town-centre car parks" },
  { value: "M4 J8/9", label: "Direct motorway access" },
];

export const goodToKnow = [
  {
    id: "opening-hours",
    title: "Opening Hours",
    body: "Most shops in the town centre open from around 9am to 5:30pm, Monday to Saturday, with reduced hours on Sundays. Cafés, bars and restaurants keep their own hours, often staying open later into the evening. Individual opening times are listed on each business page.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: "Maidenhead station offers step-free access to all platforms, and the town centre is largely pedestrianised and level. Accessible parking bays, dropped kerbs and accessible toilets are available throughout. Many venues offer step-free entry — check individual business pages for details.",
  },
  {
    id: "maps",
    title: "Maps & Finding Your Way",
    body: "The town centre is easy to navigate on foot, with the High Street, Nicholsons Quarter and the regenerated waterway all within a few minutes' walk of one another. Use the Get Directions link on any business page to open turn-by-turn directions in your maps app.",
  },
];

// Town-centre car parks — `query` is fed straight to Google Maps directions.
export const carParks = [
  { label: "Nicholsons", query: "Nicholsons Car Park, Maidenhead" },
  { label: "Vicus Way", query: "Vicus Way Car Park, Maidenhead" },
  { label: "Hines Meadow", query: "Hines Meadow Car Park, Maidenhead" },
  { label: "Stafferton Way", query: "Stafferton Way Car Park, Maidenhead" },
];
