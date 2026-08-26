// Curated "Featured" picks for the Stay section — 2 hotels, 2 accommodation
// listings. Kept as a single source of truth so the web Hotels/Accommodation
// listing pages and the mobile app's "Featured Stay" section always agree on
// which properties are being spotlighted.
import { hotelBySlug, accommodationBySlug } from "./stay";

export const FEATURED_HOTEL_SLUGS = ["thames-riviera-hotel", "fredricks-hotel-restaurant-spa"];
export const FEATURED_ACCOMMODATION_SLUGS = ["thameside-boathouse-retreat", "riverside-loft-apartment"];

export const featuredHotels = FEATURED_HOTEL_SLUGS.map((slug) => hotelBySlug[slug]).filter(Boolean);
export const featuredAccommodations = FEATURED_ACCOMMODATION_SLUGS.map((slug) => accommodationBySlug[slug]).filter(Boolean);
