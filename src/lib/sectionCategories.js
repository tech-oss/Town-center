import { categoryTitles } from "../Data/pages";

// How a section's category filters are derived and matched — shared by the
// website's CategoryPage and the mobile listing screens, so the two surfaces
// show the same list in the same order and can't drift apart again.
//
// The list is the section's nav columns flattened: every column link that
// carries a ?category=, in column order, de-duplicated by URL. Column headings
// ("Venue Type" / "Cuisine Type", "Shop" / "Local Services") are dropdown
// grouping only; the filter itself is one flat list. Pass a single column to
// scope it to one group (e.g. /services/tradespeople).
export function sectionCategories(section, column = null) {
  const seen = new Set();
  const links = column ? column.links : section.columns.flatMap((c) => c.links);
  return links
    .filter((l) => l.to.includes("?category=") && !seen.has(l.to) && seen.add(l.to))
    .map((l) => ({ value: l.to.split("?category=")[1], label: l.label }));
}

// The Services column a /services/:group page is scoped to, and the set of
// category slugs in it (used to restrict the item pool to that group).
export function groupColumnFor(section, groupConfig) {
  return groupConfig ? section.columns.find((c) => c.heading === groupConfig.heading) ?? null : null;
}

export function columnCategoryValues(column) {
  return column
    ? new Set(column.links.filter((l) => l.to.includes("?category=")).map((l) => l.to.split("?category=")[1]))
    : null;
}

// An item appears under its primary `category` plus any extra `categories`.
export function matchesCategory(item, category) {
  return !category || item.category === category || Boolean(item.categories?.includes(category));
}

// What's On events carry their own category system (Music, Family, Market,
// Festive, Theatre, Sport, Community) — map each onto the nearest See & Do
// category so every card, event or otherwise, uses the same consistent set.
export const EVENT_CATEGORY_MAP = {
  Music: "music-dance",
  Theatre: "theatre",
  Family: "family",
  Market: "markets",
  Festive: "community",
  Community: "community",
  Sport: "sport-wellness",
};

// A What's On event as a See & Do card. `linkPrefix` differs by surface
// ("/event" on the website, "/mobile/event" in the app).
export function eventToSeeDoCard(e, linkPrefix = "/event") {
  const category = EVENT_CATEGORY_MAP[e.category] ?? "community";
  return {
    slug: e.slug,
    name: e.title,
    tag: categoryTitles[category],
    section: "see-do",
    category,
    image: e.image,
    date: e.date,
    address: e.location,
    description: e.excerpt,
    to: `${linkPrefix}/${e.slug}`,
    isEvent: true,
  };
}
