// A business-entered link ("www.x.co.uk", "x.co.uk/book", "https://…") as a
// full https URL, or null. Without a scheme a browser treats it as a path on
// our own site, which is how app links ended up inside the site's URL.
export function externalUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^(mailto|tel):/i.test(raw)) return raw;
  return `https://${raw.replace(/^\/+/, "")}`;
}
