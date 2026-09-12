import useFetch from "../../hooks/useFetch";
import { getBusinesses } from "../../api";
import { sections } from "../../Data/pages";

// A section's listings for the app: registered businesses from Supabase plus
// the demo directory, via the same API the website uses. The demo items show
// straight away and the live ones join as soon as they load, so a list never
// renders empty while it waits.
export default function useSectionItems(sectionKey) {
  const { data } = useFetch(() => getBusinesses({ section: sectionKey }), [sectionKey]);
  return data ?? sections[sectionKey]?.items ?? [];
}
