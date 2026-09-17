import { supabase } from "../../lib/supabaseClient";

// Homepage slot bookings for a business (supabase/sql/homepage_slot_bookings_2026_09.sql
// on the admin-panel branch). A business pays once for a slot type and gets
// the next free slot; the database guarantees no two businesses share one.
// Payment goes through Stripe Checkout (stripe-checkout, kind "placement");
// the booking is confirmed only when Stripe tells stripe-webhook it's paid.

export const SLOT_CONTENT = {
  spotlight: { kind: "business_article", noun: "news or offer post", manage: "/business/articles" },
  featured_article: { kind: "business_article", noun: "news or offer post", manage: "/business/articles" },
  whats_on: { kind: "business_event", noun: "event", manage: "/business/events" },
  featured_business: { kind: "business", noun: "listing", manage: "/business/listing" },
};

export const BOOKING_STATUS = {
  held: "Awaiting payment",
  awaiting_content: "Choose what to show",
  pending_approval: "Waiting for approval",
  approved: "Approved",
  rejected: "Not approved — choose again",
  cancelled: "Cancelled",
};

function availabilityFromRow(r) {
  return {
    slotType: r.slot_type,
    label: r.label,
    description: r.description ?? "",
    capacity: r.capacity,
    durationDays: r.duration_days,
    price: r.price_pence / 100,
    bookable: r.bookable,
    liveCount: r.live_count,
    soonestEndingAt: r.soonest_ending_at,
    soonestEnding: r.soonest_ending,
    nextStart: r.next_start,
    nextEnd: r.next_end,
  };
}

// Each slot type with its price, what ends soonest and the next free slot.
export async function getSlotAvailability(businessId) {
  const { data, error } = await supabase.rpc("homepage_slot_availability", { p_business_id: businessId });
  if (error) throw error;
  return (data ?? []).map(availabilityFromRow);
}

function bookingFromRow(r, titles) {
  return {
    id: r.id,
    slotType: r.slot_type,
    contentKind: r.content_kind,
    contentId: r.content_id,
    contentTitle: titles?.get(r.content_id) ?? null,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    status: r.status,
    amount: r.amount_pence != null ? r.amount_pence / 100 : null,
    paidAt: r.paid_at,
    rejectionReason: r.rejection_reason,
    holdExpiresAt: r.hold_expires_at,
  };
}

// This business's paid bookings that haven't finished, plus the last 90 days.
export async function getMyBookings(businessId) {
  const since = new Date(Date.now() - 90 * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("homepage_placements")
    .select("*")
    .eq("business_id", businessId)
    .not("paid_at", "is", null)
    .neq("status", "cancelled")
    .gt("ends_at", since)
    .order("starts_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];

  const titles = new Map();
  const ids = (kind) => rows.filter((r) => r.content_kind === kind).map((r) => r.content_id);
  const [articles, events] = await Promise.all([
    ids("business_article").length ? supabase.from("business_articles").select("id, title").in("id", ids("business_article")) : { data: [] },
    ids("business_event").length ? supabase.from("business_events").select("id, title").in("id", ids("business_event")) : { data: [] },
  ]);
  for (const r of [...(articles.data ?? []), ...(events.data ?? [])]) titles.set(String(r.id), r.title);
  return rows.map((r) => bookingFromRow(r, titles));
}

export async function getBooking(placementId) {
  const { data, error } = await supabase.from("homepage_placements").select("*").eq("id", placementId).maybeSingle();
  if (error) throw error;
  return data ? bookingFromRow(data) : null;
}

// What this business can put in a slot: its own live posts or events.
export async function getMyContentOptions(businessId, slotType) {
  const kind = SLOT_CONTENT[slotType]?.kind;
  if (kind === "business_article") {
    const { data, error } = await supabase.from("business_articles")
      .select("id, title, type, hero_image, thumbnail")
      .eq("business_id", businessId).eq("status", "Live").order("date", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => ({ kind, id: String(r.id), title: r.title, detail: r.type ?? "News", image: r.hero_image || r.thumbnail }));
  }
  if (kind === "business_event") {
    const { data, error } = await supabase.from("business_events")
      .select("id, title, event_date, date_label, hero_image")
      .eq("business_id", businessId).eq("status", "Live").order("event_date", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => ({ kind, id: String(r.id), title: r.title, detail: r.date_label || r.event_date || "", image: r.hero_image }));
  }
  return [];
}

export async function chooseBookingContent(placementId, kind, contentId) {
  const { error } = await supabase.rpc("set_placement_content", {
    p_placement_id: placementId, p_kind: kind, p_content_id: contentId,
  });
  if (error) throw new Error(error.message);
}

// Reserves the next free slot and sends the browser to Stripe to pay for it.
export async function startSlotCheckout(businessId, slotType) {
  const { data, error } = await supabase.functions.invoke("stripe-checkout", {
    body: { kind: "placement", businessId, slotType },
  });
  if (error) {
    let message = error.message;
    try { message = (await error.context?.json())?.error ?? message; } catch { /* keep generic */ }
    throw new Error(message);
  }
  if (!data?.url) throw new Error(data?.error ?? "Stripe didn't return a page to open.");
  window.location.assign(data.url);
}

// Gives back a slot the business didn't pay for (closed Stripe).
export async function releaseHold(placementId) {
  await supabase.rpc("release_homepage_hold", { p_placement_id: placementId });
}

// After Stripe, waits for the webhook to confirm the booking. Looked up by the
// Stripe session too: if the hold had lapsed, the paid booking is a new row.
export async function waitForBookingPaid(placementId, sessionId, { timeoutMs = 30000, intervalMs = 2000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    let booking = null;
    if (sessionId) {
      const { data } = await supabase.from("homepage_placements").select("*")
        .eq("stripe_session_id", sessionId).not("paid_at", "is", null).maybeSingle();
      booking = data ? bookingFromRow(data) : null;
    }
    booking ??= await getBooking(placementId).catch(() => null);
    if (booking?.paidAt) return booking;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return null;
}
