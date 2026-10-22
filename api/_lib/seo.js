// Search engine and share-preview details for every public page.
//
// The site is a single-page app: every address used to be served the same
// index.html, so Google, Bing, WhatsApp, Facebook and LinkedIn saw one title,
// one description and one picture for ~1,700 business pages. This works out,
// per address, the page's own title, description, picture, preferred address
// (canonical), whether search engines may index it, its HTTP status (a real
// 404 for a page that doesn't exist, 301 for an old address) and a little
// readable text — from the same public database views the site reads.
//
// Used by api/page.js (every page), api/sitemap.js and api/robots.js.

import {
  SEE_DO_CATEGORIES, SHOP_CATEGORIES, VENUE_TYPES, CUISINE_TYPES,
  FREELANCER_CATEGORIES, TRADESPERSON_CATEGORIES, PROFESSIONAL_CATEGORIES,
} from "../../src/Data/taxonomy.js";
import {
  organization, website, breadcrumbs, businessSchema, faqSchema, eventSchemas, articleSchema, jsonLd,
} from "./schema.js";

const env = (k) => globalThis.process?.env?.[k];

// The address search engines should know the site by. Indexing is only ever
// allowed on these hosts: every Vercel test address stays out of Google, so
// it can't compete with the real site.
export const SITE_URL = (env("SEO_SITE_URL") || "https://maidenhead.com").replace(/\/$/, "");
const INDEXABLE_HOSTS = (env("SEO_INDEXABLE_HOSTS") || "maidenhead.com,www.maidenhead.com")
  .split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
export const isIndexableHost = (host) => INDEXABLE_HOSTS.includes(String(host ?? "").toLowerCase().split(":")[0]);

const SITE_NAME = "Maidenhead.com";
const DEFAULT_IMAGE = "/og-image.jpg";
const DEFAULT_DESCRIPTION = "Discover Maidenhead — places to eat and drink, shops, things to do, events, places to stay and local services in the riverside town on the Thames.";

// ── Database (the public views the site reads, with the public key) ────────

const SB_URL = env("VITE_SUPABASE_URL") || env("SUPABASE_URL");
const SB_KEY = env("VITE_SUPABASE_ANON_KEY") || env("SUPABASE_ANON_KEY");
export const hasDatabase = () => !!(SB_URL && SB_KEY);

export async function sb(pathAndQuery, { timeoutMs = 3000 } = {}) {
  if (!hasDatabase()) throw new Error("No database settings");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${SB_URL}/rest/v1/${pathAndQuery}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`${pathAndQuery}: ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}
const one = async (q) => (await sb(q))?.[0] ?? null;
const enc = encodeURIComponent;

// ── Text helpers ───────────────────────────────────────────────────────────

export const escapeHtml = (s) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const squash = (s) => String(s ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

// Cut at a word near `max` characters (Google shows ~155 of a description).
export function clip(s, max = 155) {
  const t = squash(s);
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).replace(/[\s,.;:–—-]+$/, "")}…`;
}

// "Name | Label in Maidenhead | Maidenhead.com", dropping parts that would
// push it past what Google shows (~60 characters).
function titleOf(...parts) {
  const clean = parts.map(squash).filter(Boolean);
  const full = [...clean, SITE_NAME].join(" | ");
  if (full.length <= 65) return full;
  if (clean.length > 1) {
    const two = [clean[0], SITE_NAME].join(" | ");
    if (two.length <= 65) return two;
  }
  return clean[0] ?? SITE_NAME;
}

// A stored picture as an absolute link without the site's focal-point
// marker ("…jpg#f=50,50").
function absImage(src, origin) {
  const s = String(src ?? "").split("#")[0].trim();
  if (!s) return `${origin}${DEFAULT_IMAGE}`;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("data:")) return `${origin}${DEFAULT_IMAGE}`;
  return `${origin}${s.startsWith("/") ? "" : "/"}${s}`;
}

// ── Businesses ─────────────────────────────────────────────────────────────

