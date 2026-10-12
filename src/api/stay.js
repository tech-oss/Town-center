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

// "You might also like" on an accommodation property: up to three of the
// same company's other live properties, topped up with other accommodation
// (featured first) when the company has fewer. Cards in the shape
// PlaceDetailLayout's related grid and the app's related row draw.
export async function getPropertyRelated(item, limit = 3) {
  if (!item?.slug) return [];
  const all = (await liveStay("accommodation")).filter((i) => i.slug !== item.slug);
  const sameCompany = item.companyId ? all.filter((i) => i.companyId === item.companyId) : [];
  const others = listingOrder(all.filter((i) => !sameCompany.includes(i)));
  return [...listingOrder(sameCompany), ...others].slice(0, limit).map((i) => ({
    slug: i.slug,
    to: `/live/stay/accommodation/${i.slug}`,
    mobileTo: `/mobile/stay/accommodation/${i.slug}`,
    image: i.image,
    hasHero: i.hasHero,
    logo: i.logo,
    name: i.name,
    tag: sameCompany.includes(i) && i.managedBy?.name ? `Also by ${i.managedBy.name}` : i.type,
    blurb: i.tagline ?? "",
    address: (i.address ?? "").split(",")[0] || null,
  }));
}
