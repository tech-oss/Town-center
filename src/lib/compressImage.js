// Shrinks a picture in the browser before it is uploaded.
//
// Everything used to go to Storage exactly as it came off the phone or out of
// an image generator: 2–3 MB PNGs, served at full size into cards a few
// hundred pixels wide (and logos a few dozen). That was the bulk of the
// project's CDN bandwidth.
//
// A photograph stored as PNG is roughly 10–20× larger than the same picture
// as WebP, because PNG is lossless. Nothing on the site needs that: these are
// photographs, not diagrams. So a picture is drawn onto a canvas at a sane
// maximum size and re-encoded as WebP.
//
// Left alone:
//   • GIFs — re-encoding loses the animation.
//   • SVGs — already small, and rasterising them would be a downgrade.
//   • anything already small enough that shrinking wouldn't pay.
//
// If any of this fails — an unreadable file, a browser without WebP — the
// original is uploaded unchanged. Compression is an optimisation, never a
// reason for someone to lose their picture.

// Wide enough for a full-bleed hero on a 2× display; far beyond any card.
const MAX_EDGE = 1600;
const QUALITY = 0.82;
// Below this, re-encoding tends to cost more than it saves.
const SKIP_UNDER_BYTES = 120 * 1024;

const KEEP_AS_IS = ["image/gif", "image/svg+xml"];

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("unreadable")); };
    img.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

// Every picture is stored as WebP and under TARGET_BYTES (300KB). Quality
// comes down first, in steps, and only if that isn't enough is the picture
// made smaller, so detail is kept wherever the size allows.
const TARGET_BYTES = 300 * 1024;
const MIN_QUALITY = 0.5;

// Returns a File to upload — the compressed one when that's smaller, and the
// original otherwise.
export async function compressImage(file, { maxEdge = MAX_EDGE, quality = QUALITY, targetBytes = TARGET_BYTES } = {}) {
  if (!file?.type?.startsWith("image/")) return file;
  if (KEEP_AS_IS.includes(file.type)) return file;
  // Already small WebP: nothing to gain.
  if (file.type === "image/webp" && file.size < SKIP_UNDER_BYTES) return file;

  try {
    const img = await loadImage(file);
    let edge = Math.min(maxEdge, Math.max(img.naturalWidth, img.naturalHeight));
    let best = null;

    for (let pass = 0; pass < 6; pass++) {
      const scale = edge / Math.max(img.naturalWidth, img.naturalHeight);
      const width = Math.round(img.naturalWidth * scale);
      const height = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      // A PNG with transparency would otherwise come out with a black
      // background once it's WebP, so it is flattened onto white first.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      for (let q = quality; q >= MIN_QUALITY - 0.001; q -= 0.08) {
        const blob = await canvasToBlob(canvas, "image/webp", q);
        // A browser that can't write WebP hands back a PNG (or nothing).
        if (!blob || blob.type !== "image/webp") return file;
        best = blob;
        if (blob.size <= targetBytes) break;
      }
      if (best.size <= targetBytes) break;
      edge = Math.round(edge * 0.8);
    }

    // Trust the result only when it actually saved something.
    if (!best || best.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([best], name, { type: "image/webp", lastModified: Date.now() });
  } catch {
    return file;
  }
}
