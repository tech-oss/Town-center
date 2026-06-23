import { mock } from "../client";

// ─── Base 12-month series (trailing, oldest → newest = current month) ─────────
const MONTHS = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const SUB_TREND_12 = [
  { month: "Jul", Premium: 2, Standard: 5, Agent: 2, Basic: 1 },
  { month: "Aug", Premium: 2, Standard: 5, Agent: 3, Basic: 1 },
  { month: "Sep", Premium: 3, Standard: 5, Agent: 3, Basic: 1 },
  { month: "Oct", Premium: 3, Standard: 6, Agent: 3, Basic: 1 },
  { month: "Nov", Premium: 3, Standard: 6, Agent: 3, Basic: 2 },
  { month: "Dec", Premium: 3, Standard: 6, Agent: 4, Basic: 2 },
  { month: "Jan", Premium: 3, Standard: 6, Agent: 3, Basic: 1 },
  { month: "Feb", Premium: 3, Standard: 6, Agent: 4, Basic: 1 },
  { month: "Mar", Premium: 4, Standard: 7, Agent: 4, Basic: 2 },
  { month: "Apr", Premium: 4, Standard: 7, Agent: 4, Basic: 2 },
  { month: "May", Premium: 4, Standard: 8, Agent: 4, Basic: 2 },
  { month: "Jun", Premium: 4, Standard: 8, Agent: 4, Basic: 2 },
];

const ACTIVITY_12 = [
  { month: "Jul", logins: 64, listings: 5, signups: 1 },
  { month: "Aug", logins: 71, listings: 5, signups: 1 },
  { month: "Sep", logins: 78, listings: 6, signups: 2 },
  { month: "Oct", logins: 86, listings: 6, signups: 1 },
  { month: "Nov", logins: 92, listings: 7, signups: 1 },
  { month: "Dec", logins: 88, listings: 7, signups: 0 },
  { month: "Jan", logins: 82, listings: 6, signups: 2 },
  { month: "Feb", logins: 95, listings: 7, signups: 1 },
  { month: "Mar", logins: 110, listings: 8, signups: 2 },
  { month: "Apr", logins: 128, listings: 8, signups: 1 },
  { month: "May", logins: 144, listings: 9, signups: 2 },
  { month: "Jun", logins: 158, listings: 10, signups: 3 },
];

const REVENUE_BY_TIER = [
  { tier: "Premium", revenue: 632, count: 4, fee: 79 },
  { tier: "Standard", revenue: 468, count: 8, fee: 39 },
  { tier: "Agent", revenue: 184, count: 4, fee: 46 },
  { tier: "Basic", revenue: 0, count: 2, fee: 0 },
];

// Listings split by status — for "Total Active Listings" KPI and breakdown.
const LISTINGS_BY_STATUS = { Active: 6, Pending: 1, Lapsed: 1 };

// How many trailing months each range represents.
const RANGE_MONTHS = { "30d": 1, "3m": 3, "6m": 6, "12m": 12 };

function sliceRange(arr, range) {
  const n = RANGE_MONTHS[range] ?? 6;
  return arr.slice(-n);
}

// ─── Summary KPIs (respond to range + tier) ───────────────────────────────────
export function getReportingSummary({ range = "6m", tier = "All" } = {}) {
  const tiers = tier === "All" ? REVENUE_BY_TIER : REVENUE_BY_TIER.filter((t) => t.tier === tier);
  const mrr = tiers.reduce((sum, t) => sum + t.revenue, 0);
  const accounts = tiers.reduce((sum, t) => sum + t.count, 0);
  const paying = tiers.filter((t) => t.fee > 0).reduce((sum, t) => sum + t.count, 0);

  const activitySlice = sliceRange(ACTIVITY_12, range);
  const newUsers = activitySlice.reduce((sum, m) => sum + m.signups, 0);
  const totalLogins = activitySlice.reduce((sum, m) => sum + m.logins, 0);

  const activeListings = LISTINGS_BY_STATUS.Active;
  const totalListings = Object.values(LISTINGS_BY_STATUS).reduce((a, b) => a + b, 0);

  return mock({
    mrr,
    mrrChange: +12.4,
    arpa: paying > 0 ? Math.round(mrr / paying) : 0,        // avg revenue per paying account
    activeSubscriptions: accounts,
    subscriptionsChange: +2,
    pendingApprovals: 3,
    activeListings,
    totalListings,
    listingsByStatus: LISTINGS_BY_STATUS,
    totalUsers: 10,
    newUsersThisMonth: ACTIVITY_12[ACTIVITY_12.length - 1].signups,
    newUsersInRange: newUsers,
    totalLoginsInRange: totalLogins,
    trialsActive: 1,
    churnRate: 4.8,        // %
    conversionRate: 62,    // % trial → paid
  });
}

export function getRevenueByTier({ tier = "All" } = {}) {
  const list = tier === "All" ? REVENUE_BY_TIER : REVENUE_BY_TIER.filter((t) => t.tier === tier);
  return mock(list.map(({ tier, revenue, count }) => ({ tier, revenue, count })));
}

export function getSubscriptionTrend({ range = "6m", tier = "All" } = {}) {
  let data = sliceRange(SUB_TREND_12, range);
  if (tier !== "All") {
    data = data.map((row) => ({ month: row.month, [tier]: row[tier] }));
  }
  return mock(data);
}

export function getActivityTrend({ range = "6m" } = {}) {
  return mock(sliceRange(ACTIVITY_12, range).map(({ month, logins, listings }) => ({ month, logins, listings })));
}

// Listings by section — extra breakdown for the admin.
export function getListingsBySection() {
  return mock([
    { section: "Eat & Drink", count: 3 },
    { section: "Shop", count: 2 },
    { section: "See & Do", count: 3 },
  ]);
}
