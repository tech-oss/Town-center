// Dummy analytics data — AnalyticsPage.jsx, ContentAnalyticsDetailPage.jsx
// and AnalyticsReportPage.jsx call this instead of businessAnalytics.js
// until real tracking events exist on the live site/app. Same function
// names and return shapes as businessAnalytics.js, so swapping the import
// later is the only change needed to go live.
//
// Numbers are deterministic (seeded off businessId + range + a content key)
// rather than Math.random() on every render, so the chart doesn't visibly
// jump around each time a business owner reopens the page or re-selects the
// same range.
import { resolveRange, eachDay } from "./analyticsRanges";

function rangeSeed(range) {
  return range?.type === "custom" ? `custom-${range.from}-${range.to}` : `preset-${range?.key ?? "30d"}`;
}

// Small deterministic PRNG (mulberry32) seeded from a string, so the same
// (businessId, content, range) combination always renders the same chart.
function seededRandom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function next() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function buildSeries(seedKey, from, to, dailyAverage) {
  const rand = seededRandom(seedKey);
  return eachDay(from, to).map((date) => {
    // Parse the "YYYY-MM-DD" by hand (not `new Date(date)`, which reads it
    // as UTC and can roll .getDay() back a day in timezones ahead of UTC).
    const [y, m, dNum] = date.split("-").map(Number);
    const d = new Date(y, m - 1, dNum);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const weekendFactor = isWeekend ? 0.75 : 1.05;
    const noise = 0.7 + rand() * 0.6; // ±30% day-to-day variation
    const views = Math.max(0, Math.round(dailyAverage * weekendFactor * noise));
    return { date, views };
  });
}

function seriesAndTotal(seedKey, range, dailyAverage) {
  const { from, to } = resolveRange(range);
  const series = buildSeries(seedKey, from, to, dailyAverage);
  const total = series.reduce((s, p) => s + p.views, 0);
  return { total, series };
}

export async function getProfileViewsSeries(businessId, range) {
  // ~2,481 views/30d in the "7 days | 30 days | 3 months | 12 months" example
  return seriesAndTotal(`${businessId}-profile-${rangeSeed(range)}`, range, 2481 / 30);
}

export async function getContentViewsSeries(businessId, range) {
  // ~4,832 views/30d combined across articles/news/offers in the example
  return seriesAndTotal(`${businessId}-content-${rangeSeed(range)}`, range, 4832 / 30);
}

// Fixed illustrative content list — matches the walkthrough example exactly
// at the 30-day range, scaled sensibly for other ranges.
const MOCK_CONTENT = [
  { id: "mock-1", title: "Summer menu launched", type: "Article", views30d: 1284 },
  { id: "mock-2", title: "New opening hours", type: "News", views30d: 842 },
  { id: "mock-3", title: "20% off lunch", type: "Offer", views30d: 723 },
  { id: "mock-4", title: "Meet our new chef", type: "Article", views30d: 491 },
];

function scaleFactorFor(range) {
  const { from, to } = resolveRange(range);
  const days = eachDay(from, to).length;
  return days / 30;
}

export async function getContentBreakdown(businessId, range) {
  const scale = scaleFactorFor(range);
  return MOCK_CONTENT.map((c) => {
    const rand = seededRandom(`${businessId}-${c.id}-${rangeSeed(range)}`);
    const jitter = 0.85 + rand() * 0.3; // ±15%
    return { id: c.id, title: c.title, type: c.type, views: Math.max(0, Math.round(c.views30d * scale * jitter)) };
  }).sort((a, b) => b.views - a.views);
}

export async function getContentSeries(businessId, contentId, range) {
  const item = MOCK_CONTENT.find((c) => c.id === contentId);
  const dailyAverage = (item?.views30d ?? 200) / 30;
  const result = seriesAndTotal(`${businessId}-${contentId}-${rangeSeed(range)}`, range, dailyAverage);
  return { ...result, item };
}

// Used by the PDF report only — every content item's own {total, series},
// so the export can include each news/offer/article's individual chart
// alongside the two overall ones.
export async function getAllContentSeries(businessId, range) {
  return Promise.all(MOCK_CONTENT.map(async (c) => {
    const { total, series } = await getContentSeries(businessId, c.id, range);
    return { id: c.id, title: c.title, type: c.type, total, series };
  }));
}
