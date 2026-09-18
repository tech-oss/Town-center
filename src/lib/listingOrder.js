// The one order every business listing uses, on the website and in the app:
// featured businesses first, then everyone else — each group A to Z by name.
// Editing a profile never moves a business up the list.
const byName = new Intl.Collator("en-GB", { sensitivity: "base", numeric: true });

export function listingOrder(list) {
  return [...list].sort((a, b) =>
    Number(!!b.featured) - Number(!!a.featured) ||
    byName.compare(String(a.name ?? "").trim(), String(b.name ?? "").trim()));
}
