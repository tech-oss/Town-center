// Shared between businessAnalytics.js (real) and businessAnalyticsMock.js
// (dummy data), so RangeSelector and the analytics pages don't need to care
// which one is currently wired in.
export const RANGE_OPTIONS = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "3m", label: "3 months", days: 90 },
  { key: "12m", label: "12 months", days: 365 },
];
