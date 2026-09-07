import { supabase } from "../../lib/supabaseClient";
import { resolveRange } from "../../lib/analyticsRanges";

// Admin's read side of a business's own analytics — same RPC contract as the
// business portal's businessAnalytics.js (supabase/sql/analytics_events.sql),
// just called with an admin session rather than the business owner's. The
// RPCs authorize either party, so this is the same data the business itself
// would see, not a separate admin-only view.
//
// Returns real zeros, not an error, until the write side (track-view Edge
// Function) exists and the public site/app actually calls it — there is
// currently nothing inserting into analytics_events at all.

function bounds(range) {
  const { from, to } = resolveRange(range);
  return { since: from.toISOString(), until: to.toISOString() };
}

function toSeries(rows) {
  const series = (rows ?? []).map((r) => ({ date: r.day, views: Number(r.view_count) }));
  const total = series.reduce((s, p) => s + p.views, 0);
  return { total, series };
}

export async function getProfileViewsSeries(businessId, range) {
  const { since, until } = bounds(range);
  const { data, error } = await supabase.rpc("get_daily_view_counts", {
    p_business_id: businessId,
    p_content_types: ["profile"],
    p_content_id: null,
    p_since: since,
    p_until: until,
  });
  if (error) throw error;
  return toSeries(data);
}

export async function getContentViewsSeries(businessId, range) {
  const { since, until } = bounds(range);
  const { data, error } = await supabase.rpc("get_daily_view_counts", {
    p_business_id: businessId,
    p_content_types: ["article", "news", "offer"],
    p_content_id: null,
    p_since: since,
    p_until: until,
  });
  if (error) throw error;
  return toSeries(data);
}

export async function getContentBreakdown(businessId, range) {
  const { since, until } = bounds(range);
  const { data, error } = await supabase.rpc("get_content_breakdown", {
    p_business_id: businessId,
    p_since: since,
    p_until: until,
  });
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.content_id, title: r.title, type: r.type, views: Number(r.view_count) }));
}
