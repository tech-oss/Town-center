import { itemBySlug } from "./pages";
import { guides, getGuideBySlug } from "./guides";

// "Stay Here & Discover" — a fixed set of nearby things to do, curated
// rather than auto-related to the specific hotel/accommodation, so a guest
// on any Live & Stay detail page gets pointed at real, worthwhile parts of
// the town (a place to eat, something to do, a guide to read) instead of
// just a list of other places to sleep.
const EAT_DRINK_SLUG = "coppa-club";
const SEE_DO_SLUG = "maidenhead-heritage-walk";
const GUIDE_SLUG = "where-to-have-breakfast-in-maidenhead";

function buildDiscoverList() {
  const eatDrink = itemBySlug[EAT_DRINK_SLUG];
  const seeDo = itemBySlug[SEE_DO_SLUG];
  const guide = getGuideBySlug(GUIDE_SLUG) ?? guides[0];

  return [
    eatDrink && {
      slug: eatDrink.slug,
      to: `/eat-drink/place/${eatDrink.slug}`,
      mobileTo: `/mobile/place/${eatDrink.slug}`,
      image: eatDrink.image,
      tag: "Eat & Drink",
      name: eatDrink.name,
      blurb: eatDrink.description,
    },
    seeDo && {
      slug: seeDo.slug,
      to: `/see-do/place/${seeDo.slug}`,
      mobileTo: `/mobile/place/${seeDo.slug}`,
      image: seeDo.image,
      tag: "See & Do",
      name: seeDo.name,
      blurb: seeDo.description,
    },
    guide && {
      slug: guide.slug,
      to: `/guides/${guide.slug}`,
      mobileTo: `/mobile/guides/${guide.slug}`,
      image: guide.cardImage,
      tag: "Neighbourhood Guide",
      name: guide.title,
      blurb: guide.summary,
    },
  ].filter(Boolean);
}

export const STAY_DISCOVER = buildDiscoverList();
