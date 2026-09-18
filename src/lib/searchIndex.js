// ════════════════════════════════════════════════════════════════════════════
//  Site-wide search index — shared by the website's Search page and the app.
//
//  Flattens every piece of content the app already ships — businesses, places,
//  services, events, offers/news, features, guides and stays — into one list of
//  { id, title, subtitle, group, image, to } records the SearchScreen can match
//  against.
//
//  Events, guides, featured stories and the travel copy are admin-editable and
//  live in Supabase, so the index is built on demand rather than at import
//  time — otherwise a renamed guide kept showing its old title in search. The
//  rest still comes from the Data/*.js the website uses.
// ════════════════════════════════════════════════════════════════════════════

import { sections } from "../Data/pages";
import { eventCategoryLabel } from "./eventCategories";
import { appSectionLabel } from "../mobile/lib/sectionLabels";
import {
  getEvents, getStories, getGuides, getGettingHere,
  getBusinesses, getHotels, getAccommodations, getArticles,
} from "../api";

// Links and section names differ between the website and the app.
const LINKS = {
  app: {
    place: (i) => `/mobile/place/${i.slug}`,
    event: (e) => `/mobile/event/${e.slug}`,
    news: (a) => `/mobile/news/${a.slug}`,
    story: (f) => `/mobile/story/${f.slug}`,
    guide: (g) => `/mobile/guides/${g.slug}`,
    hotel: (h) => `/mobile/stay/hotels/${h.slug}`,
    stay: (a) => `/mobile/stay/accommodation/${a.slug}`,
    parking: "/mobile/parking",
    transport: "/mobile/transport",
    label: (section) => appSectionLabel(section.key, section.label),
  },
  web: {
    // See & Do listings open on the shared event-style page.
    place: (i) => (i.section === "see-do" ? `/event/${i.slug}` : `/${i.section}/place/${i.slug}`),
    event: (e) => `/event/${e.slug}`,
    news: (a) => `/news/${a.slug}`,
    story: (f) => `/story/${f.slug}`,
    guide: (g) => `/guides/${g.slug}`,
    hotel: (h) => `/live/stay/hotels/${h.slug}`,
    stay: (a) => `/live/stay/accommodation/${a.slug}`,
    parking: "/getting-here",
    transport: "/getting-here",
    label: (section) => section.label,
  },
};

export async function buildSearchIndex(platform = "app") {
  const link = LINKS[platform] ?? LINKS.app;
  const out = [];

  // A search box is not worth breaking the screen over: if one source fails,
  // index everything else.
  const [events, features, guides, gettingHere, businesses, hotels, accommodations, articles] = await Promise.all([
    getEvents().catch(() => []),
    getStories().catch(() => []),
    getGuides().catch(() => []),
    getGettingHere().catch(() => null),
    // Registered businesses plus the demo directory, via the same API the
    // website uses — so anything admin or a business adds is searchable.
    getBusinesses().catch(() => []),
    getHotels().catch(() => []),
    getAccommodations().catch(() => []),
    getArticles().catch(() => []),
  ]);

  // Businesses / places / services, grouped by their section label.
  for (const item of businesses) {
    const section = sections[item.section];
    if (!section) continue;
    out.push({
      id: `place-${item.slug}`,
      title: item.name,
      subtitle: [link.label(section), item.tag].filter(Boolean).join(" · "),
      keywords: `${item.description ?? ""} ${item.address ?? ""}`,
      group: link.label(section),
      image: item.image,
      to: link.place(item),
    });
  }

  for (const e of events) {
    out.push({
      id: `event-${e.slug}`,
      title: e.title,
      subtitle: `${eventCategoryLabel(e.category)} · ${e.date}`,
      keywords: `${e.excerpt ?? ""} ${e.location ?? ""}`,
      group: "What's On",
      image: e.image,
      to: link.event(e),
    });
  }

  for (const a of articles) {
    out.push({
      id: `article-${a.slug}`,
      title: a.title,
      subtitle: `${a.category} · ${a.date}`,
      keywords: a.excerpt ?? "",
      group: "Offers & News",
      image: a.image,
      to: link.news(a),
    });
  }

  for (const f of features) {
    out.push({
      id: `story-${f.slug}`,
      title: f.cardHeading ?? f.title,
      subtitle: "Featured story",
      keywords: f.title ?? "",
      group: "Offers & News",
      image: f.cardImage,
      to: link.story(f),
    });
  }

  for (const g of guides) {
    out.push({
      id: `guide-${g.slug}`,
      title: g.title,
      subtitle: g.category,
      keywords: g.summary ?? "",
      group: "Guides",
      image: g.cardImage,
      to: link.guide(g),
    });
  }

  for (const h of hotels) {
    out.push({
      id: `hotel-${h.slug}`,
      title: h.name,
      subtitle: ["Hotel", h.address].filter(Boolean).join(" · "),
      keywords: h.tagline ?? "",
      group: "Stay",
      image: h.image,
      to: link.hotel(h),
    });
  }

  for (const a of accommodations) {
    out.push({
      id: `stay-${a.slug}`,
      title: a.name,
      subtitle: [a.type, a.address].filter(Boolean).join(" · "),
      keywords: a.tagline ?? "",
      group: "Stay",
      image: a.image,
      to: link.stay(a),
    });
  }

  // Practical info — parking and transport are top user needs, so they are
  // searchable by name too.
  out.push({
    id: "info-parking",
    title: "Parking in Maidenhead",
    subtitle: "Town-centre car parks & directions",
    keywords: "car park nicholsons vicus way hines meadow stafferton blue badge",
    group: "Practical Info",
    image: "/images/ql-parking.jpg",
    to: link.parking,
  });
  out.push({
    id: "info-transport",
    title: "Transport & Getting Here",
    subtitle: (gettingHere?.sections?.[0]?.intro ?? "").slice(0, 60) + "…",
    keywords: "train elizabeth line gwr bus car m4 cycling walking directions",
    group: "Practical Info",
    image: "/images/getting-here.jpg",
    to: link.transport,
  });

  return out;
}

export function searchAll(index, query, group = "All") {
  const q = query.trim().toLowerCase();
  const pool = group === "All" ? index : index.filter((r) => r.group === group);
  if (!q) return [];
  return pool
    .map((r) => {
      const title = r.title.toLowerCase();
      // Rank exact prefix matches above mid-word and keyword-only hits so the
      // most obvious result lands at the top.
      let score = -1;
      if (title.startsWith(q)) score = 0;
      else if (title.includes(q)) score = 1;
      else if (r.subtitle?.toLowerCase().includes(q)) score = 2;
      else if (r.keywords?.toLowerCase().includes(q)) score = 3;
      return { r, score };
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => a.score - b.score)
    .map((x) => x.r);
}
