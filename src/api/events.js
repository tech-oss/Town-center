// Events resource (What's On / See & Do) — backed by public.business_events,
// covering both what a business submits for approval and what admin authors
// directly. Only 'Live' events are public; the RLS policy enforces the same.
//
// This used to read the hardcoded src/Data/events.js array. That content now
// lives in the table (see supabase/seed/seed_events_from_data.js), so the
// admin Events editor can actually change what the site shows.
import { supabase } from "../lib/supabaseClient";

// Formats a date the way the hardcoded content did ("Sunday 14 June 2026"),
// used when an event has a real date but no explicit label. Recurring events
// carry their own phrasing ("2nd Sunday of each month") in date_label.
function formatEventDate(iso) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function fromRow(r) {
  const gallery = r.gallery ?? [];
  return {
    // Events submitted through the business portal predate the slug column and
    // have none, so fall back to the id — otherwise their cards link to
    // /event/null. getEventBySlug resolves either form.
    slug: r.slug || r.id,
    title: r.title,
    subtitle: r.subtitle,
    // `category` is an array on the row (a business can tag several); the
    // public cards and category filters are built around a single label.
    category: Array.isArray(r.category) ? r.category[0] : r.category,
    categories: Array.isArray(r.category) ? r.category : [r.category].filter(Boolean),
    date: r.date_label || formatEventDate(r.event_date),
    iso: r.event_date,
    time: r.event_time,
    location: r.location,
    tickets: r.tickets || r.entry_type,
    image: r.hero_image || gallery[0],
    gallery,
    excerpt: r.excerpt,
    standfirst: r.description,
    body: r.body ?? [],
    website: r.website,
    bookingUrl: r.booking_url,
    phone: r.phone,
    email: r.email,
    social: r.social ?? {},
    lat: r.lat,
    lng: r.lng,
    homepage: r.homepage ?? false,
    businessId: r.business_id,
  };
}

export async function getEvents() {
  const { data, error } = await supabase
    .from("business_events")
    .select("*")
    .eq("status", "Live")
    .order("event_date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function getEventBySlug(slug) {
  const { data, error } = await supabase
    .from("business_events")
    .select("*")
    .eq("slug", slug)
    .eq("status", "Live")
    .maybeSingle();
  if (error) throw error;
  if (data) return fromRow(data);

  // Slug-less business submissions are addressed by id (see fromRow).
  if (!/^[0-9a-f-]{36}$/i.test(slug)) return null;
  const { data: byId, error: idError } = await supabase
    .from("business_events")
    .select("*")
    .eq("id", slug)
    .eq("status", "Live")
    .maybeSingle();
  if (idError) throw idError;
  return byId ? fromRow(byId) : null;
}

// The three events admin has chosen for the homepage "WHAT'S ON" grid.
export async function getHomepageEvents() {
  const { data, error } = await supabase
    .from("business_events")
    .select("*")
    .eq("status", "Live")
    .eq("homepage", true)
    .order("event_date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}
