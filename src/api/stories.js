// Stories resource (Featured articles / long-form features) — the homepage
// "FEATURED STORIES" section and /story/:slug detail pages. Backed by
// public.feature_articles (see supabase/sql/feature_articles_2026_09.sql),
// replacing what used to be a hardcoded Data/features.js array so the admin
// Featured Stories editor can actually manage this content.
import { supabase } from "../lib/supabaseClient";
import { imageUrl } from "../lib/imageUrl";
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
    cardImage: imageUrl(r.card_image, "card"),
    title: r.title,
    heroImage: imageUrl(r.hero_image, "hero"),
    standfirst: r.standfirst,
    location: r.location,
    website: r.website,
    // Set when the story belongs to a business — either one a business wrote
    // against a Featured Article slot, or one admin attached to it. The name
    // and page link are filled in by withBusiness() below.
    businessId: r.business_id ?? null,
    businessName: null,
    business: null,
    author: r.author ?? "admin",
    body: r.body ?? [],
    gallery: r.gallery ?? [],
  };
}

// Fills in the business a story belongs to — its name, and its page on the
// site — from the live businesses. Without this an admin story attached to a
// business carried only the id, so the article never said whose it was.
async function withBusiness(stories) {
  const needed = stories.some((st) => st?.businessId);
  if (!needed) return stories;
  const live = await loadLiveBusinesses().catch(() => []);
  const byId = new Map(live.map((b) => [b.businessId, b]));
  return stories.map((st) => {
    const b = st?.businessId ? byId.get(st.businessId) : null;
    if (!b) return st;
    return {
      ...st,
      businessName: b.name,
      business: { name: b.name, slug: b.slug, section: b.section, businessId: b.businessId },
    };
  });
}

// Every story. `homepage` is true while it's booked into a Featured Article slot.
export async function getStories() {
  const [{ data, error }, placements] = await Promise.all([
    supabase.from("feature_articles").select("*").eq("status", "Live").order("sort_order"),
    getLivePlacements(),
  ]);
  if (error) throw error;
  const live = new Set(placements.featured_article
    .filter((p) => p.content_kind === "feature_article").map((p) => p.content_id));
  return withBusiness((data ?? []).map((r) => ({ ...fromRow(r), homepage: live.has(String(r.id)) })));
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
    storyIds.length ? supabase.from("feature_articles").select("*").eq("status", "Live").in("id", storyIds) : Promise.resolve({ data: [] }),
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
        cardImage: imageUrl(n.image, "card") || "/logo-mark.svg",
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
      cardImage: imageUrl(a.image, "card"),
      date: a.date,
    };
  }).filter(Boolean);
}

export async function getStoryBySlug(slug) {
  const { data, error } = await supabase
    .from("feature_articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "Live")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [story] = await withBusiness([fromRow(data)]);
  return story;
}
