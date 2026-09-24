import { supabase } from "../../lib/supabaseClient";

// Homepage slot bookings for a business (supabase/sql/homepage_slot_bookings_2026_09.sql
// on the admin-panel branch). A business pays once for a slot type and gets
// the next free slot; the database guarantees no two businesses share one.
// Payment goes through Stripe Checkout (stripe-checkout, kind "placement");
// the booking is confirmed only when Stripe tells stripe-webhook it's paid.

// What each slot shows, and where that kind of thing is written. `tab` is
// the name on the sidebar, so a link reads the way the nav does.
export const SLOT_CONTENT = {
  spotlight: { kind: "business_article", noun: "news or offer post", manage: "/business/articles", tab: "News & Articles" },
  // A Featured Article slot shows a Featured Article — one of the longer
  // editorial pieces — and nothing else.
  featured_article: { kind: "feature_article", noun: "Featured Article", manage: "/business/featured-articles", tab: "Featured Articles" },
  whats_on: { kind: "business_event", noun: "event", manage: "/business/events", tab: "Request Event" },
  featured_business: { kind: "business", noun: "listing", manage: "/business/listing", tab: "My Listing" },
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
    packageId: r.package_id,
    packageName: r.package_name,
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

// Every package on sale, with its price and length, what ends soonest in that
// slot and the slot this business would get if it bought that package now.
// Grouped by slot type so each card can offer its packages side by side.
export async function getSlotAvailability(businessId) {
  const { data, error } = await supabase.rpc("homepage_package_availability", { p_business_id: businessId });
  if (error) throw error;
  const rows = (data ?? []).map(availabilityFromRow);
  const bySlot = new Map();
  for (const r of rows) {
    const slot = bySlot.get(r.slotType) ?? {
      slotType: r.slotType, label: r.label, description: r.description,
      capacity: r.capacity, bookable: r.bookable, liveCount: r.liveCount,
      soonestEndingAt: r.soonestEndingAt, soonestEnding: r.soonestEnding,
      packages: [],
    };
    slot.packages.push({
      id: r.packageId, name: r.packageName, price: r.price,
      durationDays: r.durationDays, nextStart: r.nextStart, nextEnd: r.nextEnd,
    });
    bySlot.set(r.slotType, slot);
  }
  return [...bySlot.values()];
}

function bookingFromRow(r, titles) {
  return {
    id: r.id,
    slotType: r.slot_type,
    contentKind: r.content_kind,
    contentId: r.content_id,
    contentTitle: titles?.get(r.content_id) ?? null,
    // A post written for this booking (news_offers), for editing.
    post: null,
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
  const [articles, events, posts, features] = await Promise.all([
    ids("business_article").length ? supabase.from("business_articles").select("id, title").in("id", ids("business_article")) : { data: [] },
    ids("business_event").length ? supabase.from("business_events").select("id, title").in("id", ids("business_event")) : { data: [] },
    ids("news_offer").length ? supabase.from("news_offers").select("*").in("id", ids("news_offer")) : { data: [] },
    // A Featured Article the business wrote, booked onto the homepage.
    ids("feature_article").length ? supabase.from("feature_articles").select("id, title, card_heading").in("id", ids("feature_article")) : { data: [] },
  ]);
  for (const r of [...(articles.data ?? []), ...(events.data ?? []), ...(posts.data ?? [])]) titles.set(String(r.id), r.title);
  for (const r of features.data ?? []) titles.set(String(r.id), r.card_heading || r.title);
  const postById = new Map((posts.data ?? []).map((n) => [String(n.id), {
    type: n.type === "offer" ? "offer" : "news",
    title: n.title ?? "",
    excerpt: n.excerpt ?? "",
    body: n.body ?? "",
    image: n.image ?? "",
    startDate: n.start_date ?? "",
    endDate: n.end_date ?? "",
    published: n.status === "Published",
  }]));
  return rows.map((r) => ({
    ...bookingFromRow(r, titles),
    post: r.content_kind === "news_offer" ? postById.get(r.content_id) ?? null : null,
  }));
}

export async function getBooking(placementId) {
  const { data, error } = await supabase.from("homepage_placements").select("*").eq("id", placementId).maybeSingle();
  if (error) throw error;
  return data ? bookingFromRow(data) : null;
}

// What this business can put in a slot: its own posts (live or waiting for
// approval) or live events.
export async function getMyContentOptions(businessId, slotType) {
  const kind = SLOT_CONTENT[slotType]?.kind;
  let options = [];
  if (kind === "business_article") {
    const { data, error } = await supabase.from("business_articles")
      .select("id, title, type, status, hero_image, thumbnail")
      .eq("business_id", businessId).in("status", ["Live", "Pending Approval"]).order("date", { ascending: false });
    if (error) throw error;
    options = (data ?? []).map((r) => ({
      kind, id: String(r.id), title: r.title,
      detail: [r.type ?? "News", r.status === "Live" ? null : "waiting for approval"].filter(Boolean).join(" · "),
      image: r.hero_image || r.thumbnail,
    }));
  }
  // A Featured Article slot shows a Featured Article — the longer editorial
  // pieces — and never a short news or offer post.
  if (kind === "feature_article") {
    const { data, error } = await supabase.from("feature_articles")
      .select("id, title, card_heading, hero_image, card_image, status")
      .eq("business_id", businessId).eq("status", "Live")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      kind, id: String(r.id), title: r.card_heading || r.title,
      detail: "Featured Article", image: r.hero_image || r.card_image,
    }));
  }

  if (kind === "business_event") {
    const { data, error } = await supabase.from("business_events")
      .select("id, title, event_date, date_label, hero_image")
      .eq("business_id", businessId).eq("status", "Live").order("event_date", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => ({ kind, id: String(r.id), title: r.title, detail: r.date_label || r.event_date || "", image: r.hero_image }));
  }
  return options;
}

export async function chooseBookingContent(placementId, kind, contentId) {
  const { error } = await supabase.rpc("set_placement_content", {
    p_placement_id: placementId, p_kind: kind, p_content_id: contentId,
  });
  if (error) throw new Error(error.message);
}

// Writes (or edits) a post for this booking and sends it for approval. Any
// plan can do this; the post goes live when admin approves the booking.
export async function saveBookingPost(placementId, post) {
  const { error } = await supabase.rpc("save_placement_post", {
    p_placement_id: placementId,
    p_type: post.type,
    p_title: post.title,
    p_excerpt: post.excerpt,
    p_body: post.body,
    p_image: post.image || null,
    p_start_date: post.startDate || null,
    p_end_date: post.endDate || null,
  });
  if (error) throw new Error(error.message);
}

// Reserves the next free slot for the chosen package and sends the browser to
// Stripe to pay for it.
export async function startSlotCheckout(businessId, slotType, packageId) {
  const { data, error } = await supabase.functions.invoke("stripe-checkout", {
    body: { kind: "placement", businessId, slotType, packageId },
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
