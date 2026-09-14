// Whether a business_subscriptions row is actually paying.
//
// Admin can put a business on the Visibility Plan without it paying (a comp
// account). Only a plan backed by a Stripe subscription earns revenue, so
// reporting counts those as paying and shows the rest as admin-granted.

export function isPayingSubscription(s) {
  return !!s && s.plan === "premium" && !!s.stripe_subscription_id && !s.cancelled;
}

export function isAdminGrantedSubscription(s) {
  return !!s && s.plan === "premium" && !s.stripe_subscription_id;
}

// Revenue a row contributes per month: nothing unless it's paying.
export function monthlyRevenue(s) {
  return isPayingSubscription(s) ? Number(s.monthly_fee ?? 0) : 0;
}

// The plan split used on dashboards and reports.
export const PLAN_BUCKETS = {
  paying: "Visibility Plan (paying)",
  granted: "Visibility Plan (admin, not paying)",
  free: "Free",
};

export function planBucket(s) {
  if (isPayingSubscription(s)) return PLAN_BUCKETS.paying;
  if (isAdminGrantedSubscription(s)) return PLAN_BUCKETS.granted;
  return PLAN_BUCKETS.free;
}
