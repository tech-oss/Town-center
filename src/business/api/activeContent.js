import { supabase } from "../../lib/supabaseClient";
import { listArticles } from "./businessArticles";

// The dashboard's "Active Articles / Offers & Events" figure: everything of
// this business's that is live on the site right now —
//   • its News & Offers articles (its own, and any admin wrote for it there)
//   • News & Offers posts admin wrote in Business News & Offers and attached
//     to this business
//   • Feature Articles about it, whoever wrote them
//   • its events, leaving out one-off events whose date has passed
// It used to count only the business's own News & Offers articles, so
// anything admin added for the business, and every event, was missing.
export async function countActiveContent(businessId) {
  const today = new Date().toISOString().slice(0, 10);
  const [articles, news, features, events] = await Promise.all([
    listArticles(businessId).catch(() => []),
    supabase.from("news_offers").select("id, end_date").eq("business_id", businessId).eq("status", "Published"),
    supabase.from("feature_articles").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("status", "Live"),
    supabase.from("business_events").select("id, event_date, is_recurring, recurrence_end_date").eq("business_id", businessId).eq("status", "Live"),
  ]);
  const liveArticles = articles.filter((a) => a.status === "Live").length;
  const liveNews = (news.data ?? []).filter((n) => !n.end_date || n.end_date >= today).length;
  const liveEvents = (events.data ?? []).filter((e) => e.is_recurring
    ? !e.recurrence_end_date || e.recurrence_end_date >= today
    : !e.event_date || e.event_date >= today).length;
  return liveArticles + liveNews + (features.count ?? 0) + liveEvents;
}
