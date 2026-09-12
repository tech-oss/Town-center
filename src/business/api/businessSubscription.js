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
    cancelled: row.cancelled,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: !!row.cancel_at_period_end,
    billingInterval: row.billing_interval,
    priceAmount: row.price_amount,
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

// There is deliberately no updateSubscription here any more. A business's
// plan is set by the stripe-webhook Edge Function once Stripe confirms
// payment (or by admin) — the database no longer lets the browser write it.
// See supabase/sql/stripe_billing_2026_09.sql.

export async function listPayments(businessId) {
  const { data, error } = await supabase
    .from("business_payments")
    .select("*")
    .eq("business_id", businessId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

