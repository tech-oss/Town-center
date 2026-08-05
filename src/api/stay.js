// Stay resource (Hotels & Accommodation, under Live & Stay).
import { hotels, hotelBySlug, accommodations, accommodationBySlug } from "../Data/stay";
import { mock } from "./client";

export function getHotels() {
  return mock(hotels);
}

export function getHotelBySlug(slug) {
  return mock(hotelBySlug[slug] ?? null);
}

export function getAccommodations() {
  return mock(accommodations);
}

export function getAccommodationBySlug(slug) {
  return mock(accommodationBySlug[slug] ?? null);
}
