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
import { getPromotedPosts } from "./promotedPosts";
import { getLiveHomepageKeys } from "./homepageSlots";

// A Featured Story's business type comes from its eyebrow (the section it's
// filed under in the admin editor), so the Offers page's Business Type
// filter finds it.
const STORY_SECTION = {
  "eat & drink": "eat-drink",
  "see & do": "see-do",
  "shop & local services": "shop",
  shop: "shop",
  services: "services",
  "hotels & accommodation": "stay",
};
const storySection = (s) => STORY_SECTION[String(s.eyebrow ?? "").trim().toLowerCase()] ?? null;

// Which homepage key an article has: an admin post or a business's own post.
function articleKey(a) {
  if (a.newsOfferId) return `news_offer:${a.newsOfferId}`;
  if (a.id?.startsWith("live-")) return `business_article:${a.id.slice(5)}`;
  return null;
}

export async function getOffersFeed() {
  const [stories, articles, standalone, promoted, events, onHome] = await Promise.all([
    getStories(),
    getArticles(),
    getStandaloneNewsOffers(),
    getPromotedPosts().catch(() => []),
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
      businessName: s.businessName ?? null,
      businessSection: storySection(s),
      // Searchable: the section and category it's filed under.
      category: [s.eyebrow, s.category].filter(Boolean).join(" "),
      homepage: !!s.homepage,
    })),
    // Featured Articles attached to a business now sit in that business's
    // `news` list too, so they show on its profile — which means getArticles()
    // hands them back here as well. They are already in `stories` above, with
    // the right /story/ link; the copy coming through here carried a /news/
    // one that does not resolve, and the two keys differ so the de-duplication
    // below never caught it. Every business-attached featured article was
    // listed twice on this page, once broken.
    ...[...articles, ...standalone, ...promoted]
      .filter((a) => !String(a.id ?? "").startsWith("feature-"))
      .map((a) => ({
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
    // Featured articles always lead the page, then whatever is on the
    // homepage now, then the rest — in that order of precedence.
    .sort((a, b) =>
      Number(b.type === "Featured") - Number(a.type === "Featured") ||
      Number(b.homepage) - Number(a.homepage));
}
