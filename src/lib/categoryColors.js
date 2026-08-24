// One colour per business category — Eat & Drink = yellow, Shop = green,
// See & Do = blue, Services = orange, Stay = purple — shared by every place
// a category needs a colour: the map pins/filters (mobile MapScreen.jsx,
// web TradersMap.jsx) and the Offers "Business Type" filter (mobile
// OffersScreen.jsx, web OffersPage.jsx). Two key spellings exist across the
// data files (Data/pages.js's `sections` uses "eat-drink"/"shop"/"see-do";
// Data/content.js's brandGrid uses "food-drink"/"shopping"/"health-beauty"),
// so both point at the same colour here.
export const CATEGORY_COLORS = {
  "eat-drink": "#F5B700",
  "food-drink": "#F5B700",
  shop: "#2FA84F",
  shopping: "#2FA84F",
  services: "#C25E00",
  "health-beauty": "#C25E00",
  "see-do": "#2E86DE",
  stay: "#8E6FC4",
};

export const categoryColor = (key) => CATEGORY_COLORS[key] ?? "#52C7B6";
