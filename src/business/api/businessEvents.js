import { supabase } from "../../lib/supabaseClient";

// business_events: "Request Event" — a business requests a See & Do event,
// which goes live after admin approval. Available to all business types.

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
  };
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
  return fromRow(data);
}

export async function updateEvent(id, form) {
  const { error } = await supabase
    .from("business_events")
    .update({ ...toRow(form), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function setEventStatus(id, status) {
  const { error } = await supabase.from("business_events").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteEvent(id) {
  const { error } = await supabase.from("business_events").delete().eq("id", id);
  if (error) throw error;
}
