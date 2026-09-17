import { useSearchParams } from "react-router-dom";
import { categoryLabel } from "../Data/taxonomy";

// A business can be listed under several categories (Solas is in both
// Restaurants and Private Dining). Listing cards pass the category they were
// opened from as ?category=, so the detail page's breadcrumb and pill follow
// the path the visitor took. Without it (or with a category the business
// isn't in), the business's primary category is used.
export function listingCategory(item, requested) {
  const inIt = requested && (requested === item.category || item.categories?.includes(requested));
  const value = inIt ? requested : item.category;
  return { value, label: inIt ? categoryLabel(requested) : item.tag };
}

export default function useViewedCategory(item) {
  const [params] = useSearchParams();
  return item ? listingCategory(item, params.get("category")) : { value: null, label: "" };
}

// The detail link for a card shown under `category`.
export function placeLink(item, category) {
  const base = `/${item.section}/place/${item.slug}`;
  return category ? `${base}?category=${encodeURIComponent(category)}` : base;
}