const SECTION_FOR_TYPE = {
  "eat-drink": "eat-drink", shop: "shop", "see-do": "see-do",
  services: "services", freelancer: "services", hotel: "stay", accommodation: "stay",
};
const LABEL_FOR = Object.fromEntries([
  ...SEE_DO_CATEGORIES, ...SHOP_CATEGORIES, ...VENUE_TYPES, ...CUISINE_TYPES,
  ...FREELANCER_CATEGORIES, ...TRADESPERSON_CATEGORIES, ...PROFESSIONAL_CATEGORIES,
].map((o) => [o.value, o.label]));
const SECTION_NOUN = {
  "eat-drink": "Eat & Drink", shop: "Shop", "see-do": "Things to do", services: "Local services",
};
// The site's own names for its sections, for breadcrumbs.
const SECTION_CRUMB = {
  "eat-drink": { name: "Eat & Drink", path: "/eat-drink" },
  shop: { name: "Shop", path: "/shop" },
  "see-do": { name: "See & Do", path: "/see-do" },
  services: { name: "Services", path: "/services" },
};
function businessCrumbs(row) {
  const section = SECTION_FOR_TYPE[row.business_type];
  if (section === "stay") {
    return stayKind(row) === "accommodation"
      ? [{ name: "Live & Stay", path: "/live" }, { name: "Holiday lets", path: "/live/stay/accommodation" }]
      : [{ name: "Live & Stay", path: "/live" }, { name: "Hotels", path: "/live/stay/hotels" }];
  }
  return SECTION_CRUMB[section] ? [SECTION_CRUMB[section]] : [];
}

const liveSlug = (id) => String(id).replace(/^biz_/, "");
const businessId = (slug) => (String(slug).startsWith("biz_") ? slug : `biz_${slug}`);

function stayKind(row) {
  return row.business_type === "accommodation" || row.business_type_detail?.hotelKind === "accommodation"
    ? "accommodation" : "hotels";
}

// The page a business lives at — the same rule as the site (a See & Do
// business opens on its /event page).
export function businessPath(row) {
  const section = SECTION_FOR_TYPE[row.business_type];
  if (!section) return null;
  const slug = liveSlug(row.business_id);
  if (section === "stay") return `/live/stay/${stayKind(row)}/${slug}`;
  if (section === "see-do") return `/event/${slug}`;
  return `/${section}/place/${slug}`;
}

function businessLabel(row) {
  const d = row.business_type_detail ?? {};
  const first = [d.venueTypes, d.cuisineTypes, d.shopCategories, d.seeDoCategories, d.freelancerCategories]
    .flatMap((l) => (Array.isArray(l) ? l : []))[0];
  if (first && LABEL_FOR[first]) return LABEL_FOR[first];
  const section = SECTION_FOR_TYPE[row.business_type];
  if (section === "stay") return stayKind(row) === "accommodation" ? "Holiday let" : "Hotel";
  return SECTION_NOUN[section] ?? null;
}

const BUSINESS_COLUMNS = [
  "business_id,name,business_type,business_type_detail,kind,parent_id,plan,tagline,description,hero_image,gallery,logo",
  "address,postal_code,lat,lng,phone,email,website,booking_url,social,hours,faqs",
  "amenities,rooms,star_rating,check_in_time,check_out_time,updated_at",
].join(",");
const HOST_COLUMNS = "business_id,name,business_type,business_type_detail,kind,address,postal_code,lat,lng";

