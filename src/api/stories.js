// Stories resource (Featured articles / long-form features) — the homepage
// "FEATURED STORIES" section and /story/:slug detail pages. Backed by
// public.feature_articles (see supabase/sql/feature_articles_2026_09.sql),
// replacing what used to be a hardcoded Data/features.js array so the admin
// Featured Stories editor can actually manage this content.
import { supabase } from "../lib/supabaseClient";
import { getLivePlacements } from "./homepageSlots";
import { loadLiveBusinesses } from "./liveBusinesses";

function fromRow(r) {
  return {
    id: r.id,
    slug: r.slug,
    homepage: false,
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
    // Set when admin attached the story to a registered business.
    businessId: r.business_id ?? null,
    body: r.body ?? [],
    gallery: r.gallery ?? [],
  };
}

// Every story. `homepage` is true while it's booked into a Featured Article slot.
export async function getStories() {
  const [{ data, error }, placements] = await Promise.all([
    supabase.from("feature_articles").select("*").order("sort_order"),
    getLivePlacements(),
  ]);
  if (error) throw error;
  const live = new Set(placements.featured_article
    .filter((p) => p.content_kind === "feature_article").map((p) => p.content_id));
  return (data ?? []).map((r) => ({ ...fromRow(r), homepage: live.has(String(r.id)) }));
}

// The homepage Featured Stories, in slot order: an admin story, or a
// business's own post booked into a Featured Article slot (which opens as a
// news article, so it carries its own `to`).
export async function getHomepageStories() {
  const { featured_article: slots } = await getLivePlacements();
  if (!slots.length) return [];
  const storyIds = slots.filter((p) => p.content_kind === "feature_article").map((p) => p.content_id);
  const postIds = slots.filter((p) => p.content_kind === "news_offer").map((p) => p.content_id);
  const [storiesRes, live, postsRes] = await Promise.all([
    storyIds.length ? supabase.from("feature_articles").select("*").in("id", storyIds) : Promise.resolve({ data: [] }),
    slots.some((p) => p.content_kind === "business_article") ? loadLiveBusinesses().catch(() => []) : [],
    postIds.length ? supabase.from("news_offers").select("*").in("id", postIds).eq("status", "Published") : Promise.resolve({ data: [] }),
  ]);
  const posts = new Map((postsRes.data ?? []).map((n) => [String(n.id), n]));
  const stories = new Map((storiesRes.data ?? []).map((r) => [String(r.id), r]));
  const articles = new Map(live.flatMap((b) => b.news ?? []).filter((a) => a.id?.startsWith("live-")).map((a) => [a.id.slice(5), a]));

  return slots.map((p) => {
    if (p.content_kind === "feature_article") {
      const r = stories.get(p.content_id);
      return r ? { ...fromRow(r), homepage: true, to: `/story/${r.slug}` } : null;
    }
    if (p.content_kind === "news_offer") {
      const n = posts.get(p.content_id);
      if (!n) return null;
      return {
        slug: n.slug,
        homepage: true,
        to: `/news/${n.slug}`,
        eyebrow: n.business_name ?? (n.type === "offer" ? "Offer" : "News"),
        cardHeading: n.title,
        cardBody: n.excerpt,
        cardImage: n.image || "/logo-mark.svg",
      };
    }
    const a = articles.get(p.content_id);
    if (!a) return null;
    return {
      slug: a.slug,
      homepage: true,
      to: `/news/${a.slug}`,
      eyebrow: a.business?.name ?? a.category,
      cardHeading: a.title,
      cardBody: a.excerpt,
      cardImage: a.image,
      date: a.date,
    };
  }).filter(Boolean);
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
