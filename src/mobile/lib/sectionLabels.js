// Where the app names a section differently from the website. Both now use
// the site's own names (Data/pages.js), so nothing is overridden.
const APP_LABELS = {};

export function appSectionLabel(key, fallback) {
  return APP_LABELS[key] ?? fallback;
}
