// Keeps base64 data URLs out of the database.
//
// A picture pasted in as a `data:image/...;base64,...` string is stored inside
// the row itself. It is about a third larger than the file it came from, it
// cannot be resized by the Storage render endpoint, the CDN never caches it,
// and it is re-sent in full by every query that selects the column.
//
// Two logos stored that way (1.7 MB and 486 KB) made up 95% of the admin
// approvals query, which the sidebar refetched every 60 seconds — between them
// they accounted for most of this project's database egress.
//
// Images belong in Storage, with the row holding a URL. This is the backstop
// for that rule: whatever screen is doing the writing, a data URL never
// reaches a column.

const isDataUrl = (v) => typeof v === "string" && v.startsWith("data:");

// Fields that hold a picture, across the listing, article and event rows.
const IMAGE_FIELDS = [
  "logo", "hero_image", "heroImage", "image", "thumbnail",
  "card_image", "cardImage", "header_image", "headerImage",
];

// Strips data URLs out of a row about to be written. Returns the cleaned row
// and what was dropped, so the caller can tell the user rather than saving
// something different from what they see.
export function stripDataUrls(row) {
  const dropped = [];
  const out = { ...row };

  for (const key of Object.keys(out)) {
    const value = out[key];
    if (isDataUrl(value)) {
      // A picture column set to a data URL: leave the existing value alone
      // rather than writing the blob or blanking the field.
      delete out[key];
      dropped.push(key);
      continue;
    }
    // Galleries and other arrays of pictures.
    if (Array.isArray(value) && value.some(isDataUrl)) {
      out[key] = value.filter((v) => !isDataUrl(v));
      dropped.push(key);
    }
  }
  return { row: out, dropped };
}

// For a save path that would rather fail loudly than save something the user
// did not intend.
export function assertNoDataUrls(row) {
  const bad = Object.entries(row ?? {})
    .filter(([, v]) => isDataUrl(v) || (Array.isArray(v) && v.some(isDataUrl)))
    .map(([k]) => k);
  if (bad.length) {
    throw new Error(
      `Pictures must be uploaded, not pasted in: ${bad.join(", ")}. ` +
      "Use the upload button so the image is stored properly."
    );
  }
}

export { isDataUrl, IMAGE_FIELDS };
