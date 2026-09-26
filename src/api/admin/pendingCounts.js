import { supabase } from "../../lib/supabaseClient";
import { countPendingApprovals } from "./approvals";

// How much is waiting in every admin queue, for the sidebar badges.
//
// Each is a head-only count, so this never loads the queues themselves.
// A queue whose table or column isn't there yet (a migration not run) just
// reads 0 — one missing count must never blank the whole sidebar.

async function count(table, apply) {
  try {
    const { count: n, error } = await apply(
      supabase.from(table).select("*", { count: "exact", head: true })
    );
    return error ? 0 : (n ?? 0);
  } catch {
    return 0;
  }
}

// The eleven simple counts in one request (supabase/sql/admin_pending_counts_2026_09.sql),
// since every request is a line of Supabase log ingestion. Until that
// migration is run this falls back to counting each queue separately.
async function simpleCounts() {
  const { data, error } = await supabase.rpc("admin_pending_counts");
  if (!error && data) return data;

  const [slots, events, occurrences, articles, featured, reviews, replies, users, businesses, tickets, push] =
    await Promise.all([
      count("homepage_placements", (q) => q.eq("status", "pending_approval").gt("ends_at", new Date().toISOString())),
      count("business_events", (q) => q.eq("status", "Pending Approval")),
      // One date of a recurring event, edited or cancelled on its own.
      count("business_event_occurrences", (q) => q.eq("review_status", "Pending Approval")),
      count("business_articles", (q) => q.eq("status", "Pending Approval")),
      count("feature_articles", (q) => q.eq("author", "business").eq("status", "Pending Approval")),
      count("business_reviews", (q) => q.eq("status", "Pending Approval")),
      // A business's reply to a review is moderated separately from the review.
      count("business_reviews", (q) => q.eq("reply->>status", "Pending Approval")),
      count("business_users", (q) => q.eq("status", "pending")),
      count("businesses", (q) => q.eq("status", "Pending")),
      // A ticket nobody has picked up yet.
      count("business_tickets", (q) => q.eq("status", "Open")),
      // A push notification a business has asked us to send.
      count("business_push_requests", (q) => q.eq("status", "pending")),
    ]);
  return { slots, events, occurrences, articles, featured, reviews, replies, users, businesses, tickets, push };
}

export async function getAdminPendingCounts() {
  const [approvals, c] = await Promise.all([
    // Counted with the queue's own rules, but without loading the queue: see
    // countPendingApprovals for why that mattered.
    countPendingApprovals().catch(() => 0),
    simpleCounts(),
  ]);
  const n = (k) => Number(c[k]) || 0;

  return {
    approvals,
    slots: n("slots"),
    events: n("events") + n("occurrences"),
    articles: n("articles"),
    featured: n("featured"),
    reviews: n("reviews") + n("replies"),
    users: n("users"),
    businesses: n("businesses"),
    tickets: n("tickets"),
    push: n("push"),
  };
}
