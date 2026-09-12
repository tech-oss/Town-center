import { supabase } from "../../lib/supabaseClient";
import { logActivity } from "./businessActivity";
import { expandRecurrence } from "./eventRecurrence";

// business_events: "Request Event" — a business requests a See & Do event,
// which goes live after admin approval. Available to all business types.
// A recurring event stores its rule on the business_events row (the
// "series") and materializes individual dates into
// business_event_occurrences — see supabase/sql/event_occurrences.sql.

// How far ahead occurrences get materialized for an open-ended (no end
// date) recurring series.
const GENERATE_MONTHS_AHEAD = 6;

function fromRow(row) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    category: row.category ?? [],
    eventDate: row.event_date,
    eventTime: row.event_time,
    entryType: row.entry_type,
    location: row.location,
    lat: row.lat,
    lng: row.lng,
    social: row.social,
    website: row.website,
    bookingUrl: row.booking_url,
    gallery: row.gallery,
    status: row.status,
    rejectionReason: row.rejection_reason,
    isRecurring: row.is_recurring ?? false,
    recurrenceType: row.recurrence_type ?? null,
    recurrenceDays: row.recurrence_days ?? [],
    recurrenceOrdinals: row.recurrence_ordinals ?? [],
    recurrenceStartDate: row.recurrence_start_date ?? null,
    recurrenceEndDate: row.recurrence_end_date ?? null,
  };
}

function toRow(form) {
  return {
    title: form.title,
    subtitle: form.subtitle,
    description: form.description,
    category: form.category ?? [],
    event_date: form.eventDate || null,
    event_time: form.eventTime,
    entry_type: form.entryType,
    location: form.location,
    lat: form.lat,
    lng: form.lng,
    social: form.social,
    website: form.website,
    booking_url: form.bookingUrl,
    gallery: form.gallery,
    status: form.status,
    is_recurring: !!form.isRecurring,
    recurrence_type: form.isRecurring ? form.recurrenceType : null,
    recurrence_days: form.isRecurring ? (form.recurrenceDays ?? []) : [],
    recurrence_ordinals: form.isRecurring ? (form.recurrenceOrdinals ?? []) : [],
    recurrence_start_date: form.isRecurring ? (form.eventDate || null) : null,
    recurrence_end_date: form.isRecurring ? (form.recurrenceEndDate || null) : null,
  };
}

// Who owns an event, and the event behind an occurrence — both for the
// activity log, since these mutations are addressed by id alone.
async function eventOwner(id) {
  const { data } = await supabase.from("business_events").select("business_id, title").eq("id", id).maybeSingle();
  return data ?? null;
}

async function occurrenceOwner(id) {
  const { data } = await supabase
    .from("business_event_occurrences")
    .select("event_id, business_events(business_id, title)")
    .eq("id", id).maybeSingle();
  return data?.business_events ?? null;
}

