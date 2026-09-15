// "In the Spotlight" — the homepage news & offers admin picks in
// Admin → Business News & Offers (public.news_offers with featured_on_home).
// The homepage (web) and the app's home screen read these, and their cards
// open a normal article page.
import { supabase } from "../lib/supabaseClient";
import { loadLiveBusinesses } from "./liveBusinesses";

const HOMEPAGE_SLOTS = 4;

const longDate = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const today = () => new Date().toISOString().slice(0, 10);

// Offer or News. Older rows saved as "What's On" (no longer offered) read as News.
const typeOf = (n) => (n.category === "Offer" || n.type === "offer" ? "Offer" : "News");

function dateLine(n) {
  if (n.end_date) return `Ends ${longDate(n.end_date)}`;
  if (n.date_label) return n.date_label;
  return n.start_date ? longDate(n.start_date) : "";
}

const notExpired = (n) => !n.end_date || n.end_date >= today();

export async function getSpotlightPosts() {
  const { data, error } = await supabase
    .from("news_offers")
    .select("*")
    .eq("featured_on_home", true)
    .eq("status", "Published")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).filter(notExpired).slice(0, HOMEPAGE_SLOTS).map((n) => ({
    id: n.id,
    slug: n.slug,
    homepage: true,
    category: [n.business_name, typeOf(n)].filter(Boolean).join(" · "),
    title: n.title,
    excerpt: n.excerpt,
    imageSrc: n.image || "/logo-mark.svg",
    imageAlt: n.title,
    href: `/news/${n.slug}`,
    date: dateLine(n),
  }));
}

// A spotlight post as an article page, in the same shape as business articles.
export async function getSpotlightArticleBySlug(slug) {
  const { data: n, error } = await supabase
    .from("news_offers")
    .select("*")
    .eq("slug", slug)
    .eq("status", "Published")
    .maybeSingle();
  if (error || !n) return null;

  const live = await loadLiveBusinesses().catch(() => []);
  const business = live.find((b) => b.businessId === n.business_id)
    ?? { name: n.business_name, news: [], slug: null };

  return {
    id: `spotlight-${n.id}`,
    slug: n.slug,
    category: typeOf(n),
    date: dateLine(n),
    endsOn: n.end_date ? longDate(n.end_date) : null,
    title: n.title,
    excerpt: n.excerpt ?? "",
    image: n.image || business.image || "/logo-mark.svg",
    body: String(n.body ?? n.excerpt ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
    business,
  };
}
