import { mock } from "../client";

const SUBSCRIPTIONS = [
  { id: "s1", business: "Bloom Florist", owner: "Sarah Mitchell", tier: "Premium", status: "Active", startDate: "2025-09-12", renewal: "2026-09-12", monthlyFee: 79, paymentStatus: "Paid", history: [
    { date: "2026-06-12", event: "Payment received £79", type: "payment" },
    { date: "2026-03-12", event: "Upgraded from Standard to Premium", type: "upgrade" },
    { date: "2025-09-12", event: "Subscription started — Standard", type: "start" },
  ]},
  { id: "s2", business: "James's Kitchen", owner: "James Okafor", tier: "Standard", status: "Active", startDate: "2025-06-01", renewal: "2026-07-01", monthlyFee: 39, paymentStatus: "Paid", history: [
    { date: "2026-06-01", event: "Payment received £39", type: "payment" },
    { date: "2025-06-01", event: "Subscription started — Standard", type: "start" },
  ]},
  { id: "s3", business: "Maidenhead Gifts", owner: "Linda Forsythe", tier: "Basic", status: "Downgraded", startDate: "2024-08-01", renewal: "2026-07-08", monthlyFee: 0, paymentStatus: "Failed", history: [
    { date: "2026-01-08", event: "Payment failed — auto-downgraded to Basic", type: "downgrade" },
    { date: "2025-12-08", event: "Payment failed (1st attempt)", type: "warning" },
    { date: "2024-08-01", event: "Subscription started — Standard", type: "start" },
  ]},
  { id: "s4", business: "The Clubhouse", owner: "Patrick Dunn", tier: "Premium", status: "Active", startDate: "2025-01-07", renewal: "2027-01-07", monthlyFee: 79, paymentStatus: "Paid", history: [
    { date: "2026-01-07", event: "Annual payment received £948", type: "payment" },
    { date: "2025-01-07", event: "Subscription started — Premium (Annual)", type: "start" },
  ]},
  { id: "s5", business: "Spice Garden", owner: "Anita Sharma", tier: "Standard", status: "Trial", startDate: "2026-06-10", renewal: "2026-07-10", monthlyFee: 0, paymentStatus: "Trial", history: [
    { date: "2026-06-10", event: "30-day trial started", type: "start" },
  ]},
];

export function getSubscriptions({ status, tier } = {}) {
  let list = SUBSCRIPTIONS;
  if (status) list = list.filter((s) => s.status === status);
  if (tier) list = list.filter((s) => s.tier === tier);
  return mock(list);
}

export function getSubscriptionById(id) {
  return mock(SUBSCRIPTIONS.find((s) => s.id === id) ?? null);
}

export function grantTrial(id) {
  return mock({ id, status: "Trial", message: "30-day trial granted." });
}

export function resolveDispute(id) {
  return mock({ id, paymentStatus: "Paid", message: "Dispute resolved — subscription reinstated." });
}
