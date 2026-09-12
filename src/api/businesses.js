// Businesses resource (Shop / Eat & Drink / See & Do / Services listings).
//
// Real registered businesses (Supabase, see ./liveBusinesses) are listed
// first, followed by the static demo directory in src/Data/pages.js. A live
// business always wins a slug clash, so a registered business can replace a
// demo entry of the same name.
import { allItems, itemBySlug } from "../Data/pages";
import { loadLiveBusinesses } from "./liveBusinesses";

// A demo entry is dropped when a real business of the same name exists in the
// same section — the registered Coppa Club replaces the demo one, rather than
// the directory listing Coppa Club twice.
const nameKey = (i) => `${i.section}::${String(i.name ?? "").trim().toLowerCase()}`;

function directoryItems(live) {
  const liveOnSite = live.filter((i) => i.section !== "stay");
  const liveSlugs = new Set(liveOnSite.map((i) => i.slug));
  const liveNames = new Set(liveOnSite.map(nameKey));
  return [
    ...liveOnSite,
    ...allItems.filter((i) => !liveSlugs.has(i.slug) && !liveNames.has(nameKey(i))),
  ];
}

// Optional filters: section ("shop" | "eat-drink" | "see-do" | "services") and category slug.
export async function getBusinesses({ section, category } = {}) {
  const live = await loadLiveBusinesses();
  let list = directoryItems(live);
  if (section) list = list.filter((i) => i.section === section);
  if (category) list = list.filter((i) => i.category === category || i.categories?.includes(category));
  return list;
}

export async function getBusinessBySlug(slug) {
  const live = await loadLiveBusinesses();
  return live.find((i) => i.slug === slug && i.section !== "stay") ?? itemBySlug[slug] ?? null;
}

export { getMapBrands } from "./liveBusinesses";
