// Businesses resource (Shop / Eat & Drink / See & Do directory listings).
import { allItems, itemBySlug } from "../Data/pages";
import { mock } from "./client";

// Optional filters: section ("shop" | "eat-drink" | "see-do") and category slug.
export function getBusinesses({ section, category } = {}) {
  let list = allItems;
  if (section) list = list.filter((i) => i.section === section);
  if (category) list = list.filter((i) => i.category === category || i.categories?.includes(category));
  return mock(list);
}

export function getBusinessBySlug(slug) {
  return mock(itemBySlug[slug] ?? null);
}
