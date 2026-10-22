// Amenity lists for accommodation properties — the same lists the business
// portal's property editor uses (business-dashboard's businessPortalMock.js),
// so whatever admin ticks matches what the company sees and what the site's
// Live & Stay filters look for. Keep the two copies in step.

export const AMENITY_CATEGORIES = [
  {
    category: "Property Facilities",
    options: [
      "Spa and wellness center", "Hot tub", "Sauna", "Room service", "Massage",
      "Airport shuttle", "Garden", "24-hour front desk", "Fitness center",
      "Swimming pool", "Restaurant", "Free Wifi", "Non-smoking rooms",
      "Wheelchair accessible", "Electric vehicle charging station", "Bar",
      "Air conditioning", "Business center", "Playground", "Terrace",
      "BBQ facilities", "Parking", "Laundry", "Shared kitchen",
      "Pet friendly", "Adults only",
    ],
  },
  {
    category: "Room Facilities",
    options: [
      "Private bathroom", "Air conditioning", "Balcony", "Private pool",
      "Kitchen/Kitchenette", "Washing machine", "View", "Accessible room",
      "Private hot tub", "Terrace", "Kitchenette",
      "Complimentary evening snacks and drinks in the executive lounge",
      "Salt water pool", "Computer Game console", "Refrigerator", "Fax",
      "Video games", "Kitchen", "Flat-screen TV", "Pool cover",
      "Reading light", "Plunge pool", "Bath", "Lake view",
      "Clothes Iron", "Ironing Board", "Kettle", "Desk",
    ],
  },
  {
    // Who the stay suits, not a policy — "Pet friendly"/"Adults only" moved
    // to Property Facilities below, where a house rule belongs. Feeds the
    // main site's "Travel group" filter on the Hotels and Accommodation pages.
    category: "Travel Group",
    options: ["Solo travellers", "Couples", "Family", "Groups", "Business travellers"],
  },
];

export const STAR_RATINGS = [1, 2, 3, 4, 5];

// ─── Accommodation — Amenities, grouped by category (multi-select, no cap).
// Same Property/Room/Travel categories as Hotel, plus a Property Types
// category up front to describe what kind of accommodation it is, and Meals
// (accommodation only — a hotel's dining is covered by its own Restaurant
// facility above). Both feed filters on the main site's Accommodation
// listing page (StayListingPage.jsx / liveBusinesses.js). ───────────────────
export const ACCOMMODATION_AMENITY_CATEGORIES = [
  {
    category: "Property Types",
    options: [
      "Apartments", "Resorts", "Villas", "Vacation Homes",
      "Bed and Breakfasts", "Farm Stays", "Chalets", "Guesthouses", "Lodges",
      "Country Houses", "Homestays", "Campgrounds", "Boats", "Luxury tents",
      "Entire homes & apartments",
    ],
  },
  ...AMENITY_CATEGORIES,
  {
    category: "Meals",
    options: ["Self catering", "Breakfast included", "Half board", "Full board", "Restaurant on site"],
  },
];

export const ROOM_AMENITIES = AMENITY_CATEGORIES.find((c) => c.category === "Room Facilities")?.options ?? [];
// Paid property photos: 1 hero + up to 12 more.
export const PROPERTY_GALLERY_MAX = 12;
export const ROOMS_MAX = 20;
