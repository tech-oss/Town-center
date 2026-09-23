// Re-encodes the pictures already in Storage.
//
// Uploads from before lib/compressImage.js went in are full-resolution PNGs —
// 168 MB of the 202 MB in Storage, with single files over 3 MB. The render
// endpoint resizes them on the way out, but it still reads the full original
// from the origin each time a new variant is cached, and they cost storage.
//
// This walks both buckets, re-encodes anything oversized as WebP, uploads it
// beside the original and rewrites every database column that referenced the
// old URL. Originals are left in place unless --delete is passed, so a bad
// run can be undone by restoring the old URLs.
//
// Run:
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/compress-storage.mjs --dry-run
//   …                                                                          --apply
//   …                                                                          --apply --delete
//
// The service role key bypasses RLS, so this is a local operator script: keep
// the key out of the repo and out of any deployed bundle.

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const URL_BASE = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// A dry run only reads public buckets, so it works with the anon key. Writing
// needs the service role key, because it bypasses RLS on the content tables.
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const KEY = SERVICE_KEY ?? ANON_KEY;

const APPLY = process.argv.includes("--apply");

if (!URL_BASE || !KEY) {
  console.error("Set SUPABASE_URL, plus SUPABASE_SERVICE_ROLE_KEY (to apply) or SUPABASE_ANON_KEY (to dry-run).");
  process.exit(1);
}
if (APPLY && !SERVICE_KEY) {
  console.error("--apply needs SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const DELETE_ORIGINALS = process.argv.includes("--delete");

const MAX_EDGE = 1600;
const QUALITY = 82;
// Anything smaller than this isn't worth a round trip.
const MIN_BYTES = 150 * 1024;
const SKIP_TYPES = ["image/gif", "image/svg+xml"];

const BUCKETS = ["media", "business-media"];

// Every column that can hold a Storage URL. A missed one would leave a row
// pointing at a deleted file, so --delete is only safe once this is complete.
const COLUMNS = [
  ["businesses", "id", ["logo"]],
  ["business_listings", "business_id", ["hero_image", "logo"]],
  ["business_articles", "id", ["hero_image", "thumbnail"]],
  ["business_events", "id", ["hero_image"]],
  ["feature_articles", "id", ["hero_image", "card_image"]],
  ["news_offers", "id", ["image"]],
  ["neighbourhood_guides", "slug", ["hero_image", "thumbnail"]],
];
// Columns holding JSON or arrays of URLs, rewritten by string replacement.
const JSON_COLUMNS = [
  ["business_listings", "business_id", ["gallery"]],
  ["business_events", "id", ["gallery"]],
  ["feature_articles", "id", ["gallery", "body"]],
  ["neighbourhood_guides", "slug", ["content"]],
  ["site_content", "key", ["content"]],
];

const db = createClient(URL_BASE, KEY, { auth: { persistSession: false } });

const publicUrl = (bucket, path) =>
  `${URL_BASE}/storage/v1/object/public/${bucket}/${path}`;

async function* walk(bucket, prefix = "") {
  const { data, error } = await db.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw error;
  for (const entry of data ?? []) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.metadata) yield { path, meta: entry.metadata };
    else yield* walk(bucket, path);
  }
}

async function rewriteUrl(oldUrl, newUrl) {
  let changed = 0;
  for (const [table, key, cols] of COLUMNS) {
    for (const col of cols) {
      const { data, error } = await db.from(table).update({ [col]: newUrl }).eq(col, oldUrl).select(key);
      if (error && !/does not exist|schema cache/i.test(error.message)) throw error;
      changed += data?.length ?? 0;
    }
  }
  // Arrays and JSON documents: read the rows that mention the URL and swap it
  // inside the serialised value.
  for (const [table, key, cols] of JSON_COLUMNS) {
    for (const col of cols) {
      const { data, error } = await db.from(table).select(`${key}, ${col}`);
      if (error) { if (/does not exist|schema cache/i.test(error.message)) continue; throw error; }
      for (const row of data ?? []) {
        const raw = JSON.stringify(row[col] ?? null);
        if (!raw.includes(oldUrl)) continue;
        const next = JSON.parse(raw.split(oldUrl).join(newUrl));
        const { error: upErr } = await db.from(table).update({ [col]: next }).eq(key, row[key]);
        if (upErr) throw upErr;
        changed += 1;
      }
    }
  }
  return changed;
}

async function run() {
  console.log(APPLY ? "APPLYING changes" : "DRY RUN — nothing will be written");
  console.log(`max ${MAX_EDGE}px, WebP q${QUALITY}, files over ${Math.round(MIN_BYTES / 1024)} KB\n`);

  let before = 0, after = 0, done = 0, skipped = 0, failed = 0;

  for (const bucket of BUCKETS) {
    for await (const { path, meta } of walk(bucket)) {
      const size = meta.size ?? 0;
      const type = meta.mimetype ?? "";
      if (!type.startsWith("image/") || SKIP_TYPES.includes(type) || size < MIN_BYTES) { skipped++; continue; }

      try {
        const { data: blob, error } = await db.storage.from(bucket).download(path);
        if (error) throw error;
        const input = Buffer.from(await blob.arrayBuffer());

        const output = await sharp(input)
          .rotate()
          .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
          .webp({ quality: QUALITY })
          .toBuffer();

        if (output.length >= input.length) {
          console.log(`  =  ${bucket}/${path} — already smaller as-is`);
          skipped++;
          continue;
        }

        const newPath = path.replace(/\.[^./]+$/, "") + ".webp";
        const pct = Math.round((1 - output.length / input.length) * 100);
        console.log(`  ↓  ${bucket}/${path}  ${(input.length / 1e6).toFixed(2)}MB → ${(output.length / 1e6).toFixed(2)}MB  (−${pct}%)`);

        before += input.length;
        after += output.length;
        done++;

        if (!APPLY) continue;

        const { error: upErr } = await db.storage.from(bucket).upload(newPath, output, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: true,
        });
        if (upErr) throw upErr;

        const rows = await rewriteUrl(publicUrl(bucket, path), publicUrl(bucket, newPath));
        console.log(`     ${rows} row${rows === 1 ? "" : "s"} repointed`);

        if (DELETE_ORIGINALS && newPath !== path) {
          const { error: delErr } = await db.storage.from(bucket).remove([path]);
          if (delErr) console.warn(`     could not delete original: ${delErr.message}`);
        }
      } catch (e) {
        failed++;
        console.warn(`  ✗  ${bucket}/${path} — ${e.message}`);
      }
    }
  }

  console.log(`\n${done} re-encoded, ${skipped} left alone, ${failed} failed`);
  console.log(`${(before / 1e6).toFixed(1)} MB → ${(after / 1e6).toFixed(1)} MB` +
    (before ? `  (−${Math.round((1 - after / before) * 100)}%)` : ""));
  if (!APPLY) console.log("\nRe-run with --apply to write these changes.");
  else if (!DELETE_ORIGINALS) console.log("\nOriginals kept. Re-run with --delete once the site looks right.");
}

run().catch((e) => { console.error(e); process.exit(1); });