// A business's page address for linking: its page on the site, or for an
// accommodation company (which has no page of its own) its own website.
const businessUrl = (row) => {
  if (!row) return null;
  if (row.company) {
    const w = String(row.website ?? "").trim();
    return w ? (/^https?:\/\//i.test(w) ? w.replace(/^https?/i, (x) => x.toLowerCase()) : `https://${w}`) : null;
  }
  const p = businessPath(row);
  return p ? `${SITE_URL}${p}` : null;
};
// The business behind an event or article, or the company managing a
// property. Never fails the page: without it the details are just shorter.
async function hostBusiness(id) {
  if (!id) return null;
  try {
    return await one(`public_business_profiles?business_id=eq.${enc(id)}&select=${HOST_COLUMNS}&limit=1`)
      ?? (await one(`public_accommodation_companies?business_id=eq.${enc(id)}&select=business_id,name,address,postal_code,website&limit=1`)
        .then((c) => (c ? { ...c, company: true } : null)));
  } catch {
    return null;
  }
}

async function businessMeta(slug, origin) {
  const row = await one(`public_business_profiles?business_id=eq.${enc(businessId(slug))}&select=${BUSINESS_COLUMNS}&limit=1`);
  if (!row) return null;
  const path = businessPath(row);
  if (!path) return null;
  const label = businessLabel(row);
  const where = [row.address, row.postal_code].filter(Boolean).join(", ");
  const about = row.tagline || row.description;
  const url = `${SITE_URL}${path}`;
  const parent = row.parent_id ? await hostBusiness(row.parent_id) : null;
  return {
    path,
    title: titleOf(row.name, label ? `${label} in Maidenhead` : "Maidenhead"),
    description: clip(about
      ? `${squash(about)}${where ? ` — ${where}` : ""}`
      : `${row.name}${label ? `, ${label.toLowerCase()}` : ""} in Maidenhead${where ? ` at ${where}` : ""}. Opening times, contact details, directions and more on Maidenhead.com.`),
    image: absImage(row.hero_image, origin),
    type: "business.business",
    body: { h1: row.name, lead: row.tagline, text: row.description, extra: where },
    crumbs: [...businessCrumbs(row), { name: row.name }],
    schema: [
      businessSchema(row, { url, parent: parent ? { name: parent.name, url: businessUrl(parent) } : null }),
      faqSchema(row.faqs, url),
    ],
  };
}

// ── Events, posts, stories, guides ─────────────────────────────────────────

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const longDate = (d) => (d ? new Date(`${String(d).slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" }) : "");

async function eventMeta(slug, origin) {
  const by = UUID.test(slug) ? `or=(slug.eq.${enc(slug)},id.eq.${enc(slug)})` : `slug=eq.${enc(slug)}`;
  const e = await one(`business_events?${by}&status=eq.Live&select=id,slug,business_id,title,subtitle,excerpt,description,hero_image,gallery,event_date,date_label,event_time,location,lat,lng,entry_type,tickets,booking_url,website,is_recurring,recurrence_type,recurrence_days,recurrence_ordinals,recurrence_start_date,recurrence_end_date&limit=1`);
  if (!e) return null;
  const when = e.date_label || longDate(e.event_date);
  const path = `/event/${e.slug || e.id}`;
  const host = await hostBusiness(e.business_id);
  return {
    path,
    title: titleOf(e.title, when ? `${when}` : "Event in Maidenhead"),
    description: clip([e.subtitle || e.excerpt || e.description, when, e.event_time, e.location].filter(Boolean).join(" · ")),
    image: absImage(e.hero_image, origin),
    type: "website",
    body: { h1: e.title, lead: [when, e.event_time, e.location].filter(Boolean).join(" · "), text: e.description || e.excerpt },
    crumbs: [{ name: "What's On", path: "/whats-on" }, { name: e.title }],
    schema: eventSchemas(e, { url: `${SITE_URL}${path}`, host, hostUrl: businessUrl(host), image: absImage(e.hero_image, origin), siteUrl: SITE_URL }),
  };
}

async function newsMeta(slug, origin) {
  if (slug.startsWith("live-") && UUID.test(slug.slice(5))) {
    const a = await one(`public_business_articles?id=eq.${enc(slug.slice(5))}&select=id,business_id,title,body,hero_image,thumbnail,type,date,start_date&limit=1`);
    if (a) {
      const host = await hostBusiness(a.business_id);
      const image = absImage(a.hero_image || a.thumbnail, origin);
      return {
        path: `/news/${slug}`,
        title: titleOf(a.title, a.type === "Offer" ? "Offer in Maidenhead" : "News"),
        description: clip(a.body),
        image: absImage(a.hero_image || a.thumbnail, origin),
        type: "article",
        body: { h1: a.title, text: a.body },
        crumbs: [{ name: "Offers & News", path: "/offers" }, { name: a.title }],
        schema: [articleSchema({
          type: "NewsArticle", url: `${SITE_URL}/news/${slug}`, headline: a.title, description: a.body, images: [image],
          published: a.date || a.start_date, author: host ? { name: host.name, url: businessUrl(host) } : null, siteUrl: SITE_URL,
        })],
      };
    }
  }
  const n = await one(`news_offers?slug=eq.${enc(slug)}&status=eq.Published&select=slug,title,excerpt,body,image,type,business_id,business_name,start_date,created_at,updated_at&limit=1`)
    ?? await one(`public_promoted_posts?slug=eq.${enc(slug)}&select=*&limit=1`);
  if (!n) return null;
  const host = n.business_id ? await hostBusiness(n.business_id) : null;
  return {
    path: `/news/${n.slug}`,
    title: titleOf(n.title, n.type === "offer" ? "Offer in Maidenhead" : "News"),
    description: clip(n.excerpt || n.body),
    image: absImage(n.image, origin),
    type: "article",
    body: { h1: n.title, lead: n.excerpt, text: n.body },
    crumbs: [{ name: "Offers & News", path: "/offers" }, { name: n.title }],
    schema: [articleSchema({
      type: "NewsArticle", url: `${SITE_URL}/news/${n.slug}`, headline: n.title, description: n.excerpt || n.body,
      images: [absImage(n.image, origin)], published: n.created_at || n.start_date, modified: n.updated_at,
      author: host ? { name: host.name, url: businessUrl(host) } : n.business_name ? { name: n.business_name } : null, siteUrl: SITE_URL,
    })],
  };
}

async function storyMeta(slug, origin) {
  const f = await one(`feature_articles?slug=eq.${enc(slug)}&status=eq.Live&select=slug,title,card_heading,standfirst,card_body,body,hero_image,card_image,business_id,author,created_at,updated_at&limit=1`);
  if (!f) return null;
  const host = f.business_id ? await hostBusiness(f.business_id) : null;
  return {
    path: `/story/${f.slug}`,
    title: titleOf(f.title || f.card_heading, "Featured"),
    description: clip(f.standfirst || f.card_body || f.body),
    image: absImage(f.hero_image || f.card_image, origin),
    type: "article",
    body: { h1: f.title || f.card_heading, lead: f.standfirst, text: f.body },
    crumbs: [{ name: f.title || f.card_heading }],
    schema: [articleSchema({
      url: `${SITE_URL}/story/${f.slug}`, headline: f.title || f.card_heading, description: f.standfirst || f.card_body,
      images: [absImage(f.hero_image || f.card_image, origin)], published: f.created_at, modified: f.updated_at,
      author: host ? { name: host.name, url: businessUrl(host) } : null, siteUrl: SITE_URL,
    })],
  };
}

async function guideMeta(slug, origin) {
  const g = await one(`neighbourhood_guides?slug=eq.${enc(slug)}&status=eq.Published&select=slug,title,area,body,hero_image,thumbnail,created_at,updated_at&limit=1`);
  if (!g) return null;
  return {
    path: `/guides/${g.slug}`,
    title: titleOf(g.title, "Neighbourhood guide"),
    description: clip(g.body || `A guide to ${g.area || g.title}: where to eat, shop, explore and stay.`),
    image: absImage(g.hero_image || g.thumbnail, origin),
    type: "article",
    body: { h1: g.title, text: g.body },
    crumbs: [{ name: "Guides", path: "/guides" }, { name: g.title }],
    schema: [articleSchema({
      url: `${SITE_URL}/guides/${g.slug}`, headline: g.title, description: g.body,
      images: [absImage(g.hero_image || g.thumbnail, origin)], published: g.created_at, modified: g.updated_at, siteUrl: SITE_URL,
    })],
  };
}

// ── Pages with fixed details ───────────────────────────────────────────────

export const STATIC_PAGES = {
  "/": { title: "Maidenhead.com — Eat, Shop, Explore & Stay in Maidenhead", description: DEFAULT_DESCRIPTION, priority: 1.0 },
  "/eat-drink": { title: titleOf("Restaurants, Cafés & Bars in Maidenhead"), description: "Where to eat and drink in Maidenhead: restaurants, cafés, pubs and bars, with menus, opening times, offers and booking links.", priority: 0.9 },
  "/shop": { title: titleOf("Shops & Local Services in Maidenhead"), description: "Independent shops, high-street favourites and local services in Maidenhead — opening times, offers and contact details.", priority: 0.9 },
  "/see-do": { title: titleOf("Things to Do in Maidenhead"), description: "Things to do in Maidenhead: days out, sport and fitness, arts and culture, family activities and what's on by the Thames.", priority: 0.9 },
  "/services": { title: titleOf("Local Services in Maidenhead"), description: "Find trusted tradespeople, professionals and freelancers in Maidenhead — plumbers, electricians, accountants, designers and more.", priority: 0.9 },
  "/offers": { title: titleOf("Offers & News in Maidenhead"), description: "The latest offers, deals and news from businesses in Maidenhead.", priority: 0.8 },
  "/whats-on": { title: titleOf("What's On in Maidenhead"), description: "Events in Maidenhead: what's on this week and this weekend — markets, music, family events, sport and more.", priority: 0.9 },
  "/live": { title: titleOf("Live & Stay in Maidenhead"), description: "Living in and visiting Maidenhead: hotels, holiday lets and places to stay by the Thames.", priority: 0.8 },
  "/live/stay/hotels": { title: titleOf("Hotels in Maidenhead"), description: "Hotels in and around Maidenhead — rooms, facilities and booking links.", priority: 0.8 },
  "/live/stay/accommodation": { title: titleOf("Holiday Lets & Accommodation in Maidenhead"), description: "Holiday cottages, apartments and short lets in and around Maidenhead — photos, rooms, amenities and booking links.", priority: 0.8 },
  "/work": { title: titleOf("Work in Maidenhead"), description: "Working in Maidenhead: offices, workspaces and business developments in the town.", priority: 0.6 },
  "/explore/the-future": { title: titleOf("The Future of Maidenhead"), description: "Maidenhead's regeneration: the projects shaping the town's future.", priority: 0.6 },
  "/guides": { title: titleOf("Neighbourhood Guides to Maidenhead"), description: "Guides to Maidenhead's neighbourhoods and nearby villages: where to eat, shop, explore and stay.", priority: 0.7 },
  "/getting-here": { title: titleOf("Getting to Maidenhead — Trains, Parking & Travel"), description: "Getting to Maidenhead by Elizabeth line, train, bus, car and bike — with car parks and practical information.", priority: 0.7 },
  "/about": { title: titleOf("About Maidenhead.com"), description: "The story behind Maidenhead.com, the guide to the riverside town on the Thames.", priority: 0.4 },
  "/traders": { title: titleOf("Maidenhead Traders"), description: "Market traders and local makers in Maidenhead.", priority: 0.5 },
  "/get-the-app": { title: titleOf("Get the Maidenhead App"), description: "The Maidenhead app: places, offers, events and what's on in your pocket.", priority: 0.4 },
  "/work-with-us": { title: titleOf("List Your Business on Maidenhead.com"), description: "Put your business in front of people looking for things to do, eat, shop and stay in Maidenhead.", priority: 0.5 },
  "/privacy": { title: titleOf("Privacy Policy"), description: "How Maidenhead.com and the Maidenhead app handle personal information.", priority: 0.2 },
  "/terms": { title: titleOf("Terms of Use"), description: "The terms of use for Maidenhead.com and the Maidenhead app.", priority: 0.2 },
};

// Addresses the app itself redirects (App.jsx), answered with a real 301.
const REDIRECTS = {
  "/news": "/offers",
  "/events": "/whats-on",
  "/press": "/work-with-us",
  "/work/developments": "/work/developments/one-maidenhead",
};

// Addresses that are kept out of search engines (and out of the sitemap).
const PRIVATE = [/^\/admin(\/|$)/, /^\/business(\/|$)/, /^\/mobile(\/|$)/, /^\/search(\/|$)/, /^\/logo-animation$/, /^\/live\/enquire$/];

// Breadcrumbs for a fixed page: any parent pages that exist, then the page.
const CRUMB_NAME = { "/live": "Live & Stay", "/live/stay/hotels": "Hotels", "/live/stay/accommodation": "Holiday lets" };
function staticCrumbs(path, name) {
  if (path === "/") return null;
  const parts = path.split("/").filter(Boolean);
  const parents = parts.slice(0, -1).map((_, i) => `/${parts.slice(0, i + 1).join("/")}`)
    .filter((p) => STATIC_PAGES[p]).map((p) => ({ name: CRUMB_NAME[p] ?? STATIC_PAGES[p].title.split(" | ")[0], path: p }));
  return [...parents, { name: CRUMB_NAME[path] ?? name }];
}

// ── Resolving an address ───────────────────────────────────────────────────

// Returns what the page response should carry:
//   { status, redirect?, title, description, image, canonical, noindex, type, body }
export async function resolvePage(rawPath, origin) {
  const path = (rawPath || "/").replace(/\/+$/, "") || "/";
  const base = { status: 200, title: STATIC_PAGES["/"].title, description: DEFAULT_DESCRIPTION, image: absImage(null, origin), type: "website", noindex: false };
  const withCanonical = (m) => ({ ...base, ...m, canonical: `${SITE_URL}${m.path ?? path}` });
  const notFound = () => ({ ...base, status: 404, noindex: true, title: titleOf("Page not found"), description: DEFAULT_DESCRIPTION, canonical: null });

  if (PRIVATE.some((re) => re.test(path))) return { ...base, noindex: true, canonical: null };
  // Addresses the site sends on elsewhere.
  if (REDIRECTS[path]) return { status: 301, redirect: REDIRECTS[path] };

  const fixed = STATIC_PAGES[path];
  if (fixed) {
    const h1 = fixed.title.split(" | ")[0];
    return withCanonical({ path, title: fixed.title, description: fixed.description, body: { h1, text: fixed.description }, crumbs: staticCrumbs(path, h1) });
  }

  let m;
  // Old and alternative addresses → the business's own page, permanently.
  if ((m = path.match(/^\/b\/([^/]+)$/)) || (m = path.match(/^\/see-do\/place\/([^/]+)$/))) {
    const b = await businessMeta(decodeURIComponent(m[1]), origin);
    return b ? { status: 301, redirect: b.path } : { status: 302, redirect: "/" };
  }
  if ((m = path.match(/^\/(eat-drink|shop|services)\/place\/([^/]+)$/)) || (m = path.match(/^\/live\/stay\/(hotels|accommodation)\/([^/]+)$/))) {
    const b = await businessMeta(decodeURIComponent(m[2]), origin);
    if (!b) return notFound();
    if (b.path !== path) return { status: 301, redirect: b.path };
    return withCanonical(b);
  }
  if ((m = path.match(/^\/event\/([^/]+)$/))) {
    const slug = decodeURIComponent(m[1]);
    const e = (await eventMeta(slug, origin)) ?? (await businessMeta(slug, origin));
    return e ? withCanonical(e) : notFound();
  }
  if ((m = path.match(/^\/news\/([^/]+)$/))) {
    const n = await newsMeta(decodeURIComponent(m[1]), origin);
    return n ? withCanonical(n) : notFound();
  }
  if ((m = path.match(/^\/story\/([^/]+)$/))) {
    const s = await storyMeta(decodeURIComponent(m[1]), origin);
    return s ? withCanonical(s) : notFound();
  }
  if ((m = path.match(/^\/guides\/([^/]+)$/))) {
    const g = await guideMeta(decodeURIComponent(m[1]), origin);
    return g ? withCanonical(g) : notFound();
  }
  // Pages the site builds from its own data files (developments, buildings,
  // attractions, service groups, work categories): the general details.
  if (/^\/(attraction|live\/building|work\/developments|services|work)\/[^/]+$/.test(path)) {
    return withCanonical({ path });
  }
  // A section's category list is the same page filtered.
  if ((m = path.match(/^\/(eat-drink|shop|see-do|services)\/category\/[^/]+$/))) {
    return withCanonical({ path: `/${m[1]}`, ...STATIC_PAGES[`/${m[1]}`] });
  }
  return notFound();
}

// ── Writing it into the page ───────────────────────────────────────────────

function bodyHtml(body) {
  if (!body) return "";
  const p = (t, max = 600) => (squash(t) ? `<p>${escapeHtml(clip(t, max))}</p>` : "");
  return `<main data-seo-snapshot>${body.h1 ? `<h1>${escapeHtml(String(body.h1).trim())}</h1>` : ""}${p(body.lead, 300)}${p(body.text)}${p(body.extra, 200)}</main>`;
}

// Structured data for indexable pages: the site itself on the home page,
// the page's own subject (business, event, article…) and its breadcrumbs.
function structuredData(meta) {
  if (meta.noindex || !meta.canonical || meta.status !== 200) return "";
  const home = meta.canonical === `${SITE_URL}/`;
  return jsonLd([
    home ? website(SITE_URL) : null,
    organization(SITE_URL),
    ...(meta.schema ?? []),
    breadcrumbs(SITE_URL, meta.crumbs),
  ]);
}

// Puts the page's details into the app's HTML: title, description,
// canonical, robots, Open Graph and Twitter tags in the head, and the page's
// main words inside #root (React replaces them as soon as the app starts).
export function renderPage(template, meta, { indexable, origin, url }) {
  const robots = meta.noindex || !indexable ? "noindex, nofollow" : "index, follow, max-image-preview:large";
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    meta.canonical ? `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />` : "",
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:type" content="${escapeHtml(meta.type || "website")}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.canonical || url)}" />`,
    `<meta property="og:image" content="${escapeHtml(meta.image || `${origin}${DEFAULT_IMAGE}`)}" />`,
    `<meta property="og:locale" content="en_GB" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(meta.image || `${origin}${DEFAULT_IMAGE}`)}" />`,
    structuredData(meta),
  ].filter(Boolean).join("\n    ");

  let html = template
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/<meta\s+name="description"[^>]*>\s*/i, "")
    .replace(/<meta\s+property="og:image"[^>]*>\s*/i, "")
    .replace(/<\/head>/i, `    ${tags}\n  </head>`);
  const snapshot = bodyHtml(meta.body);
  if (snapshot) html = html.replace(/<div id="root"><\/div>/i, `<div id="root">${snapshot}</div>`);
  return html;
}
