import { SEE_DO_CATEGORIES, CATEGORY_TITLES } from "../Data/taxonomy";

// Events are tagged with the same categories as the rest of See & Do, so an
// event can be filed under exactly the category its listing page filters on.
//
// Older events still carry the original What's On labels (Music, Family,
// Market, Festive, Theatre, Sport, Community). Those map onto the nearest
// See & Do category, both when the public site reads them and when an admin
// opens one to edit.
export const EVENT_CATEGORY_OPTIONS = SEE_DO_CATEGORIES;

export const LEGACY_EVENT_CATEGORY_MAP = {
  Music: "music-dance",
  Theatre: "theatre",
  Family: "family",
  Market: "markets",
  Festive: "community",
  Community: "community",
  Sport: "sport-wellness",
};

const LABEL_TO_SLUG = Object.fromEntries(SEE_DO_CATEGORIES.map((c) => [c.label, c.value]));

// Any stored category — a See & Do slug, its label, or a legacy What's On
// label — as a See & Do slug. Unknown values fall back to Community.
export function toSeeDoSlug(value) {
  if (!value) return "community";
  if (CATEGORY_TITLES[value]) return value;
  return LABEL_TO_SLUG[value] ?? LEGACY_EVENT_CATEGORY_MAP[value] ?? "community";
}

export function toSeeDoSlugs(values) {
  const list = Array.isArray(values) ? values : [values].filter(Boolean);
  return [...new Set(list.map(toSeeDoSlug))];
}

export function eventCategoryLabel(value) {
  return CATEGORY_TITLES[toSeeDoSlug(value)] ?? value;
}
