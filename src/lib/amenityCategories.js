// Mirrors business-dashboard's AMENITY_CATEGORIES / ACCOMMODATION_AMENITY_CATEGORIES
// (src/Data/businessPortalMock.js on that repo) — the categorised checkbox
// list a hotel or accommodation business ticks on its own "Amenities" tab,
// all written into one flat business_listings.amenities array.
//
// The site's hotel/accommodation filters (Facilities, Room facilities,
// Meals, Travel group — StayListingPage.jsx, restored from what the old
// `main` branch's hardcoded demo data had split into separate fields) read
// real businesses' amenities instead, so this buckets that flat array back
// into the same categories the business ticked them under. Kept in sync by
// hand across the two repos — there's no shared package between them.
//
// If the two drift, an amenity just stops showing up under a filter until
// this list is updated to match; it never breaks anything else.

export const FACILITIES = [
  "Spa and wellness center", "Hot tub", "Sauna", "Room service", "Massage",
  "Airport shuttle", "Garden", "24-hour front desk", "Fitness center",
  "Swimming pool", "Restaurant", "Free Wifi", "Non-smoking rooms",
  "Wheelchair accessible", "Electric vehicle charging station", "Bar",
  "Air conditioning", "Business center", "Playground", "Terrace",
  "BBQ facilities", "Parking", "Laundry", "Shared kitchen",
  "Pet friendly", "Adults only",
];

export const ROOM_FACILITIES = [
  "Private bathroom", "Air conditioning", "Balcony", "Private pool",
  "Kitchen/Kitchenette", "Washing machine", "View", "Accessible room",
  "Private hot tub", "Terrace", "Kitchenette",
  "Complimentary evening snacks and drinks in the executive lounge",
  "Salt water pool", "Computer Game console", "Refrigerator", "Fax",
  "Video games", "Kitchen", "Flat-screen TV", "Pool cover",
  "Reading light", "Plunge pool", "Bath", "Lake view",
];

export const TRAVEL_GROUP = ["Solo travellers", "Couples", "Family", "Groups", "Business travellers"];

export const MEALS = ["Self catering", "Breakfast included", "Half board", "Full board", "Restaurant on site"];

// Accommodation only — what an accommodation IS, ticked alongside its other
// amenities. Also drives the category chips on the Accommodation listing
// page (StayListingPage.jsx), replacing the flat "Accommodation" every live
// listing used to fall back to.
export const PROPERTY_TYPES = [
  "Apartments", "Resorts", "Villas", "Vacation Homes",
  "Bed and Breakfasts", "Farm Stays", "Chalets", "Guesthouses", "Lodges",
  "Country Houses", "Homestays", "Campgrounds", "Boats", "Luxury tents",
  "Entire homes & apartments",
];

// Everything a business's flat `amenities` array might contain that belongs
// under `field`, in the order it was ticked.
function bucket(amenities, list) {
  if (!Array.isArray(amenities) || amenities.length === 0) return undefined;
  const set = new Set(list);
  const out = amenities.filter((a) => set.has(a));
  return out.length > 0 ? out : undefined;
}

export const facilitiesOf = (amenities) => bucket(amenities, FACILITIES);
export const roomFacilitiesOf = (amenities) => bucket(amenities, ROOM_FACILITIES);
export const travelGroupOf = (amenities) => bucket(amenities, TRAVEL_GROUP);
export const mealsOf = (amenities) => bucket(amenities, MEALS);
export const propertyTypesOf = (amenities) => bucket(amenities, PROPERTY_TYPES);
