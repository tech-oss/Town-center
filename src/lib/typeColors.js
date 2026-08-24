// Dot colour per Offers/News article type — Featured, Offer, News, What's
// On — shared by the Offers "Types" filter and every place that type shows
// up again: the listing cards, the article/story/event detail pages, the
// per-business "News & Offers" scrollers, and the notification tray. Kept
// deliberately distinct from the business-category palette
// (lib/categoryColors.js) so the two colour systems never collide.
export const TYPE_COLORS = {
  Featured: "#D6336C",
  Offer: "#F4D35E",
  News: "#8B5E3C",
  "What's On": "#0E9AA7",
};

export const typeColor = (type) => TYPE_COLORS[type] ?? "var(--leaf)";
