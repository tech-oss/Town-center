import { supabase } from "../../lib/supabaseClient";
import { resolveRange, eachDay } from "./analyticsRanges";

// A business's analytics, read through the database functions in
// supabase/sql/analytics_live_2026_09.sql. Views are recorded by the website
// and app (lib/trackView.js): one per visitor per item per UK day.
//
// Every series covers every day in the range (days with no views are 0), so
// charts and totals line up with the range picked.

const CONTENT_TYPES = ["news", "offer", "article", "event"];

// "YYYY-MM-DD" from a local-midnight Date's own calendar components — never
// toISOString, which shifts the day for anyone away from UTC.
function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function bounds(range) {
  const { from, to } = resolveRange(range);
  return { from, to, p_from: ymd(from), p_to: ymd(to) };
}

async function dailyViews(businessId, range, contentTypes, contentId = null) {
  const { from, to, p_from, p_to } = bounds(range);
  const { data, error } = await supabase.rpc("analytics_daily_views", {
    p_business_id: businessId,
    p_content_types: contentTypes,
    p_content_id: contentId,
    p_from,
    p_to,
  });
  if (error) throw error;
  const byDay = new Map((data ?? []).map((r) => [r.day, r]));
  const series = eachDay(from, to).map((date) => {
    const r = byDay.get(date);
    return { date, views: Number(r?.view_count ?? 0), web: Number(r?.web_count ?? 0), app: Number(r?.app_count ?? 0) };
  });
  return {
    total: series.reduce((s, p) => s + p.views, 0),
    web: series.reduce((s, p) => s + p.web, 0),
    app: series.reduce((s, p) => s + p.app, 0),
    series,
  };
}

// Views of the business's own page.
export function getProfileViewsSeries(businessId, range) {
  return dailyViews(businessId, range, ["profile"]);
}

// Views of its posts (news and offers) and events, combined.
export function getContentViewsSeries(businessId, range) {
  return dailyViews(businessId, range, CONTENT_TYPES);
}

// The post or event itself (title and type), from whichever table holds it.
async function getContentItem(businessId, contentId) {
  const [a, n, e] = await Promise.all([
    supabase.from("business_articles").select("title, type").eq("id", contentId).eq("business_id", businessId).maybeSingle(),
    supabase.from("news_offers").select("title, type").eq("id", contentId).eq("business_id", businessId).maybeSingle(),
    supabase.from("business_events").select("title").eq("id", contentId).eq("business_id", businessId).maybeSingle(),
  ]);
  if (a.data) return { title: a.data.title, type: a.data.type ?? "News" };
  if (n.data) return { title: n.data.title, type: n.data.type === "offer" ? "Offer" : "News" };
  if (e.data) return { title: e.data.title, type: "Event" };
  return null;
}

// One post's or event's own views, with the item's title and type.
export async function getContentSeries(businessId, contentId, range) {
  const [result, item] = await Promise.all([
    dailyViews(businessId, range, CONTENT_TYPES, contentId),
    getContentItem(businessId, contentId).catch(() => null),
  ]);
  return { ...result, item };
}

const TYPE_LABELS = { news: "News", offer: "Offer", article: "Article", event: "Event" };

// Views per post / event in the range, most viewed first.
export async function getContentBreakdown(businessId, range) {
  const { p_from, p_to } = bounds(range);
  const { data, error } = await supabase.rpc("analytics_content_breakdown", {
    p_business_id: businessId,
    p_from,
    p_to,
  });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.content_id,
    title: r.title,
    type: TYPE_LABELS[r.content_type] ?? r.content_type,
    views: Number(r.view_count),
  }));
}

// For the PDF report: every item's own series alongside the overall charts.
export async function getAllContentSeries(businessId, range) {
  const breakdown = await getContentBreakdown(businessId, range);
  return Promise.all(breakdown.map(async (c) => {
    const { total, series } = await getContentSeries(businessId, c.id, range);
    return { id: c.id, title: c.title, type: c.type, total, series };
  }));
}

// This calendar month so far vs the whole of last month, for dashboard cards.
export async function getMonthComparison(businessId, contentTypes) {
  const now = new Date();
  const thisFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastTo = new Date(now.getFullYear(), now.getMonth(), 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [cur, prev] = await Promise.all([
    dailyViews(businessId, { type: "custom", from: ymd(thisFrom), to: ymd(today) }, contentTypes),
    dailyViews(businessId, { type: "custom", from: ymd(lastFrom), to: ymd(lastTo) }, contentTypes),
  ]);
  const change = prev.total > 0 ? Math.round(((cur.total - prev.total) / prev.total) * 100) : null;
  return { thisMonth: cur.total, lastMonth: prev.total, change };
}

export const PROFILE_TYPES = ["profile"];
export const CONTENT_VIEW_TYPES = CONTENT_TYPES;
