// ════════════════════════════════════════════════════════════════════════════
//  Attraction / "things to do" pages — e.g. Boulter's Lock & Ray Mill Island.
//  Route: /attraction/:slug  →  AttractionPage
//  "You might like" pulls relevant listings from the See & Do section.
//
//  NOTE: body copy below is placeholder — replace with the client's final text.
// ════════════════════════════════════════════════════════════════════════════

export const attractions = {
  "boulters-lock": {
    slug: "boulters-lock",
    eyebrow: "On the River",
    title: "Discover Boulters Lock and Ray Mill Island: Maidenhead's Riverside Gems",
    tag: "On the River",
    subtitle: "Two riverside attractions offering natural beauty, local history, wildlife and relaxing waterside scenery — a short walk from the town centre.",
    hero: "/images/attractions/boulters-lock.jpg",
    gallery: [
      "/images/attractions/boulters-lock.jpg",
      "/images/attractions/lock-boat.jpg",
      "/images/attractions/swan.jpg",
      "/images/attractions/garden-path.jpg",
      "/images/slide-bridge.jpg",
    ],
    // Long-form content organised into sections; some sections carry an image.
    intro: [
      "If you are planning a visit to Maidenhead, there are few places that capture the charm of the River Thames quite like Boulters Lock and Ray Mill Island. Just a short walk from Maidenhead town centre, these two riverside attractions offer a perfect combination of natural beauty, local history, wildlife, and relaxing waterside scenery.",
      "Whether you are visiting for a weekend break, a family day out, or simply looking for a peaceful place to unwind, Boulters Lock and Ray Mill Island deserve a place at the top of your Maidenhead itinerary.",
    ],
    sections: [
      {
        heading: "Boulters Lock: A Window into Life on the Thames",
        image: "/images/attractions/lock-boat.jpg",
        paras: [
          "Situated on one of the most picturesque stretches of the River Thames, Boulters Lock has been an important part of river life for generations. Watching boats navigate the lock is a fascinating experience, especially during the warmer months when pleasure cruisers, rowing boats, and narrowboats bring the river to life.",
          "The lock is surrounded by attractive riverside paths, mature trees, and beautifully maintained green spaces, making it an ideal location for a leisurely stroll. Visitors can pause to watch the gentle movement of the water, enjoy the sight of boats passing through, or simply take in the tranquil atmosphere that has attracted artists, writers, and visitors for more than a century.",
          "The area is particularly popular on sunny afternoons, when the Thames becomes a vibrant scene of boating activity and riverside enjoyment.",
        ],
      },
      {
        heading: "Ray Mill Island: A Hidden Oasis",
        image: "/images/attractions/swan.jpg",
        paras: [
          "Connected by footbridges and nestled between branches of the Thames, Ray Mill Island feels like a secret retreat just moments from the town centre. This small but delightful island offers a peaceful escape from everyday life.",
          "Beautiful gardens, open lawns, and riverside viewpoints make it a favourite destination for walkers, photographers, and families. Children enjoy exploring the island's pathways and wildlife areas, while adults appreciate the calm surroundings and stunning river views.",
          "One of the island's most charming features is its abundance of wildlife. Visitors may spot swans gliding across the water, ducks nesting along the banks, and a variety of other birds that make the island their home. The combination of nature and riverside scenery creates a relaxing environment that encourages visitors to slow down and enjoy the moment.",
        ],
      },
      {
        heading: "Perfect for Walks and Riverside Relaxation",
        image: "/images/attractions/garden-path.jpg",
        paras: [
          "Together, Boulters Lock and Ray Mill Island create one of Maidenhead's most attractive walking routes. The riverside paths are accessible and easy to explore, making them suitable for visitors of all ages.",
          "A visit can be as active or as relaxed as you choose. Spend time watching the boats, enjoy a picnic beside the water, take photographs of the Thames, or simply find a bench and admire the ever-changing river landscape.",
          "The area is especially beautiful during spring and summer, when colourful flowers bloom and the riverside comes alive with activity. Autumn brings golden foliage and quieter pathways, offering a different but equally memorable experience.",
        ],
      },
      {
        heading: "A Unique Side of Maidenhead",
        paras: [
          "While Maidenhead is known for its excellent transport connections, shopping, and vibrant community, Boulters Lock and Ray Mill Island showcase the town's softer, more scenic side. They provide visitors with an opportunity to experience the natural beauty of the Thames while remaining close to the amenities of the town centre.",
          "For anyone discovering Maidenhead for the first time, these riverside landmarks offer an authentic glimpse of what makes the area special: a blend of history, nature, and timeless English riverside charm.",
        ],
      },
      {
        heading: "Plan Your Visit",
        paras: [
          "No trip to Maidenhead is complete without spending time by the river. Whether you are arriving for a day visit or staying longer in the Royal Borough, Boulters Lock and Ray Mill Island offer an unforgettable experience that combines relaxation, scenery, and local character.",
          "Come and discover why generations of visitors have fallen in love with this beautiful corner of Maidenhead and experience the magic of the Thames for yourself.",
        ],
      },
    ],
    highlights: ["Historic Thames lock & weir", "Ray Mill Island gardens", "Riverside walks & picnics", "Swans & riverside wildlife"],
    address: "Boulter's Lock, Ray Mill Road East, Maidenhead SL6 8PE",
    mapQuery: "Boulter's Lock, Maidenhead",
    // Related See & Do listings (by slug) shown in "You might like"
    related: ["riverside-jazz-festival", "maidenhead-heritage-walk", "parkrun-maidenhead"],
  },

  "waterfront-dining": {
    slug: "waterfront-dining",
    eyebrow: "Eat & Drink",
    title: "Waterfront Dining & Bars",
    tag: "Eat & Drink",
    subtitle: "From sunny terraces beside the water to lively bars and independent kitchens, Maidenhead's regenerated waterfront is where the town comes to eat, drink and relax.",
    hero: "/images/slide-river.jpg",
    gallery: [
      "/images/slide-river.jpg",
      "/images/coppa/terrace.jpg",
      "/images/coppa/dining.jpg",
      "/images/coppa/bar.jpg",
    ],
    intro: [
      "Maidenhead's waterways have been transformed into one of the town's most enjoyable places to spend an afternoon or evening. Along Chapel Arches and the restored waterfront, a growing collection of restaurants, bars and cafés spill out onto the water's edge, creating a relaxed, continental atmosphere just minutes from the station.",
      "Whether you're after brunch in the sunshine, cocktails by the water or a long, leisurely dinner, there's a table waiting beside the river.",
    ],
    sections: [
      {
        heading: "Terraces by the Water",
        image: "/images/coppa/terrace.jpg",
        paras: [
          "When the weather is good, there's nowhere better than a waterside terrace. Tables line the canalside, umbrellas go up, and the whole area takes on a holiday feel as diners watch the boats drift past.",
          "From light lunches to leisurely weekend brunches, the terraces are made for slowing down and enjoying the view.",
        ],
      },
      {
        heading: "Independent Kitchens & Global Flavours",
        image: "/images/coppa/dining.jpg",
        paras: [
          "The waterfront is home to a diverse mix of independent restaurants and well-loved names, with menus spanning tapas, modern British, Italian, Indian and more. It's a genuine food destination that rewards repeat visits.",
          "Many venues source seasonally and change their menus through the year, so there's always something new to discover.",
        ],
      },
      {
        heading: "Bars & Evenings Out",
        image: "/images/coppa/bar.jpg",
        paras: [
          "As the sun sets, the waterfront shifts gear. Bars come alive with cocktails, craft beer and a buzzy after-work crowd, making it a natural meeting point for friends and a great start to a night out.",
          "With everything within a short stroll, it's easy to move from dinner to drinks without ever leaving the water's edge.",
        ],
      },
    ],
    highlights: ["Waterside terraces", "Independent restaurants & bars", "Brunch, dinner & cocktails", "5 min walk from the station"],
    address: "Chapel Arches, Maidenhead SL6 1QS",
    mapQuery: "Chapel Arches, Maidenhead",
    related: ["coppa-club", "el-cerdo", "bombay-story"],
  },

  "hw-taplow": {
    slug: "hw-taplow",
    eyebrow: "Featured Venue",
    title: "H&W Taplow — Thames Terrace",
    tag: "Featured Venue",
    subtitle: "A stunning riverside restaurant and terrace on the banks of the Thames, just across the water from Maidenhead.",
    hero: "/images/slide-cafe.jpg",
    gallery: [
      "/images/slide-cafe.jpg",
      "/images/coppa/terrace.jpg",
      "/images/coppa/dining.jpg",
      "/images/coppa/bar.jpg",
    ],
    intro: [
      "Set right on the banks of the River Thames, H&W Taplow is one of the area's most spectacular places to eat and drink. With a striking timber building and a wraparound terrace overlooking the water, it brings together great food, relaxed surroundings and an unbeatable riverside setting.",
      "It's an easy trip from Maidenhead town centre and makes the perfect destination for a long lunch, sundowners on the terrace or a special occasion by the river.",
    ],
    sections: [
      {
        heading: "A Terrace on the Thames",
        image: "/images/slide-cafe.jpg",
        paras: [
          "The real star of the show is the terrace. Stretching along the river's edge, it offers wide-open views over the water and the surrounding countryside — a genuinely memorable place to sit with a drink and watch the world (and the boats) go by.",
          "On warm days it's the kind of spot you'll want to settle into for hours.",
        ],
      },
      {
        heading: "Relaxed Dining, Riverside Setting",
        image: "/images/coppa/dining.jpg",
        paras: [
          "Inside, the light-filled space pairs a warm, contemporary feel with the same beautiful river outlook. The menu focuses on fresh, seasonal dishes and an easy-going atmosphere that works just as well for families as for celebrations.",
          "Whether you're stopping by for coffee and cake or settling in for dinner, it's a welcoming place to spend time.",
        ],
      },
    ],
    highlights: ["Riverside Thames terrace", "Seasonal menu", "Family-friendly", "Moorings & parking"],
    address: "Mill Lane, Taplow, Maidenhead SL6 0AA",
    mapQuery: "Hall and Woodhouse Taplow, Maidenhead",
    related: ["hall-woodhouse", "coppa-club", "el-cerdo"],
  },
};

export const attractionBySlug = attractions;
