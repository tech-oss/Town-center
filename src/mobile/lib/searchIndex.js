// ════════════════════════════════════════════════════════════════════════════
//  Global app search index.
//
//  Flattens every piece of content the app already ships — businesses, places,
//  services, events, offers/news, features, guides and stays — into one list of
//  { id, title, subtitle, group, image, to } records the SearchScreen can match
//  against. Everything here is derived from the same Data/*.js the website
//  uses; nothing is invented.
// ════════════════════════════════════════════════════════════════════════════

import { sections, allArticles } from "../../Data/pages";
import { events } from "../../Data/events";
import { guides } from "../../Data/guides";
import { features } from "../../Data/features";
import { hotels, accommodations, allStayArticles } from "../../Data/stay";
import { travelSections } from "../../Data/gettingHere";

function build() {
  const out = [];

  // Businesses / places / services, grouped by their section label.
  for (const section of Object.values(sections)) {
    for (const item of section.items) {
      out.push({
        id: `place-${item.slug}`,
        title: item.name,
        subtitle: `${section.label} · ${item.tag}`,
        keywords: `${item.description ?? ""} ${item.address ?? ""}`,
        group: section.label,
        image: item.image,
        to: `/mobile/place/${item.slug}`,
      });
    }
  }

  for (const e of events) {
    out.push({
      id: `event-${e.slug}`,
      title: e.title,
      subtitle: `${e.category} · ${e.date}`,
      keywords: `${e.excerpt ?? ""} ${e.location ?? ""}`,
      group: "What's On",
      image: e.image,
      to: `/mobile/event/${e.slug}`,
    });
  }

  for (const a of [...allArticles, ...allStayArticles]) {
    out.push({
      id: `article-${a.slug}`,
      title: a.title,
      subtitle: `${a.category} · ${a.date}`,
      keywords: a.excerpt ?? "",
      group: "Offers & News",
      image: a.image,
      to: `/mobile/news/${a.slug}`,
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
      to: `/mobile/story/${f.slug}`,
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
      to: `/mobile/guides/${g.slug}`,
    });
  }

  for (const h of hotels) {
    out.push({
      id: `hotel-${h.slug}`,
      title: h.name,
      subtitle: `Hotel · ${h.address}`,
      keywords: h.tagline ?? "",
      group: "Stay",
      image: h.image,
      to: `/mobile/stay/hotels/${h.slug}`,
    });
  }

  for (const a of accommodations) {
    out.push({
      id: `stay-${a.slug}`,
      title: a.name,
      subtitle: `${a.type} · ${a.address}`,
      keywords: a.tagline ?? "",
      group: "Stay",
      image: a.image,
      to: `/mobile/stay/accommodation/${a.slug}`,
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
    to: "/mobile/parking",
  });
  out.push({
    id: "info-transport",
    title: "Transport & Getting Here",
    subtitle: travelSections[0].intro.slice(0, 60) + "…",
    keywords: "train elizabeth line gwr bus car m4 cycling walking directions",
    group: "Practical Info",
    image: "/images/getting-here.jpg",
    to: "/mobile/transport",
  });

  return out;
}

export const searchIndex = build();

export const SEARCH_GROUPS = Array.from(new Set(searchIndex.map((r) => r.group)));

export function searchAll(query, group = "All") {
  const q = query.trim().toLowerCase();
  const pool = group === "All" ? searchIndex : searchIndex.filter((r) => r.group === group);
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
