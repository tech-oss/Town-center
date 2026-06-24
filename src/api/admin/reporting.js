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

// ─── Daily revenue (last 30 days, trailing newest = today Jun 24) ─────────────
const DAILY_REVENUE_30 = [
  { date: "May 25", revenue: 38 }, { date: "May 26", revenue: 42 }, { date: "May 27", revenue: 39 },
  { date: "May 28", revenue: 55 }, { date: "May 29", revenue: 61 }, { date: "May 30", revenue: 48 },
  { date: "May 31", revenue: 52 }, { date: "Jun 1",  revenue: 79 }, { date: "Jun 2",  revenue: 84 },
  { date: "Jun 3",  revenue: 71 }, { date: "Jun 4",  revenue: 66 }, { date: "Jun 5",  revenue: 90 },
  { date: "Jun 6",  revenue: 95 }, { date: "Jun 7",  revenue: 88 }, { date: "Jun 8",  revenue: 102 },
  { date: "Jun 9",  revenue: 97 }, { date: "Jun 10", revenue: 110 }, { date: "Jun 11", revenue: 118 },
  { date: "Jun 12", revenue: 105 }, { date: "Jun 13", revenue: 99 }, { date: "Jun 14", revenue: 112 },
  { date: "Jun 15", revenue: 126 }, { date: "Jun 16", revenue: 134 }, { date: "Jun 17", revenue: 121 },
  { date: "Jun 18", revenue: 139 }, { date: "Jun 19", revenue: 148 }, { date: "Jun 20", revenue: 156 },
  { date: "Jun 21", revenue: 143 }, { date: "Jun 22", revenue: 161 }, { date: "Jun 23", revenue: 168 },
];

export function getRevenueTrend({ days = 30 } = {}) {
  const slice = DAILY_REVENUE_30.slice(-days);
  const total = slice.reduce((s, d) => s + d.revenue, 0);
  const prev = DAILY_REVENUE_30.slice(-days * 2, -days);
  const prevTotal = prev.reduce((s, d) => s + d.revenue, 0) || total;
  const change = Math.round(((total - prevTotal) / prevTotal) * 1000) / 10;
  return mock({ data: slice, total, change });
}

