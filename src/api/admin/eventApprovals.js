import { supabase } from "../../lib/supabaseClient";
import { getLivePlacementMap, featureNow, unfeature, swapFeatured } from "./homepageSlots";
import { assertValidCoords } from "../../lib/geo";
import { logBusinessActivity, eventContext, occurrenceContext } from "./businessActivity";

// Moderation of business-submitted events, and of individual dates within a
// recurring series.
//
// Two review surfaces sit on top of the same data the business portal writes:
//   • business_events.status — the whole event/series ("Pending Approval" → "Live")
//   • business_event_occurrences.review_status — one date of a recurring series,
//     which re-enters review whenever the business edits or cancels it. Until
//     it's approved again the public read policy hides it, so every change is
//     reviewed before it shows on the site.

function eventFromRow(row) {
  return {
    id: row.id,
    businessId: row.business_id,
    author: row.author ?? "business",
    // An admin-authored event can stand alone with no business attached, so
    // there's no name to fall back to — don't leak a raw id into the UI.
    businessName: row.businesses?.name ?? (row.business_id ? row.business_id : null),
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    excerpt: row.excerpt,
    body: row.body ?? [],
    category: row.category ?? [],
    eventDate: row.event_date,
    dateLabel: row.date_label,
    eventTime: row.event_time,
    entryType: row.entry_type,
    tickets: row.tickets,
    location: row.location,
    lat: row.lat,
    lng: row.lng,
    phone: row.phone,
    email: row.email,
    website: row.website,
    bookingUrl: row.booking_url,
    heroImage: row.hero_image,
    gallery: row.gallery ?? [],
    social: row.social ?? {},
    homepage: false,  // set from bookings by getBusinessEvents
    status: row.status,
    rejectionReason: row.rejection_reason,
    isRecurring: row.is_recurring,
    recurrenceType: row.recurrence_type,
    recurrenceDays: row.recurrence_days ?? [],
    recurrenceOrdinals: row.recurrence_ordinals ?? [],
    recurrenceEndDate: row.recurrence_end_date,
    createdAt: row.created_at,
  };
}

function occurrenceFromRow(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    occurrenceDate: row.occurrence_date,
    occurrenceTime: row.occurrence_time,
    status: row.status,
    reviewStatus: row.review_status,
    rejectionReason: row.rejection_reason,
    isModified: row.is_modified,
    overrideTitle: row.override_title,
    overrideSubtitle: row.override_subtitle,
    overrideDescription: row.override_description,
    overrideLocation: row.override_location,
    event: row.business_events ? eventFromRow(row.business_events) : null,
  };
}

// ── Whole events / series ──────────────────────────────────────────────────

export async function getBusinessEvents({ status } = {}) {
  let q = supabase
    .from("business_events")
    .select("*, businesses(name)")
    .order("created_at", { ascending: false });
  if (status && status !== "All") q = q.eq("status", status);
  const [{ data, error }, live] = await Promise.all([q, getLivePlacementMap("whats_on")]);
  if (error) throw error;
  return (data ?? []).map((r) => {
    const slot = live.get(String(r.id));
    // On the homepage now: a live What's On booking.
    return { ...eventFromRow(r), homepage: !!slot, homeStartsAt: slot?.startsAt ?? null, homeEndsAt: slot?.endsAt ?? null };
  });
}

export async function approveEvent(id) {
  const ctx = await eventContext(id);
  const { error } = await supabase
    .from("business_events")
    .update({ status: "Live", rejection_reason: null })
    .eq("id", id);
  if (error) throw error;
  await logBusinessActivity(ctx?.business_id, { action: "event.approved", entityType: "event", entityId: id, title: ctx?.title });
}

export async function rejectEvent(id, reason) {
  const ctx = await eventContext(id);
  const { error } = await supabase
    .from("business_events")
    .update({ status: "Rejected", rejection_reason: reason || null })
    .eq("id", id);
  if (error) throw error;
  await logBusinessActivity(ctx?.business_id, { action: "event.rejected", entityType: "event", entityId: id, title: ctx?.title, detail: reason || null });
}

