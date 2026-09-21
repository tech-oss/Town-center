// Posts that have been on the homepage (In the Spotlight / Featured Article),
// whatever the business's plan — see supabase/sql/promoted_posts_2026_09.sql.
// The Offers page lists all of them, and their links always open.
import { supabase } from "../lib/supabaseClient";
import { loadLiveBusinesses } from "./liveBusinesses";

const SECTION_FOR_TYPE = { "eat-drink": "eat-drink", shop: "shop", "see-do": "see-do", services: "services", freelancer: "services", hotel: "stay" };

const today = () => new Date().toISOString().slice(0, 10);

// Only the dates the author wrote for readers. start_date/end_date tell the
// system when the post is live and are never printed on it.
function dateLine(p) {
  return p.display_dates?.trim() || "";
}

function toArticle(p, live) {
  const business = live.find((b) => b.businessId === p.business_id)
    ?? { name: p.business_name, businessId: p.business_id, section: SECTION_FOR_TYPE[p.business_type] ?? null, news: [], slug: null };
  const id = p.kind === "news_offer" ? `news-offer-${p.id}` : `live-${p.id}`;
  return {
    id,
    ...(p.kind === "news_offer" ? { newsOfferId: p.id } : {}),
    slug: p.slug,
    category: p.type,
    date: dateLine(p),
    endsOn: null,
    title: p.title,
    excerpt: p.excerpt ?? "",
    image: p.image || business.image || "/logo-mark.svg",
    body: String(p.body ?? p.excerpt ?? "").split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean),
    business,
  };
}

export async function getPromotedPosts() {
  const [{ data, error }, live] = await Promise.all([
    supabase.from("public_promoted_posts").select("*"),
    loadLiveBusinesses().catch(() => []),
  ]);
  if (error) return []; // view not created yet
  return (data ?? [])
    .filter((p) => !p.end_date || p.end_date >= today())
    .map((p) => toArticle(p, live));
}

export async function getPromotedPostBySlug(slug) {
  const [{ data }, live] = await Promise.all([
    supabase.from("public_promoted_posts").select("*").eq("slug", slug).maybeSingle(),
    loadLiveBusinesses().catch(() => []),
  ]);
  return data ? toArticle(data, live) : null;
}
