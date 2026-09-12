// The categories a neighbourhood guide can carry. One canonical list, shared
// by the admin editor's picker, the website's guides listing and the app's
// Guides screen, so a guide can't be filed under something the filters don't
// know about. `value` is the ?category= slug; `label` is what's stored on the
// guide and shown to readers.
export const GUIDE_CATEGORIES = [
  { value: "history-heritage", label: "History & Heritage" },
  { value: "food-drink",       label: "Food & Drink" },
  { value: "things-to-do",     label: "Things to Do" },
  { value: "hidden-gems",      label: "Hidden Gems & Local Favourites" },
  { value: "outdoors-walks",   label: "Outdoors & Walks" },
  { value: "shopping-retail",  label: "Shopping & Retail" },
  { value: "family-kids",      label: "Family & Kids" },
  { value: "health-wellbeing", label: "Health, Fitness & Wellbeing" },
  { value: "local-life",       label: "Local Life & Community" },
  { value: "seasonal",         label: "Seasonal & Special Occasions" },
];

export const GUIDE_CATEGORY_LABELS = GUIDE_CATEGORIES.map((c) => c.label);

export const guideCategorySlug = (label) =>
  GUIDE_CATEGORIES.find((c) => c.label === label)?.value ?? null;
