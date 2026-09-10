import { supabase } from "../../lib/supabaseClient";

// Admin CRUD for public.feature_articles — the real content behind the
// homepage "FEATURED STORIES" section and /story/:slug detail pages (see
// src/api/stories.js for the public-facing read side, which shares the same
// row shape). Replaces the old hardcoded src/Data/features.js.

function fromRow(r) {
  return {
    id: r.id,
    slug: r.slug,
    homepage: r.homepage,
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
    homepage: !!item.homepage,
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
  const { data, error } = await supabase.from("feature_articles").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function getFeatureArticleById(id) {
  const { data, error } = await supabase.from("feature_articles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

export async function saveFeatureArticle(item) {
  const { data, error } = await supabase.from("feature_articles").upsert(toRow(item)).select().single();
  if (error) throw error;
  return fromRow(data);
}

export async function deleteFeatureArticle(id) {
  const { error } = await supabase.from("feature_articles").delete().eq("id", id);
  if (error) throw error;
  return { id, deleted: true };
}

// The homepage shows two story slots. Turning one off always succeeds;
// turning one on when both are taken returns { full: true } so the UI can
// offer a swap instead of a dead end (same pattern as news_offers).
export async function setArticleHomepageFeature(id, featured) {
  if (!featured) {
    const { error } = await supabase.from("feature_articles").update({ homepage: false }).eq("id", id);
    if (error) throw error;
    return { id, homepage: false };
  }

  const { count, error: countError } = await supabase
    .from("feature_articles")
    .select("id", { count: "exact", head: true })
    .eq("homepage", true)
    .neq("id", id);
  if (countError) throw countError;
  if ((count ?? 0) >= 2) return { full: true };

  const { error } = await supabase.from("feature_articles").update({ homepage: true }).eq("id", id);
  if (error) throw error;
  return { id, homepage: true };
}

export async function swapArticleHomepageFeature(addId, removeId) {
  const { error: offErr } = await supabase.from("feature_articles").update({ homepage: false }).eq("id", removeId);
  if (offErr) throw offErr;
  const { error: onErr } = await supabase.from("feature_articles").update({ homepage: true }).eq("id", addId);
  if (onErr) throw onErr;
  return { addId, removeId };
}
