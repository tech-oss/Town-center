import { mock } from "../client";

export function getReportingSummary() {
  return mock({
    mrr: 1284,
    mrrChange: +12.4,
    activeSubscriptions: 18,
    subscriptionsChange: +2,
    pendingApprovals: 3,
    totalListings: 8,
    totalUsers: 10,
    newUsersThisMonth: 3,
  });
}

export function getRevenueByTier() {
  return mock([
    { tier: "Premium", revenue: 632, count: 4 },
    { tier: "Standard", revenue: 468, count: 8 },
    { tier: "Agent", revenue: 184, count: 4 },
    { tier: "Basic", revenue: 0, count: 2 },
  ]);
}

export function getSubscriptionTrend() {
  return mock([
    { month: "Jan", Premium: 3, Standard: 6, Agent: 3, Basic: 1 },
    { month: "Feb", Premium: 3, Standard: 6, Agent: 4, Basic: 1 },
    { month: "Mar", Premium: 4, Standard: 7, Agent: 4, Basic: 2 },
    { month: "Apr", Premium: 4, Standard: 7, Agent: 4, Basic: 2 },
    { month: "May", Premium: 4, Standard: 8, Agent: 4, Basic: 2 },
    { month: "Jun", Premium: 4, Standard: 8, Agent: 4, Basic: 2 },
  ]);
}

export function getActivityTrend() {
  return mock([
    { month: "Jan", logins: 82, listings: 6 },
    { month: "Feb", logins: 95, listings: 7 },
    { month: "Mar", logins: 110, listings: 8 },
    { month: "Apr", logins: 128, listings: 8 },
    { month: "May", logins: 144, listings: 9 },
    { month: "Jun", logins: 158, listings: 10 },
  ]);
}
