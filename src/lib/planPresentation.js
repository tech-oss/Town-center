import { isPremium, FREE_PLACEHOLDERS } from "../Data/plans";

// Whether a public listing is on the free plan. Live businesses carry their
// real plan; the static demo directory is shown in full, except the few demo
// entries that were already marked as free.
export function isFreeListing(item) {
  if (!item) return false;
  if (item.live) return !isPremium(item.plan);
  return !!item.freePlan;
}

export { FREE_PLACEHOLDERS };
