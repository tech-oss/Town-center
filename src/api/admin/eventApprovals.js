import { supabase } from "../../lib/supabaseClient";
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
    homepage: row.homepage ?? false,
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
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(eventFromRow);
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
    slug: item.slug || slugify(item.title),
    title: item.title,
    subtitle: item.subtitle || null,
    description: item.description || null,
    excerpt: item.excerpt || null,
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
  const { data, error } = await supabase
    .from("business_events")
    .upsert(eventToRow(item))
    .select("*, businesses(name)")
    .single();
  if (error) throw error;
  return eventFromRow(data);
}

export async function deleteBusinessEvent(id) {
  const { error } = await supabase.from("business_events").delete().eq("id", id);
  if (error) throw error;
  return { id, deleted: true };
}

// ── Homepage "What's On" selection ─────────────────────────────────────────
// Three slots on the homepage grid. Turning one off always succeeds; turning
// one on when all three are taken returns { full: true } so the UI can offer
// a swap rather than a dead end (same pattern as news_offers/feature_articles).

export async function setEventHomepageFeature(id, featured) {
  if (!featured) {
    const { error } = await supabase.from("business_events").update({ homepage: false }).eq("id", id);
    if (error) throw error;
    return { id, homepage: false };
  }

  const { count, error: countError } = await supabase
    .from("business_events")
    .select("id", { count: "exact", head: true })
    .eq("homepage", true)
    .neq("id", id);
  if (countError) throw countError;
  if ((count ?? 0) >= 3) return { full: true };

  const { error } = await supabase.from("business_events").update({ homepage: true }).eq("id", id);
  if (error) throw error;
  return { id, homepage: true };
}

export async function swapEventHomepageFeature(addId, removeId) {
  const { error: offErr } = await supabase.from("business_events").update({ homepage: false }).eq("id", removeId);
  if (offErr) throw offErr;
  const { error: onErr } = await supabase.from("business_events").update({ homepage: true }).eq("id", addId);
  if (onErr) throw onErr;
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
