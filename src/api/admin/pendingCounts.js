import { supabase } from "../../lib/supabaseClient";
import { getApprovals } from "./approvals";

// How much is waiting in every admin queue, for the sidebar badges.
//
// Each is a head-only count query, so this is a handful of tiny requests
// rather than loading the queues themselves. A queue whose table or column
// isn't there yet (a migration not run) just reads 0 — one missing count must
// never blank the whole sidebar.

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

export async function getAdminPendingCounts() {
  const [
    approvals,
    slots,
    events,
    occurrences,
    articles,
    featured,
    reviews,
    replies,
    users,
    businesses,
    tickets,
  ] = await Promise.all([
    // The listing-edit queue already applies its own rules about what counts
    // as a real submission, so it's reused rather than re-derived here.
    getApprovals({ status: "Pending" }).then((l) => l?.length ?? 0).catch(() => 0),
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
  ]);

  return {
    approvals,
    slots,
    events: events + occurrences,
    articles,
    featured,
    reviews: reviews + replies,
    users,
    businesses,
    tickets,
  };
}
