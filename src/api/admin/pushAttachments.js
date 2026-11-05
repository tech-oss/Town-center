import { loadLiveBusinesses } from "../liveBusinesses";
import { getStories } from "../stories";
import { getGuides } from "../guides";
import { getEvents } from "../events";

// What a push notification can link to: live news & offers from businesses,
// live events (town events and businesses' own), featured stories and
// published guides — all read from the same live data
// the public site shows, so anything that's on the site can be attached.
export async function getAttachableContent() {
  const [businesses, events, stories, guides] = await Promise.all([
    loadLiveBusinesses().catch(() => []),
    getEvents().catch(() => []),
    getStories().catch(() => []),
    getGuides().catch(() => []),
  ]);

  // A business's events also sit in its news list; they're listed once, below.
  const articles = businesses.flatMap((b) => (b.news ?? [])
    .filter((a) => !String(a.to ?? "").startsWith("/event/"))
    .map((a) => ({
    id: a.slug,
    title: a.title,
    category: a.category === "Offer" ? "Offer" : "News",
    businessName: b.name,
    thumbnail: a.image,
    // Featured stories and events have their own page (/story/…, /event/…).
    link: a.to ?? `/news/${a.slug}`,
  })));

  // Events couldn't be attached before: a town event belongs to no business,
  // so it never appeared, and a business's event was listed as "News".
  const eventItems = events.map((e) => ({
    id: `event-${e.id}`,
    title: e.title,
    category: "Event",
    businessName: [e.businessName, e.date].filter(Boolean).join(" · ") || null,
    thumbnail: e.image,
    link: `/event/${e.slug}`,
  }));

  const featured = stories.map((s) => ({
    id: `story-${s.slug}`,
    title: s.cardHeading || s.title,
    category: "Featured Story",
    businessName: null,
    thumbnail: s.cardImage || s.heroImage,
    link: `/story/${s.slug}`,
  }));

  const guideItems = guides.map((g) => ({
    id: `guide-${g.slug}`,
    title: g.title,
    category: "Guide",
    businessName: null,
    thumbnail: g.cardImage || g.heroImage,
    link: `/guides/${g.slug}`,
  }));

  return [...articles, ...eventItems, ...featured, ...guideItems];
}