// ─── Daily business sign-ups by plan (last 30 days, cumulative totals) ────────
const DAILY_SIGNUPS_30 = [
  { date: "May 25", Free: 12, "Plan 1": 5, "Plan 2": 3, "Plan 3": 1 },
  { date: "May 26", Free: 13, "Plan 1": 5, "Plan 2": 3, "Plan 3": 1 },
  { date: "May 27", Free: 13, "Plan 1": 6, "Plan 2": 3, "Plan 3": 1 },
  { date: "May 28", Free: 14, "Plan 1": 6, "Plan 2": 4, "Plan 3": 1 },
  { date: "May 29", Free: 15, "Plan 1": 6, "Plan 2": 4, "Plan 3": 2 },
  { date: "May 30", Free: 15, "Plan 1": 7, "Plan 2": 4, "Plan 3": 2 },
  { date: "May 31", Free: 16, "Plan 1": 7, "Plan 2": 5, "Plan 3": 2 },
  { date: "Jun 1",  Free: 17, "Plan 1": 8, "Plan 2": 5, "Plan 3": 2 },
  { date: "Jun 2",  Free: 18, "Plan 1": 8, "Plan 2": 5, "Plan 3": 2 },
  { date: "Jun 3",  Free: 18, "Plan 1": 8, "Plan 2": 6, "Plan 3": 3 },
  { date: "Jun 4",  Free: 19, "Plan 1": 9, "Plan 2": 6, "Plan 3": 3 },
  { date: "Jun 5",  Free: 20, "Plan 1": 9, "Plan 2": 6, "Plan 3": 3 },
  { date: "Jun 6",  Free: 21, "Plan 1": 10, "Plan 2": 7, "Plan 3": 3 },
  { date: "Jun 7",  Free: 22, "Plan 1": 10, "Plan 2": 7, "Plan 3": 4 },
  { date: "Jun 8",  Free: 23, "Plan 1": 11, "Plan 2": 7, "Plan 3": 4 },
  { date: "Jun 9",  Free: 24, "Plan 1": 11, "Plan 2": 8, "Plan 3": 4 },
  { date: "Jun 10", Free: 25, "Plan 1": 12, "Plan 2": 8, "Plan 3": 4 },
  { date: "Jun 11", Free: 26, "Plan 1": 12, "Plan 2": 9, "Plan 3": 5 },
  { date: "Jun 12", Free: 27, "Plan 1": 13, "Plan 2": 9, "Plan 3": 5 },
  { date: "Jun 13", Free: 28, "Plan 1": 13, "Plan 2": 9, "Plan 3": 5 },
  { date: "Jun 14", Free: 29, "Plan 1": 14, "Plan 2": 10, "Plan 3": 5 },
  { date: "Jun 15", Free: 30, "Plan 1": 14, "Plan 2": 10, "Plan 3": 6 },
  { date: "Jun 16", Free: 31, "Plan 1": 15, "Plan 2": 11, "Plan 3": 6 },
  { date: "Jun 17", Free: 32, "Plan 1": 15, "Plan 2": 11, "Plan 3": 6 },
  { date: "Jun 18", Free: 33, "Plan 1": 16, "Plan 2": 12, "Plan 3": 7 },
  { date: "Jun 19", Free: 34, "Plan 1": 17, "Plan 2": 12, "Plan 3": 7 },
  { date: "Jun 20", Free: 36, "Plan 1": 17, "Plan 2": 13, "Plan 3": 7 },
  { date: "Jun 21", Free: 37, "Plan 1": 18, "Plan 2": 13, "Plan 3": 8 },
  { date: "Jun 22", Free: 38, "Plan 1": 18, "Plan 2": 14, "Plan 3": 8 },
  { date: "Jun 23", Free: 40, "Plan 1": 19, "Plan 2": 14, "Plan 3": 8 },
];

export function getSignupTrend({ days = 30 } = {}) {
  return mock(DAILY_SIGNUPS_30.slice(-days));
}

// ─── Top performing categories ────────────────────────────────────────────────
export function getTopCategories() {
  const data = [
    { category: "Eat & Drink",       icon: "🍽", count: 18, colour: "#2D6A4F" },
    { category: "Shopping",          icon: "🛍", count: 14, colour: "#1B4332" },
    { category: "Fitness & Wellbeing", icon: "💪", count: 10, colour: "#52B788" },
    { category: "Health & Services", icon: "🏥", count: 8,  colour: "#E8A33D" },
    { category: "Arts & Culture",    icon: "🎭", count: 5,  colour: "#74C69D" },
  ];
  const total = data.reduce((s, d) => s + d.count, 0);
  return mock(data.map((d) => ({ ...d, pct: Math.round((d.count / total) * 100) })));
}

// ─── Plan distribution (all-time) ─────────────────────────────────────────────
export function getPlanDistribution() {
  const data = [
    { plan: "Free",    count: 18, colour: "#52B788" },
    { plan: "Basic",   count: 8,  colour: "#2D6A4F" },
    { plan: "Plan 1",  count: 19, colour: "#1B4332" },
    { plan: "Plan 2",  count: 14, colour: "#E8A33D" },
  ];
  const total = data.reduce((s, d) => s + d.count, 0);
  return mock(data.map((d) => ({ ...d, pct: Math.round((d.count / total) * 100) })));
}

// Listings by section — extra breakdown for the admin.
export function getListingsBySection() {
  return mock([
    { section: "Eat & Drink", count: 3 },
    { section: "Shop", count: 2 },
    { section: "See & Do", count: 3 },
  ]);
}
