// "In the Spotlight" — the homepage news & offers booked into a spotlight slot
// (admin → Homepage Slots, or bought by a business).
// The homepage (web) and the app's home screen read these, and their cards
// open a normal article page.
import { supabase } from "../lib/supabaseClient";
import { loadLiveBusinesses } from "./liveBusinesses";
import { getLivePlacements } from "./homepageSlots";

const HOMEPAGE_SLOTS = 4;

const today = () => new Date().toISOString().slice(0, 10);

// Offer or News. Older rows saved as "What's On" (no longer offered) read as News.
const typeOf = (n) => (n.category === "Offer" || n.type === "offer" ? "Offer" : "News");

// Only the dates the author wrote for readers. start_date/end_date tell the
// system when the post is on the homepage and are never printed on it.
function dateLine(n) {
  return n.display_dates?.trim() || n.date_label || "";
}

const notExpired = (n) => !n.end_date || n.end_date >= today();

// The In the Spotlight cards: whatever is booked into a spotlight slot now —
// an admin post (news_offers) or one of a business's own posts.
export async function getSpotlightPosts() {
  const { spotlight } = await getLivePlacements();
  if (!spotlight.length) return [];

  const offerIds = spotlight.filter((p) => p.content_kind === "news_offer").map((p) => p.content_id);
  const [offersRes, live] = await Promise.all([
    offerIds.length
      ? supabase.from("news_offers").select("*").in("id", offerIds).eq("status", "Published")
      : Promise.resolve({ data: [] }),
    loadLiveBusinesses().catch(() => []),
  ]);
  const offers = new Map((offersRes.data ?? []).filter(notExpired).map((n) => [String(n.id), n]));
  const articles = new Map(live.flatMap((b) => b.news ?? []).filter((a) => a.id?.startsWith("live-")).map((a) => [a.id.slice(5), a]));

  return spotlight.slice(0, HOMEPAGE_SLOTS).map((p) => {
    if (p.content_kind === "news_offer") {
      const n = offers.get(p.content_id);
      if (!n) return null;
      return {
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
      };
    }
    const a = articles.get(p.content_id);
    if (!a) return null;
    return {
      id: a.id,
      slug: a.slug,
      homepage: true,
      category: [a.business?.name, a.category].filter(Boolean).join(" · "),
      title: a.title,
      excerpt: a.excerpt,
      imageSrc: a.image || "/logo-mark.svg",
      imageAlt: a.title,
      href: `/news/${a.slug}`,
      date: a.date,
    };
  }).filter(Boolean);
}

// Published admin posts that aren't tied to a listed business, for the Offers
// page (posts about a listed business arrive through that business's news).
export async function getStandaloneNewsOffers() {
  const [{ data, error }, live] = await Promise.all([
    supabase.from("news_offers").select("*").eq("status", "Published").order("created_at", { ascending: false }),
    loadLiveBusinesses().catch(() => []),
  ]);
  if (error) return [];
  const listed = new Set(live.map((b) => b.businessId));
  return (data ?? [])
    .filter((n) => notExpired(n) && !(n.business_id && listed.has(n.business_id)))
    .map((n) => ({
      id: `news-offer-${n.id}`,
      newsOfferId: n.id,
      slug: n.slug,
      category: typeOf(n),
      date: dateLine(n),
      title: n.title,
      excerpt: n.excerpt ?? "",
      image: n.image || "/logo-mark.svg",
      business: n.business_name ? { name: n.business_name, section: null } : null,
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
    endsOn: null,
    title: n.title,
    excerpt: n.excerpt ?? "",
    image: n.image || business.image || "/logo-mark.svg",
    body: String(n.body ?? n.excerpt ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
    business,
  };
}
