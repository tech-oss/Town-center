// A notification's link as admin typed it, made into a proper address:
// "www.example.com" (no https://) works in the app, but a browser
// notification opened it as a page of the site instead. Paths (/offers) and
// full addresses are kept as they are; empty means no link.
export function cleanPushLink(url) {
  const raw = String(url ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(raw)) return raw;
  if (/^[\w-]+(\.[\w-]+)+([/?#]|$)/.test(raw)) return `https://${raw}`;
  return raw;
}
