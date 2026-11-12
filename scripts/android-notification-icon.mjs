// The small icon Android shows for a Maidenhead notification (status bar and
// the notification itself). Android draws only its shape, tinted, so it's
// the Maidenhead "M" mark in plain white on a clear background. Made from the
// mark in public/logo-mark.svg, at Android's five screen densities (24dp).
// Run on its own or as part of scripts/android-assets.mjs.
import sharp from "sharp";
import { mkdirSync, readFileSync } from "node:fs";

const svg = readFileSync("public/logo-mark.svg", "utf8");
const png = Buffer.from(svg.match(/base64,([A-Za-z0-9+/=]+)/)[1], "base64");
const RES = "android/app/src/main/res";
const SIZES = { mdpi: 24, hdpi: 36, xhdpi: 48, xxhdpi: 72, xxxhdpi: 96 };

// The mark's own transparency, with every visible pixel turned white.
const alpha = await sharp(png).ensureAlpha().extractChannel(3).toBuffer();
const { width, height } = await sharp(png).metadata();
const white = await sharp({ create: { width, height, channels: 3, background: "#ffffff" } })
  .joinChannel(alpha)
  .png()
  .toBuffer();

for (const [density, size] of Object.entries(SIZES)) {
  const inner = Math.round(size * 0.9); // a little room around the mark
  const mark = await sharp(white).resize(inner, inner, { fit: "inside" }).toBuffer();
  mkdirSync(`${RES}/drawable-${density}`, { recursive: true });
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toFile(`${RES}/drawable-${density}/ic_stat_maidenhead.png`);
}
console.log("Android notification icon written (ic_stat_maidenhead).");
