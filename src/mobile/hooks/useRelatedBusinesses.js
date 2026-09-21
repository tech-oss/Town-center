import useFetch from "../../hooks/useFetch";
import { getBusinesses } from "../../api";

// The "You might also like" set under a business on the app, matching the
// website's DetailPage: same-category listings first, topped up with others
// from the same section so there are always three.
//
// It reads the live businesses rather than the demo directory the screens
// used to fall back to — which is why the app was showing nothing here for a
// registered business while the website showed three.
export default function useRelatedBusinesses(place, limit = 3) {
  const { data } = useFetch(
    () => (place?.section ? getBusinesses({ section: place.section }) : Promise.resolve([])),
    [place?.section]
  );
  if (!place) return [];
  const pool = (data ?? []).filter((i) => i.slug !== place.slug);
  const sameCategory = pool.filter((i) => i.category === place.category);
  const others = pool.filter((i) => i.category !== place.category);
  return [...sameCategory, ...others].slice(0, limit);
}
