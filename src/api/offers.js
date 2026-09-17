// The Offers page (website and app): everything that is or has been promoted,
// whether or not it's on the homepage right now —
//   • Featured Stories (admin long-form articles)
//   • every live news post and offer: a business's own posts and the posts
//     admin writes in Business News & Offers
//   • events that have been booked into What's On
// Items currently on the homepage are marked `homepage`. Paths are the
// website's; the app prefixes them with /mobile.
import { getStories } from "./stories";
import { getArticles } from "./articles";
import { getPromotedEvents } from "./events";
import { getStandaloneNewsOffers } from "./spotlight";
import { getLiveHomepageKeys } from "./homepageSlots";

// Which homepage key an article has: an admin post or a business's own post.
function articleKey(a) {
  if (a.newsOfferId) return `news_offer:${a.newsOfferId}`;
  if (a.id?.startsWith("live-")) return `business_article:${a.id.slice(5)}`;
  return null;
}

export async function getOffersFeed() {
  const [stories, articles, standalone, events, onHome] = await Promise.all([
    getStories(),
    getArticles(),
    getStandaloneNewsOffers(),
    getPromotedEvents().catch(() => []),
    getLiveHomepageKeys(),
  ]);

  const seen = new Set();
  const once = (key) => (seen.has(key) ? false : (seen.add(key), true));

  return [
    ...stories.map((s) => ({
      key: `story:${s.slug}`,
      slug: s.slug,
      to: `/story/${s.slug}`,
      image: s.cardImage,
      title: s.cardHeading,
      excerpt: s.cardBody,
      date: s.date,
      type: "Featured",
      businessName: null,
      businessSection: null,
      homepage: !!s.homepage,
    })),
    ...[...articles, ...standalone].map((a) => ({
      key: `news:${a.slug}`,
      slug: a.slug,
      to: `/news/${a.slug}`,
      image: a.image,
      title: a.title,
      excerpt: a.excerpt,
      date: a.date,
      type: a.category,
      businessName: a.business?.name ?? null,
      businessSection: a.business?.section ?? null,
      homepage: onHome.has(articleKey(a)),
    })),
    ...events.map((e) => ({
      key: `event:${e.slug}`,
      slug: e.slug,
      to: `/event/${e.slug}`,
      image: e.image,
      title: e.title,
      excerpt: e.excerpt,
      date: e.date,
      type: "What's On",
      businessName: null,
      businessSection: "see-do",
      homepage: onHome.has(`business_event:${e.id}`),
    })),
  ].filter((it) => it.slug && once(it.key))
    // What's on the homepage now leads the page.
    .sort((a, b) => Number(b.homepage) - Number(a.homepage));
}
