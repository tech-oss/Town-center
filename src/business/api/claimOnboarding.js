import { supabase } from "../../lib/supabaseClient";

// Writes the plan and terms acceptance a claim never collected, and marks the
// claimer's business_users row as onboarded.
//
// Goes through the complete_claim_onboarding RPC rather than writing the two
// tables directly. Doing it client-side would need an UPDATE policy on
// business_users, which would also let someone set their own status to
// 'approved' and bypass admin entirely — and the plan's price would be coming
// from the browser. The function checks the caller really is this business's
// approved owner and derives the fee itself.
// See supabase/sql/business_dashboard_ux_2026_09.sql.
export async function completeClaimOnboarding(businessId, planKey) {
  const { error } = await supabase.rpc("complete_claim_onboarding", {
    target_business_id: businessId,
    target_plan: planKey,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
