// Registered businesses, read from Supabase for the public website and app.
//
// Until now every public business page rendered the static demo data in
// src/Data/pages.js — nothing a business or admin entered ever reached the
// site. This reads public.public_business_profiles (approved, visible
// businesses only) and maps each row onto the exact item shape the pages
// already use, so the existing layouts render real listings unchanged.
//
// Free-plan listings arrive with every premium-only column already withheld
// by the database view; `plan` travels with the item so the pages can show
// the "coming soon" placeholders in those places.
import { supabase } from "../lib/supabaseClient";
import { categoryLabel } from "../Data/taxonomy";
import { brandGrid } from "../Data/content";

// Registration stores a type slug; the site's sections are keyed a little
// differently for hotels, which live under Live & Stay.
const SECTION_FOR_TYPE = {
  "eat-drink": "eat-drink",
  shop: "shop",
  "see-do": "see-do",
  services: "services",
  freelancer: "services",
  hotel: "stay",
};

// The first category the business chose is its primary one; all of them are
// kept so the listing appears under each filter it was registered for.
function categoriesFor(type, detail = {}) {
  const pick = (...lists) => lists.flatMap((l) => (Array.isArray(l) ? l : [])).filter(Boolean);
  switch (type) {
    case "eat-drink": return pick(detail.venueTypes, detail.cuisineTypes);
    case "shop": return pick(detail.shopCategories);
    case "see-do": return pick(detail.seeDoCategories);
    case "services":
    case "freelancer": return pick(detail.freelancerCategories);
    default: return [];
  }
}

// "biz_cocoba-ab12c" → "cocoba-ab12c" for a readable URL; reversed on lookup.
export const liveSlug = (businessId) => String(businessId).replace(/^biz_/, "");
export const businessIdFromSlug = (slug) => (String(slug).startsWith("biz_") ? slug : `biz_${slug}`);
export const isLiveSlug = (slug) => typeof slug === "string" && /-[a-z0-9]{5}$/.test(slug);

// The dashboard's hours editor stores {day, from, to, open}; the pages render
// {day, time}.
function mapHours(hours) {
  if (!Array.isArray(hours) || hours.length === 0) return null;
  return hours.map((h) => ({
    day: h.day,
    time: h.open === false ? "Closed" : [h.from, h.to].filter(Boolean).join(" – ") || "—",
  }));
}

const listOrUndefined = (v) => (Array.isArray(v) && v.length > 0 ? v : undefined);

