// Homepage bookings — what's in each homepage slot right now.
//
// Every homepage placement (In the Spotlight, Featured Articles, What's On,
// Featured Businesses) is a booking with a start and end time, made by admin
// or bought by a business (see supabase/sql/homepage_slot_bookings_2026_09.sql).
// public_homepage_placements lists the approved ones; a booking is on the
// homepage only between its start and end, and the page refreshes itself at
// the next start or end so nothing lingers after it runs out.
import { supabase } from "../lib/supabaseClient";
import { refreshAt } from "../lib/homepageClock";

export const SLOT_TYPES = ["spotlight", "featured_article", "whats_on", "featured_business"];

const isLive = (p, now) => new Date(p.starts_at).getTime() <= now && now < new Date(p.ends_at).getTime();

// Approved bookings that haven't finished yet, grouped by slot type, with only
// the live ones kept. Schedules a refresh for the next start/end.
export async function getLivePlacements() {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("public_homepage_placements")
    .select("*")
    .gt("ends_at", nowIso)
    .order("lane");
  // Before the migration runs the view doesn't exist: nothing is booked.
  if (error) {
    console.warn("Homepage bookings unavailable:", error.message);
    return Object.fromEntries(SLOT_TYPES.map((t) => [t, []]));
  }

  const now = Date.now();
  let next = Infinity;
  const bySlot = Object.fromEntries(SLOT_TYPES.map((t) => [t, []]));
  for (const p of data ?? []) {
    const start = new Date(p.starts_at).getTime();
    const end = new Date(p.ends_at).getTime();
    if (isLive(p, now)) {
      bySlot[p.slot_type]?.push(p);
      next = Math.min(next, end);
    } else if (start > now) {
      next = Math.min(next, start);
    }
  }
  if (Number.isFinite(next)) refreshAt(next);
  return bySlot;
}

// "kind:id" keys for everything on the homepage now — for "On Homepage" badges.
export async function getLiveHomepageKeys() {
  const bySlot = await getLivePlacements();
  return new Set(Object.values(bySlot).flat().map((p) => `${p.content_kind}:${p.content_id}`));
}

// Ids of every event that has ever had an approved What's On booking; those
// stay listed on the Offers page after their homepage time ends.
export async function getPromotedEventIds() {
  const { data, error } = await supabase
    .from("public_homepage_placements")
    .select("content_id")
    .eq("slot_type", "whats_on")
    .eq("content_kind", "business_event");
  if (error) return new Set();
  return new Set((data ?? []).map((p) => p.content_id));
}
