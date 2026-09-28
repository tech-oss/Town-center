// Stay resource (Hotels & Accommodation, under Live & Stay).
//
// Registered hotels and accommodation (Supabase) come first, followed by the
// static demo listings. A live listing wins a slug clash.
import { hotels, hotelBySlug, accommodations, accommodationBySlug } from "../Data/stay";
import { listingOrder } from "../lib/listingOrder";
import { loadLiveBusinesses } from "./liveBusinesses";

async function liveStay(kind) {
  const live = await loadLiveBusinesses();
  return live
    .filter((i) => i.section === "stay" && i.stayKind === kind)
    .map((i) => ({
      ...i,
      // Hotels don't have a sub-type; an accommodation's is whatever it
      // ticked under Property Types (lib/amenityCategories.js), falling
      // back to the generic label when nothing's been entered yet — same as
      // every listing before this had, so an empty one is no worse off.
      type: kind === "hotels" ? "Hotel" : (i.propertyType ?? "Accommodation"),
      area: i.address,
    }));
}

// A live listing replaces a demo one with the same slug or the same name.
function merge(live, demo) {
  const slugs = new Set(live.map((i) => i.slug));
  const names = new Set(live.map((i) => String(i.name ?? "").trim().toLowerCase()));
  // Featured first, then A to Z (lib/listingOrder).
  return listingOrder([...live, ...demo.filter((i) => !slugs.has(i.slug) && !names.has(String(i.name ?? "").trim().toLowerCase()))]);
}

export async function getHotels() {
  return merge(await liveStay("hotels"), hotels);
}

export async function getHotelBySlug(slug) {
  return (await liveStay("hotels")).find((i) => i.slug === slug) ?? hotelBySlug[slug] ?? null;
}

export async function getAccommodations() {
  return merge(await liveStay("accommodation"), accommodations);
}

export async function getAccommodationBySlug(slug) {
  return (await liveStay("accommodation")).find((i) => i.slug === slug) ?? accommodationBySlug[slug] ?? null;
}
