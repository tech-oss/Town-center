import { supabase } from "../../lib/supabaseClient";
import { getLivePlacementMap, featureNow, unfeature, swapFeatured } from "./homepageSlots";

// Admin CRUD for public.feature_articles — the real content behind the
// homepage "FEATURED STORIES" section and /story/:slug detail pages (see
// src/api/stories.js for the public-facing read side, which shares the same
// row shape). Replaces the old hardcoded src/Data/features.js.

function fromRow(r, slot) {
  return {
    id: r.id,
    slug: r.slug,
    // On the homepage now: a live Featured Article booking.
    homepage: !!slot,
    homeStartsAt: slot?.startsAt ?? null,
    homeEndsAt: slot?.endsAt ?? null,
    eyebrow: r.eyebrow ?? "",
    category: r.category ?? "",
    date: r.date_label ?? "",
    cardHeading: r.card_heading ?? "",
    cardBody: r.card_body ?? "",
    cardImage: r.card_image ?? "",
    title: r.title ?? "",
    heroImage: r.hero_image ?? "",
    standfirst: r.standfirst ?? "",
    location: r.location ?? "",
    website: r.website ?? "",
    body: r.body ?? [],
    gallery: r.gallery ?? [],
  };
}

function slugify(text) {
  return String(text ?? "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function toRow(item) {
  return {
    id: item.id || undefined,
    slug: item.slug || slugify(item.title),
    eyebrow: item.eyebrow || null,
    category: item.category || null,
    date_label: item.date || null,
    card_heading: item.cardHeading || null,
    card_body: item.cardBody || null,
    card_image: item.cardImage || null,
    title: item.title,
    hero_image: item.heroImage || null,
    standfirst: item.standfirst || null,
    location: item.location || null,
    website: item.website || null,
    body: item.body ?? [],
    gallery: item.gallery ?? [],
    updated_at: new Date().toISOString(),
  };
}

export async function getFeatureArticles() {
  const [{ data, error }, live] = await Promise.all([
    supabase.from("feature_articles").select("*").order("sort_order"),
    getLivePlacementMap("featured_article"),
  ]);
  if (error) throw error;
  return (data ?? []).map((r) => fromRow(r, live.get(String(r.id))));
}

export async function getFeatureArticleById(id) {
  const [{ data, error }, live] = await Promise.all([
    supabase.from("feature_articles").select("*").eq("id", id).maybeSingle(),
    getLivePlacementMap("featured_article"),
  ]);
  if (error) throw error;
  return data ? fromRow(data, live.get(String(data.id))) : null;
}

export async function saveFeatureArticle(item) {
  const { data, error } = await supabase.from("feature_articles").upsert(toRow(item)).select().single();
  if (error) throw error;
  // The homepage toggle books (or ends) a Featured Article slot.
  const live = await getLivePlacementMap("featured_article");
  const onHome = live.has(String(data.id));
  if (item.homepage && !onHome) {
    const res = await featureNow("featured_article", "feature_article", String(data.id));
    if (res.full) throw new Error("Both Featured Article slots are taken. Swap one out first.");
  } else if (!item.homepage && onHome) {
    await unfeature("featured_article", data.id);
  }
  return getFeatureArticleById(data.id);
}

export async function deleteFeatureArticle(id) {
  const { error } = await supabase.from("feature_articles").delete().eq("id", id);
  if (error) throw error;
  return { id, deleted: true };
}

// Turning a story on books a Featured Article slot from now; { full: true }
// when both are taken, so the page can offer a swap.
export async function setArticleHomepageFeature(id, featured) {
  if (!featured) {
    await unfeature("featured_article", id);
    return { id, homepage: false };
  }
  const res = await featureNow("featured_article", "feature_article", String(id));
  if (res.full) return { full: true };
  return { id, homepage: true };
}

export async function swapArticleHomepageFeature(addId, removeId) {
  await swapFeatured("featured_article", "feature_article", String(addId), String(removeId));
  return { addId, removeId };
}
