// Attractions resource (See & Do feature pages).
import { attractions, attractionBySlug } from "../Data/attractions";
import { mock } from "./client";

export function getAttractions() {
  return mock(Object.values(attractions));
}

export function getAttractionBySlug(slug) {
  return mock(attractionBySlug[slug] ?? null);
}
