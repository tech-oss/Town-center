// One-time seed: moves the hardcoded src/Data/events.js content into
// public.business_events, so the public site (What's On grid, See & Do
// listing, /event/:slug) can read Supabase and admin can edit what it shows.
//
// Run it once, from the browser console of the admin panel while signed in as
// an admin (the insert needs the is_admin() RLS policy):
//
//   const { seedEvents } = await import("/supabase/seed/seed_events_from_data.js");
//   await seedEvents();
//
// Safe to re-run: upserts on `slug`, so existing rows are refreshed rather
// than duplicated. Depends on admin_events_2026_09.sql having been applied.
import { events } from "../../src/Data/events";
import { supabase } from "../../src/lib/supabaseClient";

function toRow(e) {
  return {
    slug: e.slug,
    business_id: null,          // town events, not tied to a business
    title: e.title,
    description: e.standfirst ?? null,
    excerpt: e.excerpt ?? null,
    body: e.body ?? [],
    category: e.category ? [e.category] : [],
    event_date: e.iso ?? null,  // recurring events have no single date
    date_label: e.date ?? null,
    event_time: e.time ?? null,
    entry_type: /free/i.test(e.tickets ?? "") ? "Free" : "Paid",
    tickets: e.tickets ?? null,
    location: e.location ?? null,
    website: e.website ?? null,
    hero_image: e.image ?? null,
    gallery: e.gallery ?? [],
    social: e.social ?? {},
    status: "Live",
    is_recurring: e.recurringWeekday !== undefined,
  };
}

export async function seedEvents() {
  const rows = events.map(toRow);
  const { data, error } = await supabase
    .from("business_events")
    .upsert(rows, { onConflict: "slug" })
    .select("slug");
  if (error) throw error;
  return { seeded: data?.length ?? 0 };
}
