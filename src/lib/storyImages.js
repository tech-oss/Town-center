// Which picture sits with which section of a Featured Story.
//
// Each body section can carry its own `image` (set in the admin editor), and
// pictures alternate right/left down the page on the website. Older stories
// kept their pictures in a separate `gallery`; for those the pictures are
// spread evenly over the sections (skipping a headless intro), exactly as the
// page always placed them — so nothing moves for existing stories.
//
// Returns one entry per body section: { src, side } or null.
export function storySectionImages(story) {
  const body = story?.body ?? [];
  const out = body.map(() => null);

  if (body.some((b) => b?.image)) {
    let n = 0;
    body.forEach((b, i) => {
      if (b?.image) {
        out[i] = { src: b.image, side: n % 2 === 0 ? "right" : "left" };
        n += 1;
      }
    });
    return out;
  }

  const gallery = story?.gallery ?? [];
  const startIdx = body[0]?.heading ? 0 : 1;
  const candidates = body.map((_, i) => i).filter((i) => i >= startIdx);
  if (candidates.length > 0) {
    gallery.forEach((src, gi) => {
      const pos = Math.floor(((gi + 0.5) / gallery.length) * candidates.length);
      const idx = candidates[Math.min(pos, candidates.length - 1)];
      out[idx] = { src, side: gi % 2 === 0 ? "right" : "left" };
    });
  }
  return out;
}

// An older story's gallery moved onto its sections, for the editor.
export function withSectionImages(story) {
  const body = story?.body ?? [];
  if (body.some((b) => b?.image) || !(story?.gallery ?? []).length) return body;
  const images = storySectionImages(story);
  return body.map((b, i) => (images[i] ? { ...b, image: images[i].src } : b));
}
