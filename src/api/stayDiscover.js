import { loadLiveBusinesses } from "./liveBusinesses";
import { getGuides } from "./guides";

// "Stay Here & Discover" — a few nearby things to do, shown at the bottom of
// every Live & Stay detail page: somewhere to eat, something to do, and a
// guide to read.
//
// This used to be a module constant in Data/stayDiscover.js built from three
// hardcoded slugs looked up in the old Data/pages.js: "coppa-club",
// "maidenhead-heritage-walk" and a guide. Two of those three no longer exist
// there — businesses moved into the database — and the builder ended with
// .filter(Boolean), so both silently dropped out and the section rendered a
// single card. Reading live data means it can't rot that way again: if a
// business is unpublished, the next one takes its place.

const PICK = [
  { section: "eat-drink", tag: "Eat & Drink" },
  { section: "see-do", tag: "See & Do" },
];

// Something worth clicking: a real picture and a description, preferring a
// subscriber (a free listing's page withholds most of what a guest would
// come for). Falls back to any live business in the section rather than
// showing nothing.
function pickBusiness(businesses, section) {
  const inSection = businesses.filter((b) => b.section === section);
  return (
    inSection.find((b) => b.plan === "premium" && b.hasHero && b.description) ??
    inSection.find((b) => b.hasHero) ??
    inSection[0] ??
    null
  );
}

export async function getStayDiscover() {
  const [businesses, guides] = await Promise.all([
    loadLiveBusinesses().catch(() => []),
    getGuides().catch(() => []),
  ]);

  const out = [];
  for (const { section, tag } of PICK) {
    const b = pickBusiness(businesses, section);
    if (!b) continue;
    out.push({
      slug: b.slug,
      to: `/${b.section}/place/${b.slug}`,
      mobileTo: `/mobile/place/${b.slug}`,
      image: b.image,
      tag,
      name: b.name,
      blurb: b.description ?? b.tagline ?? "",
      // The first line of the address, which the app's cards show and the
      // website's did not.
      address: (b.address ?? "").split(",")[0] || null,
    });
  }

  const guide = guides[0];
  if (guide) {
    out.push({
      slug: guide.slug,
      to: `/guides/${guide.slug}`,
      mobileTo: `/mobile/guides/${guide.slug}`,
      image: guide.cardImage || guide.heroImage,
      tag: "Neighbourhood Guide",
      name: guide.title,
      blurb: guide.summary ?? "",
      address: null,
    });
  }

  return out;
}
