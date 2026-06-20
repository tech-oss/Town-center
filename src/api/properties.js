// Properties resource (Live / residential listings).
// Backend swap: replace each `mock(...)` with `request("/properties...")`.
import { properties, propertyBySlug } from "../Data/live";
import { mock } from "./client";

// status: "sale" | "rent" | undefined (all)
export function getProperties({ status } = {}) {
  const list = status ? properties.filter((p) => p.status === status) : properties;
  return mock(list);
}

export function getPropertyBySlug(slug) {
  return mock(propertyBySlug[slug] ?? null);
}
