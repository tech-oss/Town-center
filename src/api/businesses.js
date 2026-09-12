// Businesses resource (Shop / Eat & Drink / See & Do / Services listings).
//
// Real registered businesses (Supabase, see ./liveBusinesses) are listed
// first, followed by the static demo directory in src/Data/pages.js. A live
// business always wins a slug clash, so a registered business can replace a
// demo entry of the same name.
import { allItems, itemBySlug } from "../Data/pages";
import { loadLiveBusinesses } from "./liveBusinesses";

function directoryItems(live) {
  const liveSlugs = new Set(live.map((i) => i.slug));
  return [
    ...live.filter((i) => i.section !== "stay"),
    ...allItems.filter((i) => !liveSlugs.has(i.slug)),
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
