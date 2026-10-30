import { supabase } from "../../lib/supabaseClient";
import { linkTarget } from "./appLinks";

// The notifications admin has sent to phones (public_push_feed view), shaped
// for the bell list on the home screen. "Unread" means sent since the list
// was last opened on this device.
const SEEN_KEY = "mh_push_feed_seen_at";

function lastSeen() {
  try { return Number(localStorage.getItem(SEEN_KEY)) || 0; } catch { return 0; }
}

export function markPushFeedSeen() {
  try { localStorage.setItem(SEEN_KEY, String(Date.now())); } catch { /* badge shows again */ }
}

function timeAgo(iso) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// Notifications cleared from the list on this phone.
const CLEARED_KEY = "mh_push_feed_cleared";
function clearedIds() {
  try { return new Set(JSON.parse(localStorage.getItem(CLEARED_KEY) || "[]")); } catch { return new Set(); }
}
export function clearPushFeedItems(ids) {
  const all = clearedIds();
  ids.forEach((id) => all.add(id));
  // Only the newest few hundred are kept; older ones have left the feed anyway.
  try { localStorage.setItem(CLEARED_KEY, JSON.stringify([...all].slice(-300))); } catch { /* shows again */ }
}

export async function getPushFeed() {
  const { data, error } = await supabase.from("public_push_feed").select("*");
  if (error) throw error;
  const seen = lastSeen();
  // Before the list has ever been opened, only the last three days count as new.
  const since = seen || Date.now() - 3 * 24 * 60 * 60 * 1000;
  const cleared = clearedIds();
  return (data ?? []).filter((r) => !cleared.has(r.id)).map((r) => ({
    id: r.id,
    business: "Maidenhead",
    category: r.notif_type === "rich" ? "News & Offers" : null,
    title: r.title,
    body: r.body ?? "",
    when: timeAgo(r.sent_at),
    image: r.article_image || null,
    link: linkTarget(r.url),
    unread: new Date(r.sent_at).getTime() > since,
  }));
}
