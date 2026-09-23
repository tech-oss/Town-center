// Asks Storage for a picture at the size it will actually be shown.
//
// A Supabase public object URL serves the file exactly as uploaded. The same
// file through the render endpoint is resized on the way out, and served as
// WebP to any browser whose Accept header allows it — which is all of them
// now. On a real 2.8 MB PNG from this project:
//
//     as uploaded                     2,864 KB
//     width=800, quality=75           1,344 KB
//     width=800, quality=75 + WebP      118 KB
//
// The saving comes from the format as much as the size, so this is worth
// doing even for a picture shown full width.
//
// Only Supabase Storage URLs are touched. Anything else — a seed image in
// /public, an external URL, a blob: preview mid-upload — is returned as it
// came in.

const PUBLIC_PATH = "/storage/v1/object/public/";
const RENDER_PATH = "/storage/v1/render/image/public/";

// The widths actually used, so the CDN caches a handful of variants per
// picture rather than one for every container width on every device.
export const IMAGE_SIZES = {
  icon: 96,     // logos and avatars
  thumb: 400,   // grid and list cards
  card: 800,    // feature cards, two-column layouts
  hero: 1600,   // full-bleed headers
};

export function imageUrl(src, size = "card", { quality = 75 } = {}) {
  if (typeof src !== "string" || !src) return src;
  if (!src.includes(PUBLIC_PATH)) return src;
  // Already a render URL (double-wrapped somewhere): leave it be.
  if (src.includes(RENDER_PATH)) return src;

  const width = typeof size === "number" ? size : IMAGE_SIZES[size] ?? IMAGE_SIZES.card;
  const [base, query] = src.split("?");
  const url = base.replace(PUBLIC_PATH, RENDER_PATH);
  const params = new URLSearchParams(query);
  params.set("width", String(width));
  params.set("quality", String(quality));
  // Never upscale a picture that was uploaded smaller than the box.
  params.set("resize", "contain");
  return `${url}?${params.toString()}`;
}

// A `srcset` so a phone doesn't download the desktop picture. Pass the width
// the image occupies at its largest, and the `sizes` attribute alongside it.
export function imageSrcSet(src, widths = [400, 800, 1600], { quality = 75 } = {}) {
  if (typeof src !== "string" || !src.includes(PUBLIC_PATH)) return undefined;
  return widths.map((w) => `${imageUrl(src, w, { quality })} ${w}w`).join(", ");
}
