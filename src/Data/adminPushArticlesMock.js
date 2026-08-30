// ─── Mock articles/offers for the Push Notifications "attach" typeahead ──────

const img = (seed, w = 800, h = 500) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const PUSH_ATTACHABLE_ARTICLES = [
  { id: "pa1", title: "The Fat Duck — Tasting Menu Now Available", category: "News", thumbnail: img("fat-duck", 600, 400), link: "/news/the-fat-duck-tasting-menu" },
  { id: "pa2", title: "Coppa Club — Summer Terrace Happy Hour", category: "Offer", thumbnail: img("coppa-offer1", 600, 400), link: "/offers/coppa-club-happy-hour" },
  { id: "pa3", title: "COCOBA — End of Season Chocolate Sale", category: "Offer", thumbnail: img("cocoba-truffles", 600, 400), link: "/offers/cocoba-end-of-season-sale" },
  { id: "pa4", title: "Maidenhead Festival Opening Night Recap", category: "News", thumbnail: img("festival-recap", 600, 400), link: "/news/festival-opening-night-recap" },
  { id: "pa5", title: "A Local's Guide to the Riverside", category: "Guide", thumbnail: img("riverside-guide", 600, 400), link: "/guides/a-locals-guide-to-the-riverside" },
  { id: "pa6", title: "James's Kitchen — 20% Off Weekday Lunch", category: "Offer", thumbnail: img("james-kitchen", 600, 400), link: "/offers/james-kitchen-lunch-deal" },
  { id: "pa7", title: "Meet the Maker: Inside Maidenhead Book Nook", category: "Featured Story", thumbnail: img("book-nook-story", 600, 400), link: "/news/meet-the-maker-book-nook" },
];
