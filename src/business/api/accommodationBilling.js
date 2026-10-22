import { supabase } from "../../lib/supabaseClient";
import { getSubscription } from "./businessSubscription";

// An accommodation company's plan, through the accommodation-billing Edge
// Function. Payment happens on Stripe's own pages; the plan itself only
// changes when Stripe confirms it to stripe-webhook, which then applies the
// property limit (accommodation_after_plan_change). Nothing here writes a
// plan.

async function billing(action, body) {
  const { data, error } = await supabase.functions.invoke("accommodation-billing", { body: { action, ...body } });
  if (error) {
    let message = error.message;
    try { message = (await error.context?.json())?.error ?? message; } catch { /* keep generic */ }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data ?? {};
}

// Free → paid: off to Stripe Checkout.
export async function startAccommodationCheckout(businessId, tier, interval) {
  const { url } = await billing("checkout", { businessId, tier, interval });
  if (!url) throw new Error("Stripe didn't return a page to open.");
  window.location.assign(url);
}

// Between paid tiers. More properties: now (Stripe charges the difference).
// Fewer, or a different billing interval: at the end of the period, keeping
// `keep`. Returns { effective: "now" | "period_end", effectiveAt }.
export const changeAccommodationPlan = (businessId, tier, interval, keep) =>
  billing("change", { businessId, tier, interval, keep });

// Back to Free at the end of the period, keeping one property.
export const cancelAccommodationPlan = (businessId, keep) =>
  billing("cancel", { businessId, keep });

// Undo a scheduled downgrade or cancellation.
export const undoAccommodationChange = (businessId) =>
  billing("undo", { businessId });

// The downgrade or cancellation waiting for the end of the period, if any.
export async function getPlanChange(companyId) {
  const { data, error } = await supabase
    .from("accommodation_plan_changes")
    .select("*")
    .eq("business_id", companyId)
    .maybeSingle();
  if (error) throw error;
  return data ? {
    change: data.change,
    targetTier: data.target_tier,
    targetInterval: data.target_interval,
    keep: data.keep ?? [],
    // The live articles chosen to stay (null until chosen).
    keepArticles: data.keep_articles ?? null,
    effectiveAt: data.effective_at,
  } : null;
}

// The live articles a scheduled change will allow: the new plan's included
// articles plus extras bought (none on Free).
export async function getTargetArticleAllowance(companyId, change) {
  if (!change) return null;
  const { data, error } = await supabase.rpc("accommodation_target_article_allowance", {
    p_company: companyId, p_tier: change.targetTier, p_change: change.change,
  });
  if (error) throw error;
  return data ?? 0;
}

// The owner's choice of which live articles stay live after the change.
export async function setPlanChangeArticles(companyId, articleIds) {
  const { error } = await supabase.rpc("accommodation_set_plan_change_articles", { p_company: companyId, p_articles: articleIds });
  if (error) throw error;
}

export async function setPlanChangeKeep(companyId, keep) {
  const { error } = await supabase.rpc("accommodation_set_plan_change_keep", { p_company: companyId, p_keep: keep });
  if (error) throw error;
}

// After a change or checkout the webhook usually lands within seconds.
// Polls until the subscription satisfies `done`, or gives up.
export async function waitForSubscription(businessId, done, { timeoutMs = 30000, intervalMs = 2000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const sub = await getSubscription(businessId);
    if (sub && done(sub)) return sub;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return null;
}

// ── Featured Business slots → which property they show ─────────────────────

export async function listFeaturedSlots(companyId) {
  const { data, error } = await supabase
    .from("homepage_placements")
    .select("id, status, content_id, starts_at, ends_at")
    .eq("business_id", companyId)
    .eq("slot_type", "featured_business")
    // Bought or given by Maidenhead admin (which has no payment) — anything
    // but a checkout still in progress or a booking that's gone.
    .not("status", "in", "(held,cancelled,bumped)")
    .gt("ends_at", new Date().toISOString())
    .order("starts_at");
  if (error) throw error;
  return (data ?? []).map((p) => ({ id: p.id, status: p.status, propertyId: p.content_id, startsAt: p.starts_at, endsAt: p.ends_at }));
}

export async function assignFeaturedProperty(placementId, propertyId) {
  const { error } = await supabase.rpc("accommodation_assign_featured_property", { p_placement: placementId, p_property: propertyId });
  if (error) throw error;
}
