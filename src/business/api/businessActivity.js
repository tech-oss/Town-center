import { supabase } from "../../lib/supabaseClient";

// The activity feed on the dashboard: what this business changed, and what
// admin approved or rejected. See supabase/sql/business_activity.sql.
//
// Logging must never break the action it describes — a failed write here is
// reported to the console and otherwise ignored.

export async function logActivity(businessId, { action, entityType, entityId, title, detail, actor = "business", actorName } = {}) {
  if (!businessId || !action) return;
  const { error } = await supabase.from("business_activity").insert({
    business_id: businessId,
    action,
    entity_type: entityType ?? null,
    entity_id: entityId != null ? String(entityId) : null,
    title: title ?? null,
    detail: detail ?? null,
    actor,
    actor_name: actorName ?? null,
  });
  if (error) console.error("business_activity insert failed:", error.message);
}

// Wording for each action. `title` is the item's own name, quoted by the
// caller's template so an entry reads as a sentence.
const LABELS = {
  "listing.updated": (t) => `You updated your listing${t ? ` — ${t}` : ""}`,
  "listing.submitted": (t) => `Listing changes submitted for approval${t ? ` — ${t}` : ""}`,
  "listing.approved": (t) => `Admin approved your listing changes${t ? ` — ${t}` : ""}`,
  "listing.rejected": (t) => `Admin rejected your listing changes${t ? ` — ${t}` : ""}`,
  "article.created": (t) => `You created “${t}”`,
  "article.updated": (t) => `You edited “${t}”`,
  "article.submitted": (t) => `You submitted “${t}” for approval`,
  "article.approved": (t) => `Admin approved “${t}” — now live`,
  "article.rejected": (t) => `Admin rejected “${t}”`,
  "article.hidden": (t) => `“${t}” was taken off your listing`,
  "article.published": (t) => `You published “${t}”`,
  "article.deleted": (t) => `You deleted “${t}”`,
  "event.created": (t) => `You created the event “${t}”`,
  "event.updated": (t) => `You edited the event “${t}”`,
  "event.submitted": (t) => `You submitted the event “${t}” for approval`,
  "event.approved": (t) => `Admin approved the event “${t}” — now live`,
  "event.rejected": (t) => `Admin rejected the event “${t}”`,
  "event.deleted": (t) => `You deleted the event “${t}”`,
  "occurrence.updated": (t) => `You edited a date of “${t}” — awaiting approval`,
  "occurrence.cancelled": (t) => `You cancelled a date of “${t}”`,
  "occurrence.restored": (t) => `You restored a cancelled date of “${t}”`,
  "occurrence.approved": (t) => `Admin approved your change to a date of “${t}”`,
  "occurrence.rejected": (t) => `Admin rejected your change to a date of “${t}”`,
  "review.received": (t) => `New review from ${t}`,
  "review.replied": (t) => `You replied to ${t}'s review — awaiting approval`,
  "review.reply_approved": (t) => `Admin approved your reply to ${t}'s review`,
  "review.reply_rejected": (t) => `Admin rejected your reply to ${t}'s review`,
  "review.hidden": (t) => `Admin hid ${t}'s review`,
  "review.restored": (t) => `Admin restored ${t}'s review`,
  "business.approved": () => "Admin approved your business registration",
  "business.rejected": () => "Admin rejected your business registration",
  "business.suspended": () => "Admin suspended your business",
  "business.reinstated": () => "Admin reinstated your business",
  "profile.visible": () => "You made your profile live",
  "profile.hidden": () => "You hid your profile",
  "profile.details_updated": () => "You updated your personal details",
  "subscription.changed": (t) => `Your plan changed to ${t}`,
  "subscription.payment_failed": () => "Your Premium payment didn't go through — update your card in Billing",
};

// Icon per entity, so the feed scans without reading every line.
const ICONS = {
  listing: "🏬",
  article: "📰",
  event: "📅",
  occurrence: "📅",
  review: "⭐",
  business: "✅",
  profile: "⚙️",
  subscription: "💳",
};

export function activityLabel(row) {
  const build = LABELS[row.action];
  if (build) return build(row.title ?? "");
  // An action added by one side before the other knows about it still reads
  // as something rather than disappearing.
  return `${row.title ?? "Item"} — ${String(row.action).replace(/[._]/g, " ")}`;
}

export function activityIcon(row) {
  return ICONS[row.entityType] ?? "•";
}

export function relativeTime(iso) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fromRow(row) {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    title: row.title,
    detail: row.detail,
    actor: row.actor,
    actorName: row.actor_name,
    createdAt: row.created_at,
  };
}

export async function listActivity(businessId, limit = 10) {
  if (!businessId) return [];
  const { data, error } = await supabase
    .from("business_activity")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(fromRow);
}
