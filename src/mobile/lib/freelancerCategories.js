import { FREELANCER_CATEGORIES } from "../../Data/taxonomy";

// Services categories that get the lighter, portfolio-first profile layout
// instead of the local-directory business profile tradespeople and
// professionals use.
//
// Derived from the canonical taxonomy rather than hand-listed — this set used
// to be kept in sync by hand and silently went stale whenever the Freelancer
// list changed, which meant new freelancer categories quietly fell back to the
// wrong profile layout.
export const FREELANCER_CATEGORIES_SET = new Set(FREELANCER_CATEGORIES.map((c) => c.value));

export { FREELANCER_CATEGORIES_SET as FREELANCER_CATEGORIES };
