// Structured data (schema.org JSON-LD) for every public page.
//
// This is the part of a page only search engines read. It tells Google
// exactly what the page is: a restaurant with its opening hours and map
// position, an event with its dates and price, an article with its date and
// publisher, and where the page sits in the site (breadcrumbs). That makes
// pages eligible for Google's richer results.
//
// Reviews are deliberately left out: businesses add their own reviews here,
// and Google treats a business's own reviews of itself as "self-serving" and
// can penalise the whole site for marking them up.

import { expandRecurrence } from "../../src/lib/eventRecurrence.js";
import { CUISINE_TYPES } from "../../src/Data/taxonomy.js";

const CUISINE_LABEL = Object.fromEntries(CUISINE_TYPES.map((o) => [o.value, o.label]));
const squash = (s) => String(s ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const cut = (s, max) => { const t = squash(s); return t.length > max ? `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…` : t; };
const compact = (o) => {
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (v == null || v === "" || (Array.isArray(v) && !v.length)) delete o[k];
  }
  return o;
};
const httpUrl = (u) => {
  const s = String(u ?? "").trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return /^[\w-]+(\.[\w-]+)+(\/|$)/.test(s) ? `https://${s}` : null;
};
const num = (v) => (v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));

// ── Times ──────────────────────────────────────────────────────────────────

// "2.30pm - 4.00pm", "18.00-20.00", "From 1pm", "7pm" → ["14:30", "16:00"].
export function parseTimes(text) {
  const found = [...String(text ?? "").matchAll(/(\d{1,2})(?:[.:](\d{2}))?\s*(am|pm)?/gi)]
    .map((m) => ({ h: Number(m[1]), m: Number(m[2] ?? 0), mer: m[3]?.toLowerCase(), bare: !m[2] && !m[3] }))
    // A lone number with no minutes or am/pm ("Room 2") isn't a time.
    .filter((t) => !t.bare && t.h <= 24 && t.m < 60)
    .slice(0, 2);
  // "2.30 - 4pm": the first time takes the second's am/pm when that keeps it earlier.
  if (found.length === 2 && !found[0].mer && found[1].mer === "pm" && found[0].h < 12 && found[0].h <= found[1].h) found[0].mer = "pm";
  return found.map(({ h, m, mer }) => {
    let hour = h;
    if (mer === "pm" && hour < 12) hour += 12;
    if (mer === "am" && hour === 12) hour = 0;
    if (hour > 23) return null;
    return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }).filter(Boolean);
}

// The UK offset on a given day ("+01:00" in summer, "+00:00" in winter).
function londonOffset(date) {
  try {
    const name = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", timeZoneName: "longOffset" })
      .formatToParts(new Date(`${date}T12:00:00Z`)).find((p) => p.type === "timeZoneName")?.value ?? "";
    const m = name.match(/([+-]\d{2}:\d{2})/);
    return m ? m[1] : "+00:00";
  } catch {
    return "+00:00";
  }
}
const at = (date, time) => (time ? `${date}T${time}:00${londonOffset(date)}` : date);

// ── Shared pieces ──────────────────────────────────────────────────────────

export function organization(siteUrl) {
  return {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "Maidenhead.com",
    url: `${siteUrl}/`,
    logo: { "@type": "ImageObject", url: `${siteUrl}/logo-dark-bg.jpg`, width: 1024, height: 1024 },
  };
}

export function website(siteUrl) {
  return {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "Maidenhead.com",
    alternateName: "Maidenhead",
    url: `${siteUrl}/`,
    inLanguage: "en-GB",
    publisher: { "@id": `${siteUrl}/#organization` },
  };
}

export function breadcrumbs(siteUrl, crumbs) {
  if (!crumbs?.length) return null;
  const list = [{ name: "Home", path: "/" }, ...crumbs];
  return {
    "@type": "BreadcrumbList",
    itemListElement: list.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: squash(c.name),
      // The last crumb is the page itself; Google takes its address from the page.
      ...(i < list.length - 1 ? { item: `${siteUrl}${c.path === "/" ? "/" : c.path}` } : {}),
    })),
  };
}

function postalAddress(street, postcode) {
  const pc = postcode || String(street ?? "").match(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i)?.[0];
  if (!street && !pc) return null;
  return compact({
    "@type": "PostalAddress",
    // The town and postcode have their own fields.
    streetAddress: squash(String(street ?? "").replace(pc ?? "\u0000", ""))
      .replace(/(,\s*(Maidenhead|Berkshire|UK|United Kingdom))+\s*,?\s*$/i, "").replace(/[\s,]+$/, "") || null,
    addressLocality: "Maidenhead",
    postalCode: pc ? pc.toUpperCase() : null,
    addressRegion: "Berkshire",
    addressCountry: "GB",
  });
}
const geo = (lat, lng) => (num(lat) != null && num(lng) != null ? { "@type": "GeoCoordinates", latitude: num(lat), longitude: num(lng) } : null);

