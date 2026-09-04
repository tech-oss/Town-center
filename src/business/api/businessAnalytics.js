import { supabase } from "../../lib/supabaseClient";

// Real Supabase-backed analytics queries — reads from analytics_events via
// the RPC functions in supabase/sql/analytics_events.sql (not run yet) and
// populated by supabase/functions/track-view (not deployed yet).
//
// NOT CURRENTLY USED — AnalyticsPage.jsx and ContentAnalyticsDetailPage.jsx
// call businessAnalyticsMock.js instead, since no real tracking events exist
// on the live site/app yet. Once trackView() is wired up on the public
// site/app and events are flowing, swap those two pages' import from
// "./businessAnalyticsMock" to "./businessAnalytics" — same function names,
// same return shapes, nothing else changes.

import { RANGE_OPTIONS } from "./analyticsRanges";
export { RANGE_OPTIONS };

function sinceFor(range) {
  const days = RANGE_OPTIONS.find((r) => r.key === range)?.days ?? 30;
  return new Date(Date.now() - days * 86400000).toISOString();
}

function toSeries(rows) {
  const series = (rows ?? []).map((r) => ({ date: r.day, views: Number(r.view_count) }));
  const total = series.reduce((s, p) => s + p.views, 0);
  return { total, series };
}

export async function getProfileViewsSeries(businessId, range) {
  const { data, error } = await supabase.rpc("get_daily_view_counts", {
    p_business_id: businessId,
    p_content_types: ["profile"],
    p_content_id: null,
    p_since: sinceFor(range),
  });
  if (error) throw error;
  return toSeries(data);
}

export async function getContentViewsSeries(businessId, range) {
  const { data, error } = await supabase.rpc("get_daily_view_counts", {
    p_business_id: businessId,
    p_content_types: ["article", "news", "offer"],
    p_content_id: null,
    p_since: sinceFor(range),
  });
  if (error) throw error;
  return toSeries(data);
}

export async function getContentBreakdown(businessId, range) {
  const { data, error } = await supabase.rpc("get_content_breakdown", {
    p_business_id: businessId,
    p_since: sinceFor(range),
  });
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.content_id, title: r.title, type: r.type, views: Number(r.view_count) }));
}

export async function getContentSeries(businessId, contentId, range) {
  const { data, error } = await supabase.rpc("get_daily_view_counts", {
    p_business_id: businessId,
    p_content_types: ["article", "news", "offer"],
    p_content_id: contentId,
    p_since: sinceFor(range),
  });
  if (error) throw error;
  return toSeries(data);
}
