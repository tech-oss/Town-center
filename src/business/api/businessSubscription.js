import { supabase } from "../../lib/supabaseClient";

// business_subscriptions / business_payments: plan/billing state. Scoped to
// persisting subscription state only — no real payment processing (Stripe).

function fromRow(row) {
  if (!row) return null;
  return {
    plan: row.plan,
    planStatus: row.plan_status,
    renewalDate: row.renewal_date,
    monthlyFee: row.monthly_fee,
    isMultiSite: row.is_multi_site,
    siteTierKey: row.site_tier_key,
    upgradePlanKey: row.upgrade_plan_key,
    termsAcceptedAt: row.terms_accepted_at,
  };
}

export async function getSubscription(businessId) {
  const { data, error } = await supabase
    .from("business_subscriptions")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw error;
  return fromRow(data);
}

export async function updateSubscription(businessId, patch) {
  const { error } = await supabase
    .from("business_subscriptions")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("business_id", businessId);
  if (error) throw error;
}

export async function listPayments(businessId) {
  const { data, error } = await supabase
    .from("business_payments")
    .select("*")
    .eq("business_id", businessId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addPayment(businessId, { description, amount, status = "Paid" }) {
  const { error } = await supabase
    .from("business_payments")
    .insert({ business_id: businessId, description, amount, status });
  if (error) throw error;
}
