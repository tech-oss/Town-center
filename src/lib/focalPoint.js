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
  // Only the first part is the focus point; per-place crops follow after ";".
  const [x, y] = src.slice(hash + 3).split(";")[0].split(",");
  const fx = clamp(x);
  const fy = clamp(y);
  if (!Number.isFinite(fx) || !Number.isFinite(fy)) return DEFAULT;
  return { x: fx, y: fy };
}

export function stripFocal(src) {
  if (typeof src !== "string") return src;
  const hash = src.indexOf("#f=");
  return hash === -1 ? src : src.slice(0, hash);
}

// Attaches one, replacing any that is there. Dead centre is stored as no
// fragment at all, so the common case leaves the URL as it was.
export function withFocal(src, { x, y }) {
  if (typeof src !== "string" || !src) return src;
  return build(stripFocal(src), { x: clamp(x), y: clamp(y) }, cropsOf(src));
}

// ── Crops for each place a picture is shown ─────────────────────────────────
//
// One focus point can't satisfy every shape: a business header is 16:9 on
// its page but square on its listing card, and whatever the focus point
// keeps in one it cuts in the other. So a picture can also carry its own
// framing for each place — chosen by the business in the cropper, where each
// frame is drawn at that place's exact shape with exactly the same rules the
// page uses (cropStyle below). What they frame is what the public sees.
//
//   …/hero.webp#f=50,40;card=30,60,140;hero=50,45,100
//                       place=x%,y%,zoom%
//
// Places (FRAMES): "hero" (header, 16:9), "card" (listing / article cards
// and thumbnails, square — shown 4:3 on phones), "gallery" (gallery tiles,
// square), "logo" (square).

export const FRAMES = {
  hero: { label: "Page header", aspect: 16 / 9 },
  card: { label: "Listing card", aspect: 1 },
  gallery: { label: "Gallery tile", aspect: 1 },
  logo: { label: "Logo", aspect: 1 },
};

const clampZoom = (z) => Math.max(100, Math.min(400, Math.round(Number(z) || 100)));

export function cropsOf(src) {
  const out = {};
  if (typeof src !== "string") return out;
  const hash = src.indexOf("#f=");
  if (hash === -1) return out;
  for (const part of src.slice(hash + 3).split(";").slice(1)) {
    const [name, v] = part.split("=");
    if (!name || !v) continue;
    const [x, y, z] = v.split(",");
    if ([x, y].every((n) => Number.isFinite(Number(n)))) out[name] = { x: clamp(x), y: clamp(y), z: clampZoom(z) };
  }
  return out;
}

// The framing for one place: its own crop, else the focus point at 100%.
export function cropOf(src, frame) {
  const c = frame ? cropsOf(src)[frame] : null;
  if (c) return c;
  const { x, y } = focalOf(src);
  return { x, y, z: 100 };
}

export function withCrop(src, frame, crop) {
  if (typeof src !== "string" || !src) return src;
  const crops = { ...cropsOf(src) };
  if (crop) crops[frame] = { x: clamp(crop.x), y: clamp(crop.y), z: clampZoom(crop.z) };
  else delete crops[frame];
  return build(stripFocal(src), focalOf(src), crops);
}

// Style for an <img className="object-cover"> filling its box: the same
// rules the cropper previews with, so the two always agree.
export function cropStyle(src, frame) {
  const { x, y, z } = cropOf(src, frame);
  return {
    objectPosition: `${x}% ${y}%`,
    ...(z > 100 ? { transform: `scale(${z / 100})`, transformOrigin: `${x}% ${y}%` } : {}),
  };
}

function build(base, focal, crops) {
  const parts = Object.entries(crops).map(([k, c]) => `${k}=${c.x},${c.y},${c.z}`);
  const isDefault = focal.x === DEFAULT.x && focal.y === DEFAULT.y;
  if (isDefault && !parts.length) return base;
  return `${base}#f=${[`${focal.x},${focal.y}`, ...parts].join(";")}`;
}

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
