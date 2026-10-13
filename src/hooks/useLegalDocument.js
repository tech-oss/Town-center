import useFetch from "./useFetch";
import { getSiteSection } from "../api/siteContent";
import { LEGAL } from "../Data/legal";

// The Privacy Policy or Terms of Use as admin last saved it (Site Content),
// or the original document when admin hasn't saved one or it can't be read.
// `doc` is "privacy" or "terms". Live updates re-read it after an admin save.
export default function useLegalDocument(doc) {
  const original = LEGAL[doc];
  const { data, loading } = useFetch(() => getSiteSection(original.key), [original.key]);
  const html = typeof data?.html === "string" && data.html.trim() ? data.html : original.html;
  const title = (typeof data?.title === "string" && data.title.trim()) || original.title;
  return { title, html, loading };
}
