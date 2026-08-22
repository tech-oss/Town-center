// Dot colour per article type, shared so the Offers listing, its type
// filter and the article detail pages all mark an "Offer" (or News, What's
// On, Featured) with the same swatch. Mirrors the website's OffersPage.jsx.
export const TYPE_COLORS = {
  Featured: "var(--forest)",
  Offer: "#F5A623",
  News: "var(--leaf)",
  "What's On": "var(--teal-deep)",
};

export const typeColor = (type) => TYPE_COLORS[type] ?? "var(--leaf)";
