// Events resource (What's On / See & Do) — backed by public.business_events,
// covering both what a business submits for approval and what admin authors
// directly. Only 'Live' events are public; the RLS policy enforces the same.
//
// This used to read the hardcoded src/Data/events.js array. That content now
// lives in the table (see supabase/seed/seed_events_from_data.js), so the
// admin Events editor can actually change what the site shows.
import { supabase } from "../lib/supabaseClient";
import { imageUrl } from "../lib/imageUrl";
import { parseCoords } from "../lib/geo";
import { getLivePlacements, getPromotedEventIds } from "./homepageSlots";

// Formats a date the way the hardcoded content did ("Sunday 14 June 2026"),
// used when an event has a real date but no explicit label. Recurring events
// carry their own phrasing ("2nd Sunday of each month") in date_label.
export function formatEventDate(iso) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function fromRow(r) {
  const gallery = r.gallery ?? [];
  return {
    id: r.id,
    // Events submitted through the business portal predate the slug column and
    // have none, so fall back to the id — otherwise their cards link to
    // /event/null. getEventBySlug resolves either form.
    slug: r.slug || r.id,
    title: r.title,
    // Subtitle and the old admin "Tagline" (excerpt) are the same thing.
    subtitle: r.subtitle || r.excerpt || null,
    // A ticket button only for paid events. The entry type decides; older
    // rows without one count as paid only if their ticket text isn't "free".
    paid: r.entry_type
      ? String(r.entry_type).toLowerCase() === "paid"
      : !!r.tickets && !/free/i.test(r.tickets),
    // `category` is an array on the row (a business can tag several); the
    // public cards and category filters are built around a single label.
    category: Array.isArray(r.category) ? r.category[0] : r.category,
    categories: Array.isArray(r.category) ? r.category : [r.category].filter(Boolean),
    date: r.date_label || formatEventDate(r.event_date),
    iso: r.event_date,
    time: r.event_time,
    location: r.location,
    tickets: r.tickets || r.entry_type,
    image: imageUrl(r.hero_image || gallery[0], "card"),
    heroImage: imageUrl(r.hero_image, "hero") || null,
    // The hero is stored apart from the gallery. Pages use gallery[0] as the
    // banner and the rest as photos, so the hero leads the list here.
    gallery: [r.hero_image, ...gallery.filter((g) => g !== r.hero_image)]
      .filter(Boolean).map((g) => imageUrl(g, "card")),
    excerpt: r.excerpt || r.subtitle || null,
    standfirst: r.description,
    body: r.body ?? [],
    website: r.website,
    bookingUrl: r.booking_url,
    phone: r.phone,
    email: r.email,
    social: r.social ?? {},
    lat: parseCoords(r.lat, r.lng)?.lat ?? null,
    lng: parseCoords(r.lat, r.lng)?.lng ?? null,
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

// The events booked into the homepage "WHAT'S ON" slots right now, in slot order.
export async function getHomepageEvents() {
  const { whats_on: slots } = await getLivePlacements();
  const ids = slots.filter((p) => p.content_kind === "business_event").map((p) => p.content_id);
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("business_events")
    .select("*")
    .eq("status", "Live")
    .in("id", ids);
  if (error) throw error;
  const byId = new Map((data ?? []).map((r) => [String(r.id), r]));
  return ids.map((id) => byId.get(id)).filter(Boolean).map((r) => ({ ...fromRow(r), homepage: true }));
}

// Events that have been on the homepage (booked into What's On). They stay on
// the Offers page after their homepage time is over.
export async function getPromotedEvents() {
  const ids = await getPromotedEventIds();
  if (!ids.size) return [];
  return (await getEvents()).filter((e) => ids.has(String(e.id)));
}
