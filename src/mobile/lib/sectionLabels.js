// The app names a couple of sections differently from the website: its Shop
// section also covers local services, so it reads "Shop & Services".
const APP_LABELS = { shop: "Shop & Services" };

export function appSectionLabel(key, fallback) {
  return APP_LABELS[key] ?? fallback;
}
