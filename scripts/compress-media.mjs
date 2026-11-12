#!/usr/bin/env node
// Shrinks the pictures and videos in public/ in place: same file names, same
// formats, so every link to them (code, database, emails) keeps working.
//
//   npm run media:compress            compress everything that's worth it
//   npm run media:compress -- --dry   only report what would change
//
// Pictures: at most 1920px on the long side (more than any screen the site
// or app shows them on), JPEG via mozjpeg at quality 80, PNG as a dithered
// 256-colour palette, WebP at quality 80. Videos: H.264 at CRF 26; the
// background loops in public/videos always play muted, so their sound track
// is dropped. A file is only replaced when the new one is at least 15%
// smaller, so running this again later only touches new or heavy files.
//
// The originals stay in git history.

import { execFileSync, spawnSync } from "node:child_process";
import { readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import sharp from "sharp";

const DRY = process.argv.includes("--dry");
const MAX_SIDE = 1920;
const MIN_BYTES = 150 * 1024; // smaller files aren't worth a lossy pass
const KEEP_RATIO = 0.85;

// Folder → whether its videos keep their sound.
const VIDEO_DIRS = { "public/videos": false, "public/images": true };

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const kb = (n) => `${Math.round(n / 1024)}K`;
let before = 0;
let after = 0;
const rows = [];

function record(file, oldSize, newSize, note = "") {
  before += oldSize;
  after += newSize;
  if (newSize !== oldSize) rows.push(`${kb(oldSize).padStart(7)} → ${kb(newSize).padStart(6)}  ${file}${note}`);
}

async function compressImage(file) {
  const ext = extname(file).toLowerCase();
  const oldSize = statSync(file).size;
  if (oldSize < MIN_BYTES) return record(file, oldSize, oldSize);

  // .rotate() bakes in any EXIF orientation before the metadata is dropped.
  let img = sharp(file).rotate().resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true });
  if (ext === ".jpg" || ext === ".jpeg") img = img.jpeg({ quality: 80, mozjpeg: true });
  else if (ext === ".png") img = img.png({ palette: true, quality: 85, effort: 10, compressionLevel: 9, dither: 1 });
  else if (ext === ".webp") img = img.webp({ quality: 80, effort: 6 });
  else return record(file, oldSize, oldSize);

  const out = await img.toBuffer();
  // The file's real format can differ from its name (a PNG saved as .jpg);
  // re-encoding to match the name is a fix in itself, so always keep it then.
  const { format } = await sharp(file).metadata();
  const mislabelled = (ext === ".png") !== (format === "png") || (ext === ".webp") !== (format === "webp");
  if (!mislabelled && out.length > oldSize * KEEP_RATIO) return record(file, oldSize, oldSize);
  if (!DRY) writeFileSync(file, out);
  record(file, oldSize, out.length, mislabelled ? `  (was ${format})` : "");
}

function compressVideo(file, keepAudio) {
  const oldSize = statSync(file).size;
  if (oldSize < MIN_BYTES) return record(file, oldSize, oldSize);
  const tmp = `${file}.tmp.mp4`;
  const args = [
    "-y", "-loglevel", "error", "-i", file,
    "-c:v", "libx264", "-preset", "slow", "-crf", "26",
    "-profile:v", "high", "-pix_fmt", "yuv420p",
    ...(keepAudio ? ["-c:a", "aac", "-b:a", "96k"] : ["-an"]),
    "-movflags", "+faststart", tmp,
  ];
  const run = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (run.status !== 0) {
    rmSync(tmp, { force: true });
    console.warn(`  ffmpeg failed on ${file}; left as it was`);
    return record(file, oldSize, oldSize);
  }
  const newSize = statSync(tmp).size;
  if (DRY || newSize > oldSize * KEEP_RATIO) {
    rmSync(tmp);
    return record(file, oldSize, DRY && newSize <= oldSize * KEEP_RATIO ? newSize : oldSize);
  }
  renameSync(tmp, file);
  record(file, oldSize, newSize, keepAudio ? "" : "  (muted loop: sound removed)");
}

let hasFfmpeg = true;
try { execFileSync("ffmpeg", ["-version"], { stdio: "ignore" }); } catch { hasFfmpeg = false; }

for (const [dir, keepAudio] of Object.entries(VIDEO_DIRS)) {
  for (const file of walk(dir)) {
    const ext = extname(file).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) await compressImage(file);
    else if (ext === ".mp4" && hasFfmpeg) compressVideo(file, keepAudio);
  }
}
if (!hasFfmpeg) console.warn("ffmpeg not found: videos skipped (brew install ffmpeg).");

console.log(rows.join("\n"));
console.log(`\n${DRY ? "Would shrink" : "Shrank"} ${rows.length} files: ${(before / 1048576).toFixed(1)} MB → ${(after / 1048576).toFixed(1)} MB`);
