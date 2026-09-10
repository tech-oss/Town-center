// Stories resource (Featured articles / long-form features) — the homepage
// "FEATURED STORIES" section and /story/:slug detail pages. Backed by
// public.feature_articles (see supabase/sql/feature_articles_2026_09.sql),
// replacing what used to be a hardcoded Data/features.js array so the admin
// Featured Stories editor can actually manage this content.
import { supabase } from "../lib/supabaseClient";

function fromRow(r) {
  return {
    slug: r.slug,
    homepage: r.homepage,
    eyebrow: r.eyebrow,
    category: r.category,
    date: r.date_label,
    cardHeading: r.card_heading,
    cardBody: r.card_body,
    cardImage: r.card_image,
    title: r.title,
    heroImage: r.hero_image,
    standfirst: r.standfirst,
    location: r.location,
    website: r.website,
    body: r.body ?? [],
    gallery: r.gallery ?? [],
  };
}

export async function getStories() {
  const { data, error } = await supabase
    .from("feature_articles")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function getStoryBySlug(slug) {
  const { data, error } = await supabase
    .from("feature_articles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}
