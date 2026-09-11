// Neighbourhood guides — the /guides listing and /guides/:slug detail pages,
// and the mobile Guides screens. Backed by public.neighbourhood_guides, whose
// `content` jsonb holds the nested document each page renders. This replaced
// the hardcoded src/Data/guides.js array so the admin editor can change what
// the site shows.
import { supabase } from "../lib/supabaseClient";
import { getSiteSection } from "./siteContent";

// Flattens the row back into the shape the pages have always consumed, so the
// components did not have to change beyond where their data comes from.
function fromRow(r) {
  return {
    slug: r.slug,
    title: r.title,
    heroImage: r.hero_image,
    cardImage: r.thumbnail,
    status: r.status,
    showOnHomepage: !!r.show_on_homepage,
    ...(r.content ?? {}),
  };
}

export async function getGuides() {
  const { data, error } = await supabase
    .from("neighbourhood_guides")
    .select("*")
    .eq("status", "Published")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function getGuideBySlug(slug) {
  const { data, error } = await supabase
    .from("neighbourhood_guides")
    .select("*")
    .eq("slug", slug)
    .eq("status", "Published")
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

// The listing page's own heading and hero crops.
export function getGuidesIndex() {
  return getSiteSection("guides-index");
}
