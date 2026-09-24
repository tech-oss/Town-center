// Where the subject of a picture is, so a crop keeps it.
//
// The problem this solves, measured on the live site: one 16:9 business hero
// is shown in a 1.94:1 box on the desktop profile (9% cut off the top and
// bottom), a 1.33:1 card further down the same page (25% cut off the sides),
// and a 1.67:1 box in the app. A guide hero uploaded at 3:2 is shown at
// 2.29:1 on a 1440px desktop and loses 34% of its height.
//
// So there is no "correct upload size". The same file is asked for four
// different shapes, and `object-fit: cover` always crops around the
// geometric centre — which is why heads, signs and buildings get cut off
// while the middle of a wall survives. Telling people to upload at a fixed
// size cannot fix it, because the shapes disagree with each other.
//
// What does fix it is saying where the subject is. Every crop then keeps
// that point in view instead of keeping the centre. This is the "hotspot"
// that Sanity, Contentful and Shopify all settled on.
//
// Storing it: as a fragment on the URL itself — `…/hero.jpg#f=50,30`.
//
//   • No migration. Pictures live in a dozen plain text columns across
//     business_listings, feature_articles, business_events, news_offers,
//     guides and site_content, some of them inside arrays and JSON. Adding a
//     companion column to each was the alternative.
//   • Nothing else has to understand it. A fragment is never sent to the
//     server, so Storage and the CDN are unaffected, and any code that has
//     not been taught about focal points shows the picture exactly as before.
//   • It travels with the URL, so a picture copied from one row to another
//     keeps its focal point.
//
// Without a fragment the answer is dead centre, which is what everything
// does today — so this is additive, and no existing picture changes.

const DEFAULT = { x: 50, y: 50 };

const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n))));

// The focal point of a URL, as percentages from the top-left.
export function focalOf(src) {
  if (typeof src !== "string") return DEFAULT;
  const hash = src.indexOf("#f=");
  if (hash === -1) return DEFAULT;
  const [x, y] = src.slice(hash + 3).split(",");
  const fx = clamp(x);
  const fy = clamp(y);
  if (!Number.isFinite(fx) || !Number.isFinite(fy)) return DEFAULT;
  return { x: fx, y: fy };
}

// The URL without it — what actually gets fetched, and what is compared.
export function stripFocal(src) {
  if (typeof src !== "string") return src;
  const hash = src.indexOf("#f=");
  return hash === -1 ? src : src.slice(0, hash);
}

// Attaches one, replacing any that is there. Dead centre is stored as no
// fragment at all, so the common case leaves the URL as it was.
export function withFocal(src, { x, y }) {
  if (typeof src !== "string" || !src) return src;
  const base = stripFocal(src);
  const fx = clamp(x);
  const fy = clamp(y);
  if (fx === DEFAULT.x && fy === DEFAULT.y) return base;
  return `${base}#f=${fx},${fy}`;
}

// The fragment itself, for putting back on a URL that has been rewritten.
export function focalSuffix(src) {
  if (typeof src !== "string") return "";
  const hash = src.indexOf("#f=");
  return hash === -1 ? "" : src.slice(hash);
}

export function hasFocal(src) {
  return typeof src === "string" && src.includes("#f=");
}

// Ready for the `object-position` CSS property.
export function focalPosition(src) {
  const { x, y } = focalOf(src);
  return `${x}% ${y}%`;
}

export { DEFAULT as DEFAULT_FOCAL };