const imageList = (...sources) => [...new Set(sources.flat().map((s) => (typeof s === "string" ? s : s?.url ?? s?.src))
  .map((s) => String(s ?? "").split("#")[0]).filter((s) => /^https?:\/\//i.test(s)))].slice(0, 6);

// ── Businesses ─────────────────────────────────────────────────────────────

const DAY = { Monday: "Monday", Tuesday: "Tuesday", Wednesday: "Wednesday", Thursday: "Thursday", Friday: "Friday", Saturday: "Saturday", Sunday: "Sunday" };
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

// The week's hours, grouping days with the same times. "00:00–00:00" is how
// the site stores "open all day".
function openingHours(hours) {
  if (!Array.isArray(hours)) return [];
  const groups = new Map();
  for (const h of hours) {
    if (!h?.open || !DAY[h.day] || !HHMM.test(h.from ?? "") || !HHMM.test(h.to ?? "")) continue;
    const closes = h.to === "00:00" ? "23:59" : h.to;
    const key = `${h.from}-${closes}`;
    if (!groups.has(key)) groups.set(key, { opens: h.from, closes, days: [] });
    groups.get(key).days.push(DAY[h.day]);
  }
  return [...groups.values()].map((g) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: g.days, opens: g.opens, closes: g.closes }));
}

const EAT_TYPE = { restaurants: "Restaurant", "private-dining": "Restaurant", bars: "BarOrPub", cafes: "CafeOrCoffeeShop", bakery: "Bakery", takeaway: "FastFoodRestaurant", "grab-go": "FastFoodRestaurant" };
const SEE_DO_TYPE = { "sport-wellness": "SportsActivityLocation", film: "MovieTheater", gaming: "EntertainmentBusiness", "music-dance": "EntertainmentBusiness", theatre: "EntertainmentBusiness", "art-culture": "EntertainmentBusiness", family: "EntertainmentBusiness" };
const TRADE_TYPE = { plumbers: "Plumber", electricians: "Electrician", roofers: "RoofingContractor", locksmiths: "Locksmith", "decorators-painters": "HousePainter", "heating-boiler": "HVACBusiness", builders: "GeneralContractor", "carpenters-joiners": "GeneralContractor", "landscapers-gardeners": "HomeAndConstructionBusiness", cleaners: "HousekeepingService" };

function businessType(row) {
  const d = row.business_type_detail ?? {};
  const first = (k) => (Array.isArray(d[k]) ? d[k] : []).map(String);
  switch (row.business_type) {
    case "eat-drink": return first("venueTypes").map((v) => EAT_TYPE[v]).find(Boolean) ?? "FoodEstablishment";
    case "shop": return "Store";
    case "see-do": return first("seeDoCategories").map((v) => SEE_DO_TYPE[v]).find(Boolean) ?? "LocalBusiness";
    case "hotel": return "Hotel";
    case "accommodation":
      return row.kind === "accommodation_property" || d.hotelKind === "accommodation" ? "LodgingBusiness" : "LocalBusiness";
    case "services":
    case "freelancer": {
      const all = [...first("freelancerCategories"), ...first("tradespersonCategories"), ...first("serviceCategories")];
      return all.map((v) => TRADE_TYPE[v]).find(Boolean) ?? "ProfessionalService";
    }
    default: return "LocalBusiness";
  }
}

// row: a public_business_profiles row. url: the page's canonical address.
// parent: the managing company ({ name, url }) for a holiday-let property.
export function businessSchema(row, { url, parent } = {}) {
  const type = businessType(row);
  const d = row.business_type_detail ?? {};
  const social = row.social && typeof row.social === "object" ? Object.values(row.social) : [];
  const sameAs = [...new Set([row.website, ...social].map(httpUrl).filter(Boolean))];
  const lodging = type === "Hotel" || type === "LodgingBusiness";
  const checkin = parseTimes(row.check_in_time)[0];
  const checkout = parseTimes(row.check_out_time)[0];
  const node = compact({
    "@type": type,
    "@id": `${url}#business`,
    name: squash(row.name),
    description: cut(row.description || row.tagline, 500) || null,
    url,
    image: imageList(row.hero_image, Array.isArray(row.gallery) ? row.gallery : []),
    logo: httpUrl(row.logo),
    telephone: squash(row.phone) || null,
    email: squash(row.email) || null,
    address: postalAddress(row.address, row.postal_code),
    geo: geo(row.lat, row.lng),
    openingHoursSpecification: lodging ? [] : openingHours(row.hours),
    sameAs,
    acceptsReservations: httpUrl(row.booking_url) || null,
    servesCuisine: /Restaurant|Food|Cafe|Bar|Bakery/.test(type)
      ? (Array.isArray(d.cuisineTypes) ? d.cuisineTypes : []).map((c) => CUISINE_LABEL[c]).filter(Boolean)
      : [],
    amenityFeature: lodging && Array.isArray(row.amenities)
      ? row.amenities.filter((a) => typeof a === "string" && a.trim()).slice(0, 30)
        .map((a) => ({ "@type": "LocationFeatureSpecification", name: a.trim(), value: true }))
      : [],
    numberOfRooms: lodging && Array.isArray(row.rooms) && row.rooms.length ? row.rooms.length : null,
    checkinTime: lodging && checkin ? `${checkin}:00` : null,
    checkoutTime: lodging && checkout ? `${checkout}:00` : null,
    starRating: type === "Hotel" && row.star_rating ? { "@type": "Rating", ratingValue: row.star_rating } : null,
    areaServed: /Professional|Contractor|Plumber|Electrician|Locksmith|Painter|HVAC|Housekeeping|HomeAndConstruction/.test(type)
      ? "Maidenhead" : null,
    parentOrganization: parent?.name ? compact({ "@type": "Organization", name: squash(parent.name), url: parent.url }) : null,
  });
  return node;
}

export function faqSchema(faqs, url) {
  const items = (Array.isArray(faqs) ? faqs : [])
    .map((f) => ({ q: squash(f?.question), a: squash(f?.answer) }))
    .filter((f) => f.q && f.a);
  if (!items.length) return null;
  return {
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

// ── Events ─────────────────────────────────────────────────────────────────

const todayInLondon = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });
const addMonths = (date, n) => { const d = new Date(`${date}T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); };

// The dates an event happens on: each upcoming date of a repeating event
// (Google wants one Event per date), or its single date.
export function eventDates(e, { max = 8, months = 6 } = {}) {
  if (e.is_recurring && e.recurrence_type) {
    const from = todayInLondon();
    const dates = expandRecurrence({
      type: e.recurrence_type,
      days: e.recurrence_days ?? [],
      ordinals: e.recurrence_ordinals ?? [],
      startDate: e.recurrence_start_date || e.event_date || from,
      endDate: e.recurrence_end_date || null,
    }, { from, to: addMonths(from, months) });
    if (dates.length) return dates.slice(0, max);
  }
  return e.event_date ? [String(e.event_date).slice(0, 10)] : [];
}

function eventOffer(e, url) {
  const link = httpUrl(e.booking_url) || httpUrl(e.website) || url;
  if (/free/i.test(e.entry_type ?? "")) {
    return { "@type": "Offer", price: 0, priceCurrency: "GBP", availability: "https://schema.org/InStock", url: link };
  }
  const price = String(e.tickets ?? "").match(/£\s*(\d+(?:\.\d{1,2})?)/)?.[1];
  if (price) return { "@type": "Offer", price: Number(price), priceCurrency: "GBP", availability: "https://schema.org/InStock", url: link };
  return httpUrl(e.booking_url) ? { "@type": "Offer", url: link, availability: "https://schema.org/InStock" } : null;
}

// e: a business_events row. host: the organising business row, if any, with
// its page address (hostUrl).
export function eventSchemas(e, { url, host, hostUrl, image, siteUrl }) {
  const [start, end] = parseTimes(e.event_time);
  const place = compact({
    "@type": "Place",
    name: squash(e.location) || squash(host?.name) || "Maidenhead",
    address: postalAddress(e.location || host?.address, e.location ? null : host?.postal_code)
      ?? postalAddress(host?.address, host?.postal_code)
      ?? { "@type": "PostalAddress", addressLocality: "Maidenhead", addressRegion: "Berkshire", addressCountry: "GB" },
    geo: geo(e.lat, e.lng) ?? geo(host?.lat, host?.lng),
  });
  const organizer = host?.name ? compact({ "@type": "Organization", name: squash(host.name), url: hostUrl }) : { "@id": `${siteUrl}/#organization` };
  const offers = eventOffer(e, url);
  const images = imageList(image, e.hero_image, Array.isArray(e.gallery) ? e.gallery : []);
  return eventDates(e).map((date, i) => compact({
    "@type": "Event",
    "@id": `${url}#event-${i + 1}`,
    name: squash(e.title),
    description: cut(e.subtitle || e.excerpt || e.description, 500) || null,
    url,
    image: images,
    startDate: at(date, start),
    endDate: end ? at(date, end) : null,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: place,
    organizer,
    offers,
  }));
}

// ── Articles ───────────────────────────────────────────────────────────────

const iso = (v) => {
  if (!v) return null;
  const s = String(v);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T09:00:00${londonOffset(s)}` : s;
};

export function articleSchema({ type = "Article", url, headline, description, images, published, modified, author, siteUrl }) {
  return compact({
    "@type": type,
    "@id": `${url}#article`,
    mainEntityOfPage: url,
    headline: cut(headline, 110),
    description: cut(description, 300) || null,
    image: imageList(images ?? []),
    datePublished: iso(published),
    dateModified: iso(modified || published),
    author: author?.name
      ? compact({ "@type": "Organization", name: squash(author.name), url: author.url })
      : { "@id": `${siteUrl}/#organization` },
    publisher: { "@id": `${siteUrl}/#organization` },
    inLanguage: "en-GB",
  });
}

// ── Writing it into the page ───────────────────────────────────────────────

// One <script> with every node; "<" escaped so text can't close the tag.
export function jsonLd(nodes) {
  const graph = nodes.filter(Boolean);
  if (!graph.length) return "";
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph })
    .replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  return `<script type="application/ld+json">${json}</script>`;
}
