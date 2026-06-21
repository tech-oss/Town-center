// Workplace developments resource (Work section).
import { workplaceBuildings, workplaceBySlug } from "../Data/work";
import { mock } from "./client";

export function getWorkplaceDevelopments() {
  return mock(workplaceBuildings);
}

export function getWorkplaceDevelopmentBySlug(slug) {
  return mock(workplaceBySlug[slug] ?? null);
}