// Taking a live event off the site without throwing it away.
//
// Rejecting is for something never published; this is for something that is
// out there and should not be. The reason is required and is stored on the
// row, so the business reads why its event disappeared instead of finding a
// hole on its page — the same bargain as rejecting.
//
// This writes 'Removed', NOT 'Hidden', though admin's button says Hide.
// 'Hidden' already belongs to the business: it is what its own Deactivate
// button sets, and its dashboard offers a Make Live button beside it. Hiding
// something as 'Hidden' would hand the business a one-click undo of a
// moderation decision. 'Removed' shows there as "Taken down", with the reason
// and no way to put it back.
export async function hideEvent(id, reason) {
  if (!reason?.trim()) throw new Error("A reason is required — the business is shown it.");
  const ctx = await eventContext(id);
  const { error } = await supabase
    .from("business_events")
    .update({ status: "Removed", rejection_reason: reason.trim() })
    .eq("id", id);
  if (error) {
    // The column only accepts 'Removed' once event_takedown_2026_09.sql has
    // been run. Say that, rather than showing the raw constraint name.
    if (error.code === "23514") {
      throw new Error(
        "Hiding an event needs the database migration event_takedown_2026_09.sql to be run first."
      );
    }
    throw error;
  }
  // An event that is off the site must not keep its What's On booking, or
  // the homepage row points at a page nobody can open.
  await unfeature("whats_on", id).catch(() => {});
  await logBusinessActivity(ctx?.business_id, {
    action: "event.removed", entityType: "event", entityId: id, title: ctx?.title, detail: reason.trim(),
  });
}

// Putting it back. The reason goes with it, so the business is not left
// reading a complaint about an event that is live again.
export async function unhideEvent(id) {
  const ctx = await eventContext(id);
  const { error } = await supabase
    .from("business_events")
    .update({ status: "Live", rejection_reason: null })
    .eq("id", id);
  if (error) throw error;
  await logBusinessActivity(ctx?.business_id, {
    action: "event.restored", entityType: "event", entityId: id, title: ctx?.title,
  });
}

// ── Admin-authored events ──────────────────────────────────────────────────
// Admin writes straight to Live: an admin approving their own submission
// would be meaningless, the same bypass the business content editor uses.
// `businessId` is optional — a town event with no business behind it still
// gets a page and still shows in See & Do.

