import { supabase } from "../../lib/supabaseClient";
import { getCurrentAdmin } from "../../admin/hooks/useAdminAuth";

// Admin's half of the business dashboard's "Recent Activity" feed: every
// approval or rejection a business needs to see lands here, attributed to
// admin. The business's own edits are logged by the business dashboard
// (src/business/api/businessActivity.js on business-dashboard).
//
// See supabase/sql/business_activity.sql. A failed log must never take down
// the moderation action it was recording.
export async function logBusinessActivity(businessId, { action, entityType, entityId, title, detail } = {}) {
  if (!businessId || !action) return;
  const actor = getCurrentAdmin();
  const { error } = await supabase.from("business_activity").insert({
    business_id: businessId,
    action,
    entity_type: entityType ?? null,
    entity_id: entityId != null ? String(entityId) : null,
    title: title ?? null,
    detail: detail ?? null,
    actor: "admin",
    actor_name: actor?.name ?? null,
  });
  if (error) console.error("business_activity insert failed:", error.message);
}

// The moderation calls below are addressed by the item's id alone, so the
// business behind it has to be looked up before it can be logged.
export async function articleContext(id) {
  const { data } = await supabase.from("business_articles").select("business_id, title").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function eventContext(id) {
  const { data } = await supabase.from("business_events").select("business_id, title").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function occurrenceContext(id) {
  const { data } = await supabase
    .from("business_event_occurrences")
    .select("business_events(business_id, title)")
    .eq("id", id).maybeSingle();
  return data?.business_events ?? null;
}

export async function reviewContext(id) {
  const { data } = await supabase.from("business_reviews").select("business_id, reviewer").eq("id", id).maybeSingle();
  return data ? { business_id: data.business_id, title: data.reviewer } : null;
}
