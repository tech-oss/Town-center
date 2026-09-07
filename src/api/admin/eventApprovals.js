import { supabase } from "../../lib/supabaseClient";

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
    businessName: row.businesses?.name ?? row.business_id,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    category: row.category ?? [],
    eventDate: row.event_date,
    eventTime: row.event_time,
    entryType: row.entry_type,
    location: row.location,
    website: row.website,
    bookingUrl: row.booking_url,
    gallery: row.gallery ?? [],
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
  const { error } = await supabase
    .from("business_events")
    .update({ status: "Live", rejection_reason: null })
    .eq("id", id);
  if (error) throw error;
}

export async function rejectEvent(id, reason) {
  const { error } = await supabase
    .from("business_events")
    .update({ status: "Rejected", rejection_reason: reason || null })
    .eq("id", id);
  if (error) throw error;
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
  const { error } = await supabase
    .from("business_event_occurrences")
    .update({ review_status: "Approved", rejection_reason: null })
    .eq("id", id);
  if (error) throw error;
}

export async function rejectOccurrence(id, reason) {
  const { error } = await supabase
    .from("business_event_occurrences")
    .update({ review_status: "Rejected", rejection_reason: reason || null })
    .eq("id", id);
  if (error) throw error;
}