function slugify(text) {
  return String(text ?? "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function eventToRow(item) {
  return {
    id: item.id || undefined,
    business_id: item.businessId || null,
    // Who wrote it. An event admin writes is free and must not spend a slot
    // the business paid for (admin_added_free_2026_09.sql); a business's own
    // submission stays the business's, because admin edits those through this
    // same editor. saveBusinessEvent fills this in for an existing event, so
    // a missing author here only ever means "admin is creating this".
    author: item.author ?? "admin",
    slug: item.slug || slugify(item.title),
    title: item.title,
    subtitle: item.subtitle || item.excerpt || null,
    description: item.description || null,
    excerpt: item.subtitle || item.excerpt || null,
    body: item.body ?? [],
    category: item.category ?? [],
    event_date: item.eventDate || null,
    date_label: item.dateLabel || null,
    event_time: item.eventTime || null,
    entry_type: item.entryType || null,
    tickets: item.tickets || null,
    location: item.location || null,
    lat: item.lat ?? null,
    lng: item.lng ?? null,
    phone: item.phone || null,
    email: item.email || null,
    website: item.website || null,
    booking_url: item.bookingUrl || null,
    hero_image: item.heroImage || null,
    gallery: item.gallery ?? [],
    social: item.social ?? {},
    status: item.status || "Live",
    updated_at: new Date().toISOString(),
  };
}

export async function saveBusinessEvent(item) {
  assertValidCoords(item.lat, item.lng);
  // An existing event keeps whoever wrote it. The save is an upsert, so a
  // column left out is written back as its default — omitting the author on
  // an edit silently turned admin's own free event into the business's, and
  // the slot limit then refused to save it at all.
  //
  // The recurrence is the same trap, and there is no admin UI for it at all:
  // this editor has no "repeats every Sunday" field, so every column below
  // would go back to its default and a business's recurring event would
  // quietly become a one-off the first time admin opened and saved it. Read
  // back and carry them through untouched.
  let author = item.author;
  let recurrence = null;
  if (item.id) {
    const { data: current } = await supabase
      .from("business_events")
      .select("author, is_recurring, recurrence_type, recurrence_days, recurrence_ordinals, recurrence_start_date, recurrence_end_date")
      .eq("id", item.id).maybeSingle();
    if (!author) author = current?.author ?? "business";
    if (current) {
      recurrence = {
        is_recurring: current.is_recurring ?? false,
        recurrence_type: current.recurrence_type ?? null,
        recurrence_days: current.recurrence_days ?? [],
        recurrence_ordinals: current.recurrence_ordinals ?? [],
        recurrence_start_date: current.recurrence_start_date ?? null,
        recurrence_end_date: current.recurrence_end_date ?? null,
      };
    }
  }
  const { data, error } = await supabase
    .from("business_events")
    .upsert({ ...eventToRow({ ...item, author }), ...(recurrence ?? {}) })
    .select("*, businesses(name)")
    .single();
  if (error) throw error;
  return eventFromRow(data);
}

export async function deleteBusinessEvent(id) {
  // If it's on the homepage, take it off first — deleting the row leaves the
  // placement pointing at a page that no longer exists, same as
  // deleteNewsOfferPost already does for a Spotlight post.
  await unfeature("whats_on", id).catch(() => {});
  const { error } = await supabase.from("business_events").delete().eq("id", id);
  if (error) throw error;
  return { id, deleted: true };
}

// ── Homepage "What's On" selection ─────────────────────────────────────────
// Each pick is a What's On booking (see ./homepageSlots). Turning one on when
// every slot is taken returns { full: true } so the UI can offer a swap.

export async function setEventHomepageFeature(id, featured) {
  if (!featured) {
    await unfeature("whats_on", id);
    return { id, homepage: false };
  }
  const res = await featureNow("whats_on", "business_event", String(id));
  if (res.full) return { full: true };
  return { id, homepage: true };
}

export async function swapEventHomepageFeature(addId, removeId) {
  await swapFeatured("whats_on", "business_event", String(addId), String(removeId));
  return { addId, removeId };
}

// ── Individual dates of a recurring series ─────────────────────────────────

// Every occurrence still awaiting review, newest submissions first. Joined
// back to its parent event so the queue can show which business/series a bare
// date belongs to without a second round trip.
export async function getPendingOccurrences() {
  const { data, error } = await supabase
    .from("business_event_occurrences")
    .select("*, business_events(*, businesses(name))")
    .eq("review_status", "Pending Approval")
    .order("occurrence_date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(occurrenceFromRow);
}

export async function getOccurrences(eventId) {
  const { data, error } = await supabase
    .from("business_event_occurrences")
    .select("*")
    .eq("event_id", eventId)
    .order("occurrence_date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(occurrenceFromRow);
}

export async function approveOccurrence(id) {
  const ctx = await occurrenceContext(id);
  const { error } = await supabase
    .from("business_event_occurrences")
    .update({ review_status: "Approved", rejection_reason: null })
    .eq("id", id);
  if (error) throw error;
  await logBusinessActivity(ctx?.business_id, { action: "occurrence.approved", entityType: "occurrence", entityId: id, title: ctx?.title });
}

export async function rejectOccurrence(id, reason) {
  const ctx = await occurrenceContext(id);
  const { error } = await supabase
    .from("business_event_occurrences")
    .update({ review_status: "Rejected", rejection_reason: reason || null })
    .eq("id", id);
  if (error) throw error;
  await logBusinessActivity(ctx?.business_id, { action: "occurrence.rejected", entityType: "occurrence", entityId: id, title: ctx?.title, detail: reason || null });
}
