import useFetch from "../../hooks/useFetch";
import { getBusinesses } from "../../api";
import { sections } from "../../Data/pages";

// A section's listings for the app: registered businesses from Supabase plus
// the demo directory, via the same API the website uses. The demo items show
// straight away and the live ones join as soon as they load, so a list never
// renders empty while it waits.
//
// `loading` is true until the live businesses have arrived, so a screen can
// show a loading state rather than "No results" while the demo list is empty.
export function useSectionItemsState(sectionKey) {
  const { data, loading } = useFetch(() => getBusinesses({ section: sectionKey }), [sectionKey]);
  return { items: data ?? sections[sectionKey]?.items ?? [], loading };
}

export default function useSectionItems(sectionKey) {
  return useSectionItemsState(sectionKey).items;
}
