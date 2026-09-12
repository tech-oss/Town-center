import { supabase } from "../../lib/supabaseClient";

// Subscriptions are business_subscriptions rows, one per business. Payments are
// not yet taken through Stripe, so `history` is assembled from the few dates the
// row actually carries rather than a real ledger — the payment timeline fills in
// once billing is wired up.

const PLAN_LABELS = { free: "Free", basic: "Basic", standard: "Standard", premium: "Visibility Plan", agent: "Agent" };

function label(plan) {
  if (!plan) return "Basic";
  return PLAN_LABELS[String(plan).toLowerCase()] ?? plan;
}

function fromRow(row, owner) {
  const tier = label(row.plan);
  const history = [];
  if (row.terms_accepted_at) {
    history.push({
      date: row.terms_accepted_at.slice(0, 10),
      event: `Subscription started — ${tier}`,
      type: "start",
    });
  }
  if (row.cancelled) {
    history.push({ date: (row.updated_at ?? "").slice(0, 10), event: "Subscription cancelled", type: "warning" });
  }

  return {
    id: row.business_id,
    business: row.businesses?.name ?? row.business_id,
    owner: owner ? [owner.first_name, owner.last_name].filter(Boolean).join(" ") || owner.email : "—",
    tier,
    status: row.cancelled ? "Lapsed" : (row.plan_status ?? "Active"),
    startDate: (row.terms_accepted_at ?? "").slice(0, 10),
    renewal: row.renewal_date ?? "",
    monthlyFee: row.monthly_fee ?? 0,
    // No payment provider yet, so nothing can report a real payment state.
    paymentStatus: row.monthly_fee > 0 ? "Paid" : "Trial",
    isMultiSite: row.is_multi_site,
    upgradePlanKey: row.upgrade_plan_key,
    // 'trial' | 'full' | null — set only by grantTrial/grantFullAccess below,
    // so a comp account admin granted can be told apart from a real paid one.
    grantedByAdmin: row.granted_by_admin ?? null,
    grantedAt: row.granted_at ? row.granted_at.slice(0, 10) : null,
    history,
  };
}

export function grantedLabel(grantedByAdmin) {
  if (grantedByAdmin === "trial") return "30 Day Trial";
  if (grantedByAdmin === "full") return "Unlimited Access";
  return null;
}

// business_subscriptions and business_users share `businesses` as a parent but
// have no FK to each other, so owners are joined here rather than embedded.
async function ownersByBusiness(ids) {
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from("business_users")
    .select("business_id, role, first_name, last_name, email")
    .in("business_id", ids);
  if (error) throw error;
  const map = {};
  for (const u of data ?? []) {
    if (!map[u.business_id] || u.role === "Owner") map[u.business_id] = u;
  }
  return map;
}

export async function getSubscriptions({ status, tier } = {}) {
  const { data, error } = await supabase
    .from("business_subscriptions")
    .select("*, businesses(name)")
    .order("updated_at", { ascending: false });
  if (error) throw error;

  const owners = await ownersByBusiness((data ?? []).map((r) => r.business_id));
  let list = (data ?? []).map((r) => fromRow(r, owners[r.business_id]));
  if (status) list = list.filter((s) => s.status === status);
  if (tier) list = list.filter((s) => s.tier === tier);
  return list;
}

export async function getSubscriptionById(id) {
  const { data, error } = await supabase
    .from("business_subscriptions")
    .select("*, businesses(name)")
    .eq("business_id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const owners = await ownersByBusiness([id]);
  return fromRow(data, owners[id]);
}

export async function grantTrial(id) {
  const now = new Date();
  const renewal = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);
  const { error } = await supabase
    .from("business_subscriptions")
    .update({
      plan_status: "Trial", monthly_fee: 0, renewal_date: renewal, cancelled: false,
      granted_by_admin: "trial", granted_at: now.toISOString(),
    })
    .eq("business_id", id);
  if (error) throw error;
  return { id, status: "Trial", message: "30-day trial granted." };
}

// Admin override: unlock every paid feature for a business without going
// through billing — a comp account. Sets the top plan at zero cost rather than
// adding a separate "unlocked" flag, so every feature-gate already keyed off
// `plan`/`planStatus` throughout the business portal picks it up for free.
// There's no renewal — granted_by_admin: "full" is what tells the UI to stop
// showing a renewal/end date that doesn't apply.
export async function grantFullAccess(id) {
  const { error } = await supabase
    .from("business_subscriptions")
    .update({
      plan: "premium", plan_status: "Active", monthly_fee: 0, cancelled: false,
      granted_by_admin: "full", granted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", id);
  if (error) throw error;
  return { ok: true };
}

export async function resolveDispute(id) {
  const { error } = await supabase
    .from("business_subscriptions")
    .update({ plan_status: "Active", cancelled: false })
    .eq("business_id", id);
  if (error) throw error;
  return { id, paymentStatus: "Paid", message: "Dispute resolved — subscription reinstated." };
}