function mapArticle(a, business) {
  const slug = `live-${a.id}`;
  return {
    id: slug,
    slug,
    category: a.type ?? "News",
    date: a.start_date ? new Date(a.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "",
    title: a.title,
    excerpt: String(a.body ?? "").split(/\n\s*\n/)[0]?.slice(0, 180) ?? "",
    image: a.hero_image || a.thumbnail || business.image,
    body: String(a.body ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
    business,
  };
}

function toItem(row, articles) {
  const type = row.business_type;
  const section = SECTION_FOR_TYPE[type];
  const categories = categoriesFor(type, row.business_type_detail);
  const category = categories[0] ?? null;
  const premium = row.plan === "premium";
  // A free listing may not have uploaded a hero yet; cards and the page
  // header still need an image, so fall back to the site mark.
  const hero = row.hero_image || row.logo || "/logo-mark.svg";
  const gallery = premium ? [hero, ...(row.gallery ?? [])].filter(Boolean) : [hero].filter(Boolean);
  const address = [row.address, row.postal_code].filter(Boolean).join(", ");

  const item = {
    slug: liveSlug(row.business_id),
    businessId: row.business_id,
    live: true,
    plan: premium ? "premium" : "free",
    name: row.name,
    section,
    category,
    categories,
    tag: category ? categoryLabel(category) : "",
    image: hero,
    logo: row.logo,
    gallery,
    tagline: row.tagline,
    description: row.description,
    hours: mapHours(row.hours),
    address,
    phone: row.phone,
    email: row.email,
    website: row.website,
    bookingUrl: row.booking_url,
    social: row.social,
    lat: row.lat,
    lng: row.lng,
    mapQuery: premium && (row.lat != null && row.lng != null) ? `${row.lat},${row.lng}` : (premium ? address : null),
    // Layout props default to [] only when undefined, never when null, so an
    // empty column must arrive as undefined or the page throws on .slice().
    faq: listOrUndefined(row.faqs),
    servicesOffered: listOrUndefined(row.services_list),
    areasCovered: listOrUndefined(row.areas_covered_list),
    whyChooseUs: listOrUndefined(row.why_choose_us),
    stats: listOrUndefined(row.stats),
    skills: listOrUndefined(row.skills),
    portfolio: listOrUndefined(row.portfolio),
    amenities: listOrUndefined(row.amenities),
    stars: row.star_rating,
    // Hotels vs accommodation, for the Live & Stay section.
    stayKind: row.business_type_detail?.hotelKind === "accommodation" ? "accommodation" : "hotels",
  };
  item.news = (articles[row.business_id] ?? []).map((a) => mapArticle(a, item));
  return item;
}

// One fetch per page load, shared by every caller.
// Right after a migration adds a view, some of Supabase's API servers can
// briefly answer "Could not find the table … in the schema cache" (PGRST205)
// while others already know it. That's transient, so retry a couple of times
// before treating it as a real failure.
async function withSchemaRetry(run, attempts = 3) {
  let res = await run();
  for (let i = 1; i < attempts && res.error?.code === "PGRST205"; i++) {
    await new Promise((r) => setTimeout(r, 400 * i));
    res = await run();
  }
  return res;
}

let cache = null;

export function loadLiveBusinesses() {
  if (cache) return cache;
  cache = (async () => {
    const [profilesRes, articlesRes] = await Promise.all([
      withSchemaRetry(() => supabase.from("public_business_profiles").select("*").order("updated_at", { ascending: false })),
      withSchemaRetry(() => supabase.from("public_business_articles").select("*").order("date", { ascending: false })),
    ]);
    // A missing view (migration not run yet) or a network failure must not
    // take the whole directory down — the site falls back to its demo data.
    if (profilesRes.error) {
      console.warn("Live businesses unavailable:", profilesRes.error.message);
      // Don't remember a failure: the next page asks again instead of hiding
      // every registered business until a full reload.
      cache = null;
      return [];
    }
    const articles = {};
    for (const a of articlesRes.data ?? []) (articles[a.business_id] ??= []).push(a);
    // A listing without a business type can't be placed in any section —
    // defaulting it somewhere would file a restaurant under Shop — so it
    // stays off the public site until its type is set.
    return (profilesRes.data ?? [])
      .filter((row) => SECTION_FOR_TYPE[row.business_type])
      .map((row) => toItem(row, articles));
  })();
  // A thrown error (e.g. offline) likewise retries on the next page.
  const pending = cache;
  pending.catch(() => { if (cache === pending) cache = null; });
  return pending;
}

export async function getLiveBusinessBySlug(slug) {
  const items = await loadLiveBusinesses();
  return items.find((i) => i.slug === slug) ?? null;
}


// The traders map keys pins by its own section names.
const MAP_SECTION = { "eat-drink": "food-drink", shop: "shopping", services: "services", "see-do": "see-do", stay: "stay" };

// The website path for a listing; the app converts these to its own routes.
export function webPathFor(item) {
  return item.section === "stay"
    ? `/live/stay/${item.stayKind}/${item.slug}`
    : `/${item.section}/place/${item.slug}`;
}

// Pins for the website's traders map and the app's Map tab: the demo traders
// plus every registered business with coordinates. Only Premium listings
// expose coordinates (a Free listing hides its map), so only they get a pin.
// A registered business replaces a demo pin of the same name.
export async function getMapBrands() {
  const live = await loadLiveBusinesses();
  const pins = live
    .filter((i) => i.lat != null && i.lng != null && !Number.isNaN(Number(i.lat)) && !Number.isNaN(Number(i.lng)))
    .map((i) => ({
      id: `live-${i.slug}`,
      name: i.name,
      category: i.tag || "",
      section: MAP_SECTION[i.section] ?? i.section,
      logo: i.logo || i.image,
      to: webPathFor(i),
      address: i.address,
      tagline: i.tagline,
      lat: Number(i.lat),
      lng: Number(i.lng),
    }));
  const names = new Set(pins.map((p) => p.name.trim().toLowerCase()));
  return [...pins, ...brandGrid.brands.filter((b) => !names.has(String(b.name).trim().toLowerCase()))];
}