export async function listEvents(businessId) {
  const { data, error } = await supabase
    .from("business_events")
    .select("*")
    .eq("business_id", businessId)
    .order("event_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function getEvent(id) {
  const { data, error } = await supabase.from("business_events").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

export async function createEvent(businessId, form) {
  const { data, error } = await supabase
    .from("business_events")
    .insert({ business_id: businessId, ...toRow(form) })
    .select()
    .single();
  if (error) throw error;
  const created = fromRow(data);
  if (created.isRecurring) await generateOccurrences(created);
  await logActivity(businessId, {
    action: created.status === "Pending Approval" ? "event.submitted" : "event.created",
    entityType: "event", entityId: created.id, title: created.title,
  });
  return created;
}

export async function updateEvent(id, form) {
  const { error } = await supabase
    .from("business_events")
    .update({ ...toRow(form), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  if (form.isRecurring) await generateOccurrences({ id, ...form });
  const owner = await eventOwner(id);
  await logActivity(owner?.business_id, {
    action: form.status === "Pending Approval" ? "event.submitted" : "event.updated",
    entityType: "event", entityId: id, title: form.title ?? owner?.title,
  });
}

export async function setEventStatus(id, status) {
  const owner = await eventOwner(id);
  const { error } = await supabase.from("business_events").update({ status }).eq("id", id);
  if (error) throw error;
  await logActivity(owner?.business_id, {
    action: status === "Pending Approval" ? "event.submitted" : "event.updated",
    entityType: "event", entityId: id, title: owner?.title,
  });
}

export async function deleteEvent(id) {
  const owner = await eventOwner(id);
  const { error } = await supabase.from("business_events").delete().eq("id", id);
  if (error) throw error;
  await logActivity(owner?.business_id, { action: "event.deleted", entityType: "event", entityId: id, title: owner?.title });
}

// ─── Recurring occurrences ──────────────────────────────────────────────────

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
    overrideLat: row.override_lat,
    overrideLng: row.override_lng,
    overrideEntryType: row.override_entry_type,
    overrideWebsite: row.override_website,
    overrideBookingUrl: row.override_booking_url,
    overrideSocial: row.override_social,
    overrideGallery: row.override_gallery,
  };
}

// Materializes any missing occurrence rows for a recurring series, out to
// GENERATE_MONTHS_AHEAD (or the series' end date if sooner). Safe to call
// repeatedly — only inserts dates that don't already have a row, so it never
// touches an occurrence that's already been individually edited/cancelled.
export async function generateOccurrences(event) {
  const rule = {
    type: event.recurrenceType,
    days: event.recurrenceDays,
    ordinals: event.recurrenceOrdinals,
    startDate: event.recurrenceStartDate || event.eventDate,
    endDate: event.recurrenceEndDate,
  };
  if (!rule.type || !rule.startDate) return;

  const today = new Date();
  const horizon = new Date(today.getFullYear(), today.getMonth() + GENERATE_MONTHS_AHEAD, today.getDate());
  const toStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const dates = expandRecurrence(rule, { from: rule.startDate, to: toStr(horizon) });
  if (!dates.length) return;

  const { data: existing, error: fetchError } = await supabase
    .from("business_event_occurrences")
    .select("occurrence_date")
    .eq("event_id", event.id);
  if (fetchError) throw fetchError;
  const existingDates = new Set((existing ?? []).map((r) => r.occurrence_date));

  const toInsert = dates
    .filter((d) => !existingDates.has(d))
    .map((d) => ({
      event_id: event.id,
      occurrence_date: d,
      occurrence_time: event.eventTime ?? null,
      status: "Scheduled",
      review_status: "Approved", // inherits the series' own already-approved state
    }));
  if (!toInsert.length) return;

  const { error } = await supabase.from("business_event_occurrences").insert(toInsert);
  if (error) throw error;
}

export async function listOccurrences(eventId) {
  const { data, error } = await supabase
    .from("business_event_occurrences")
    .select("*")
    .eq("event_id", eventId)
    .order("occurrence_date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(occurrenceFromRow);
}

function overridesToRow(overrides) {
  return {
    occurrence_time: overrides.occurrenceTime ?? null,
    override_title: overrides.overrideTitle || null,
    override_subtitle: overrides.overrideSubtitle || null,
    override_description: overrides.overrideDescription || null,
    override_location: overrides.overrideLocation || null,
    override_lat: overrides.overrideLat || null,
    override_lng: overrides.overrideLng || null,
    override_entry_type: overrides.overrideEntryType || null,
    override_website: overrides.overrideWebsite || null,
    override_booking_url: overrides.overrideBookingUrl || null,
    override_social: overrides.overrideSocial || null,
    override_gallery: overrides.overrideGallery || null,
  };
}

// Any edit to a single occurrence re-enters admin review — it stays hidden
// from the public site (review_status != 'Approved') until re-approved.
export async function updateOccurrence(id, overrides) {
  const { error } = await supabase
    .from("business_event_occurrences")
    .update({
      ...overridesToRow(overrides),
      is_modified: true,
      review_status: "Pending Approval",
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
  const owner = await occurrenceOwner(id);
  await logActivity(owner?.business_id, { action: "occurrence.updated", entityType: "occurrence", entityId: id, title: owner?.title });
}

// Cancelling one date is also a change that needs review — the occurrence
// keeps its history rather than being deleted.
export async function cancelOccurrence(id) {
  const { error } = await supabase
    .from("business_event_occurrences")
    .update({ status: "Cancelled", review_status: "Pending Approval", rejection_reason: null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  const owner = await occurrenceOwner(id);
  await logActivity(owner?.business_id, { action: "occurrence.cancelled", entityType: "occurrence", entityId: id, title: owner?.title });
}

export async function restoreOccurrence(id) {
  const { error } = await supabase
    .from("business_event_occurrences")
    .update({ status: "Scheduled", review_status: "Pending Approval", rejection_reason: null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  const owner = await occurrenceOwner(id);
  await logActivity(owner?.business_id, { action: "occurrence.restored", entityType: "occurrence", entityId: id, title: owner?.title });
}

// Clears all overrides, reverting the occurrence back to inheriting the
// series' defaults. Still needs review, since it's still a change from
// whatever is currently approved for that date.
export async function resetOccurrence(id) {
  const { error } = await supabase
    .from("business_event_occurrences")
    .update({
      ...overridesToRow({}),
      is_modified: false,
      review_status: "Pending Approval",
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}
