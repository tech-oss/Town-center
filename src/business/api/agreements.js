import { supabase } from "../../lib/supabaseClient";

// The legal documents a business accepts — Business Terms & Conditions,
// Business Data Responsibility Agreement, Cancellation & Refund Policy, and
// any admin adds later — each in its current version. Admin manages them
// (site admin → Legal Documents); every version is kept, and an acceptance
// records the exact version. See supabase/sql/legal_documents_2026_10.sql on
// the admin-panel branch.
//
// In the forms, `accepted` is { [versionId]: ISO time ticked }.

function docFromRow(v) {
  return {
    versionId: v.id,
    key: v.document_key,
    name: v.legal_documents?.name ?? v.document_key,
    version: v.version,
    effectiveDate: v.effective_date,
    fileUrl: v.file_url,
    sortOrder: v.legal_documents?.sort_order ?? 0,
  };
}

// The current version of every document a business has to accept, in order.
export async function getCurrentDocuments() {
  const { data, error } = await supabase
    .from("legal_document_versions")
    .select("id, document_key, version, effective_date, file_url, legal_documents!inner(name, sort_order, active, requires_acceptance)")
    .eq("is_current", true)
    .eq("legal_documents.active", true)
    .eq("legal_documents.requires_acceptance", true);
  if (error) throw error;
  return (data ?? []).map(docFromRow).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export const allAgreed = (documents, accepted) =>
  !!documents?.length && documents.every((d) => !!accepted?.[d.versionId]);

// Records the acceptances for a business — each the exact version, with the
// moment it was ticked. The database copies name and version itself and
// refuses anything but a current version.
export async function recordAgreements(businessId, email, context, accepted) {
  const items = Object.entries(accepted ?? {}).map(([versionId, at]) => ({ version_id: versionId, accepted_at: at }));
  if (!items.length) return { ok: true };
  const { error } = await supabase.rpc("legal_record_acceptances", {
    p_business_id: businessId, p_email: email ?? null, p_context: context, p_items: items,
  });
  if (error) {
    console.warn("Agreements not recorded:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// The current versions this business has not accepted yet ("Updated Terms
// Require Acceptance"), with the version it accepted before, if any.
export async function getOutstandingDocuments(businessId) {
  const { data, error } = await supabase.rpc("legal_documents_outstanding", { p_business_id: businessId });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    versionId: r.version_id,
    key: r.document_key,
    name: r.name,
    version: r.version,
    effectiveDate: r.effective_date,
    fileUrl: r.file_url,
    previousVersion: r.previously_accepted ?? null,
  }));
}

// Each current document with this business's acceptance of its current
// version (null when it hasn't accepted that version).
export async function listAgreements(businessId) {
  const [documents, { data, error }] = await Promise.all([
    getCurrentDocuments().catch(() => []),
    supabase
      .from("business_agreement_acceptances")
      .select("agreement_key, agreement_title, version, version_id, accepted_at, recorded_at, email, context")
      .eq("business_id", businessId)
      .order("recorded_at", { ascending: false }),
  ]);
  const rows = error ? [] : (data ?? []);
  return documents.map((d) => ({ ...d, acceptance: rows.find((r) => r.version_id === d.versionId) ?? null }));
}

// "9 Oct 2026, 14:35"
export const formatAcceptedAt = (iso) => (iso
  ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  : "");

// "28/09/2026"
export const formatEffective = (ymd) => (ymd ? String(ymd).slice(0, 10).split("-").reverse().join("/") : "");
