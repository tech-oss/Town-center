// Buildings resource (Live / residential developments).
import { buildings, buildingBySlug } from "../Data/live";
import { mock } from "./client";

export function getBuildings() {
  return mock(buildings);
}

export function getBuildingBySlug(slug) {
  return mock(buildingBySlug[slug] ?? null);
}
