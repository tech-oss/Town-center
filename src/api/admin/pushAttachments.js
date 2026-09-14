import { loadLiveBusinesses } from "../liveBusinesses";
import { getStories } from "../stories";
import { getGuides } from "../guides";

// What a push notification can link to: live news & offers from businesses,
// featured stories and published guides — all read from the same live data
// the public site shows, so anything that's on the site can be attached.
export async function getAttachableContent() {
  const [businesses, stories, guides] = await Promise.all([
    loadLiveBusinesses().catch(() => []),
    getStories().catch(() => []),
    getGuides().catch(() => []),
  ]);

  const articles = businesses.flatMap((b) => (b.news ?? []).map((a) => ({
    id: a.slug,
    title: a.title,
    category: a.category === "Offer" ? "Offer" : "News",
    businessName: b.name,
    thumbnail: a.image,
    link: `/news/${a.slug}`,
  })));

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

  return [...articles, ...featured, ...guideItems];
}
