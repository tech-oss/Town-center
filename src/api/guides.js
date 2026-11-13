// Neighbourhood guides — the /guides listing and /guides/:slug detail pages,
// and the mobile Guides screens. Backed by public.neighbourhood_guides, whose
// `content` jsonb holds the nested document each page renders. This replaced
// the hardcoded src/Data/guides.js array so the admin editor can change what
// the site shows.
import { supabase } from "../lib/supabaseClient";
import { imageUrl } from "../lib/imageUrl";
import { getSiteSection } from "./siteContent";

// Flattens the row back into the shape the pages have always consumed, so the
// components did not have to change beyond where their data comes from.
function fromRow(r) {
  return {
    slug: r.slug,
    title: r.title,
    heroImage: imageUrl(r.hero_image, "hero"),
    cardImage: imageUrl(r.thumbnail, "card"),
    status: r.status,
    showOnHomepage: !!r.show_on_homepage,
    ...(r.content ?? {}),
  };
}

// What the website and app show: published guides that admin hasn't turned
// "Show on Platform" off for (Neighbourhood Guides in admin).
export async function getGuides() {
  const { data, error } = await supabase
    .from("neighbourhood_guides")
    .select("*")
    .eq("status", "Published")
    .eq("show_on_platform", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

// The three guides admin ticked "Show on Homepage" for, used by the website's
// homepage section and the app's home screen so the two always agree. With
// none ticked it falls back to the first three, rather than showing nothing.
export const HOMEPAGE_GUIDE_SLOTS = 3;

export async function getHomepageGuides() {
  const all = await getGuides();
  const chosen = all.filter((g) => g.showOnHomepage);
  return (chosen.length ? chosen : all).slice(0, HOMEPAGE_GUIDE_SLOTS);
}

export async function getGuideBySlug(slug) {
  const { data, error } = await supabase
    .from("neighbourhood_guides")
    .select("*")
    .eq("slug", slug)
    .eq("status", "Published")
    .eq("show_on_platform", true)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

// The listing page's own heading and hero crops.
export function getGuidesIndex() {
  return getSiteSection("guides-index");
}
