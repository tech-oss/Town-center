// Public-facing spotlight posts — what appears in the "In the Spotlight"
// section on the homepage. Driven by news/offers that admins have marked
// featuredOnHome: true. Importing from the admin layer intentionally:
// the same mock store is the single source of truth in mock mode.
export { getSpotlightPosts } from "./admin/newsOffers";
