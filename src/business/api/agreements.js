import { supabase } from "../../lib/supabaseClient";
import { AGREEMENTS } from "../../Data/agreements";

// Records the four agreement acceptances for a business, each with the moment
// it was ticked. `accepted` is { [agreementKey]: ISO timestamp }.
// See supabase/sql/business_agreements_2026_10.sql.
export async function recordAgreements(businessId, email, context, accepted) {
  const items = AGREEMENTS.filter((a) => accepted?.[a.key]).map((a) => ({
    key: a.key, title: a.title, version: a.version, accepted_at: accepted[a.key],
  }));
  if (!items.length) return { ok: true };
  const { error } = await supabase.rpc("record_business_agreements", {
    p_business_id: businessId, p_email: email ?? null, p_context: context, p_items: items,
  });
  if (error) {
    console.warn("Agreements not recorded:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// The latest acceptance of each agreement for a business, newest first.
export async function listAgreements(businessId) {
  const { data, error } = await supabase
    .from("business_agreement_acceptances")
    .select("agreement_key, agreement_title, version, accepted_at, recorded_at, email, context")
    .eq("business_id", businessId)
    .order("recorded_at", { ascending: false });
  if (error) return [];
  const latest = new Map();
  for (const r of data ?? []) if (!latest.has(r.agreement_key)) latest.set(r.agreement_key, r);
  return AGREEMENTS.map((a) => ({ ...a, acceptance: latest.get(a.key) ?? null }));
}
