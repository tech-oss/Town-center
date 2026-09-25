import { supabase } from "../../lib/supabaseClient";
import { logActivity } from "./businessActivity";
import { ADDON_KINDS } from "./addonSlots";

// A Content Manager asking the business owner to buy something. They can edit
// everything the business has paid for, but billing is the owner's — so this
// carries the request, with the package already chosen, to the owner's
// dashboard and bell.

// Reader-friendly names for everything that can be requested.
const HOMEPAGE_LABELS = {
  spotlight: "In the Spotlight (homepage)",
  featured_article: "Featured Article (homepage)",
  whats_on: "What's On (homepage)",
  featured_business: "Featured Business (homepage)",
};

export function requestLabel(r) {
  const addon = ADDON_KINDS[r.kind];
  if (addon) {
    const pack = addon.packs.find((p) => p.pack === r.pack);
    return pack ? `${pack.label} — ${pack.price}` : addon.label;
  }
  return HOMEPAGE_LABELS[r.kind] ?? r.kind;
}

// Where the owner goes to actually buy it.
//
// ?packages=1 opens the packages on arrival. Without it the owner lands on a
// page with the packages still collapsed behind a "Get more slots" button and
// has to go looking for the thing they have just agreed to buy — which
// defeats the point of the request carrying the package with it.
//
// Deliberately NOT "slots": these pages already use ?slots=success as the
// return from Stripe, and strip it on arrival.
export function requestDestination(r) {
  if (r.kind === "event") return "/business/events?packages=1";
  if (r.kind === "featured_article") return "/business/featured-articles?packages=1";
  if (r.kind === "article") return "/business/articles?packages=1";
  return "/business/billing";
}

function fromRow(r) {
  return {
    id: r.id,
    kind: r.kind,
    pack: r.pack,
    note: r.note ?? "",
    status: r.status,
    requestedName: r.requested_name ?? "A content manager",
    createdAt: r.created_at,
  };
}

export async function listPurchaseRequests(businessId, { status = "open" } = {}) {
  let q = supabase
    .from("business_purchase_requests")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function countOpenRequests(businessId) {
  const { count, error } = await supabase
    .from("business_purchase_requests")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("status", "open");
  if (error) return 0;
  return count ?? 0;
}

export async function raisePurchaseRequest(businessId, { kind, pack = null, note = "", requestedName }) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("business_purchase_requests")
    .insert({
      business_id: businessId,
      kind,
      pack,
      note: note.trim() || null,
      requested_by: user?.id ?? null,
      requested_name: requestedName ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  // Shows in the activity feed as well, so the owner has it in two places.
  await logActivity(businessId, {
    action: "purchase.requested",
    entityType: "purchase_request",
    entityId: data.id,
    title: requestLabel(fromRow(data)),
    detail: note.trim() || `Requested by ${requestedName ?? "a content manager"}.`,
  });
  return fromRow(data);
}

export async function resolvePurchaseRequest(id, status) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("business_purchase_requests")
    .update({ status, resolved_at: new Date().toISOString(), resolved_by: user?.id ?? null })
    .eq("id", id);
  if (error) throw error;
}
