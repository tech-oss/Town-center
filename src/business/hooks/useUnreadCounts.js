import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { listTickets } from "../api/businessTickets";

// Sidebar "unread" badges: what Maidenhead admin has done since this person
// last opened each tab — an approval or rejection (business_activity rows
// with actor 'admin') or a reply on a support ticket.
//
// "Last opened" is kept per browser, per login. Nothing to migrate, and a
// first visit counts from now rather than flagging the whole history.

// Which tab an admin action belongs to, by the prefix of its action name.
const TAB_FOR_ACTION = {
  article: "/business/articles",
  featured_article: "/business/featured-articles",
  event: "/business/events",
  occurrence: "/business/events",
  review: "/business/reviews",
  push: "/business/push-notifications",
  listing: "/business/listing",
  placement: "/business/billing",
  subscription: "/business/billing",
};
export const SUPPORT_TAB = "/business/support";

const key = (who, tab) => `bizSeen:${who}:${tab}`;

function readSeen(who, tab) {
  try {
    const v = localStorage.getItem(key(who, tab));
    if (v) return v;
    const now = new Date().toISOString();
    localStorage.setItem(key(who, tab), now);
    return now;
  } catch {
    return new Date().toISOString();
  }
}

export function markSeen(who, tab) {
  try { localStorage.setItem(key(who, tab), new Date().toISOString()); } catch { /* private window */ }
}

// Admin replies store "YYYY-MM-DD HH:MM" in UTC (toISOString sliced).
const replyTime = (d) => new Date(String(d).replace(" ", "T") + "Z").toISOString();

async function countUnread(user, who) {
  const counts = {};
  const tabs = [...new Set(Object.values(TAB_FOR_ACTION))];
  const since = Object.fromEntries(tabs.map((t) => [t, readSeen(who, t)]));
  const oldest = tabs.reduce((m, t) => (since[t] < m ? since[t] : m), since[tabs[0]]);

  const [{ data: activity }, tickets] = await Promise.all([
    supabase.from("business_activity").select("action, created_at")
      .eq("business_id", user.id).eq("actor", "admin").gt("created_at", oldest),
    listTickets(user.id).catch(() => []),
  ]);

  for (const row of activity ?? []) {
    const tab = TAB_FOR_ACTION[String(row.action).split(".")[0]];
    if (tab && row.created_at > since[tab]) counts[tab] = (counts[tab] ?? 0) + 1;
  }

  const supportSince = readSeen(who, SUPPORT_TAB);
  counts[SUPPORT_TAB] = tickets.filter((t) =>
    t.thread.some((m) => m.from === "admin" && m.date && replyTime(m.date) > supportSince)).length;

  return counts;
}

export default function useUnreadCounts(user, pathname) {
  const [counts, setCounts] = useState({});
  const who = user?.email ?? user?.id;

  useEffect(() => {
    if (!user) return;
    // Opening a tab clears its badge.
    const tab = Object.values(TAB_FOR_ACTION).concat(SUPPORT_TAB).find((t) => pathname.startsWith(t));
    if (tab) markSeen(who, tab);
    let cancelled = false;
    const load = () => countUnread(user, who).then((c) => { if (!cancelled) setCounts(c); }).catch(() => {});
    load();
    // Picks up an approval made while this page sits open.
    const timer = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [user?.id, who, pathname]);

  return counts;
}
