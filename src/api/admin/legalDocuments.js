import { supabase } from "../../lib/supabaseClient";

// Legal documents businesses accept, every version kept
// (supabase/sql/legal_documents_2026_10.sql). Admin uploads a new PDF as a
// new version and makes it current; businesses that haven't accepted the
// current version are asked to before they can use their dashboard.

const BUCKET = "legal-documents";

function versionFromRow(v, counts) {
  return {
    id: v.id,
    documentKey: v.document_key,
    version: v.version,
    effectiveDate: v.effective_date,
    fileUrl: v.file_url,
    fileName: v.file_name,
    isCurrent: v.is_current,
    createdAt: v.created_at,
    acceptances: counts.get(v.id) ?? 0,
  };
}

// Every document with all its versions (newest first) and how many
// businesses accepted each.
export async function getLegalDocuments() {
  const [{ data: docs, error }, { data: versions, error: vError }, { data: acc, error: aError }] = await Promise.all([
    supabase.from("legal_documents").select("*").order("sort_order").order("name"),
    supabase.from("legal_document_versions").select("*").order("created_at", { ascending: false }),
    supabase.from("business_agreement_acceptances").select("version_id").not("version_id", "is", null),
  ]);
  if (error) throw error;
  if (vError) throw vError;
  if (aError) throw aError;
  const counts = new Map();
  for (const a of acc ?? []) counts.set(a.version_id, (counts.get(a.version_id) ?? 0) + 1);
  return (docs ?? []).map((d) => {
    const list = (versions ?? []).filter((v) => v.document_key === d.key).map((v) => versionFromRow(v, counts));
    return {
      key: d.key,
      name: d.name,
      description: d.description ?? "",
      requiresAcceptance: d.requires_acceptance,
      active: d.active,
      sortOrder: d.sort_order,
      versions: list,
      current: list.find((v) => v.isCurrent) ?? null,
    };
  });
}

const slugify = (s) => String(s ?? "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// A new kind of document (it gets its first version separately).
export async function createLegalDocument({ name, requiresAcceptance = true, description = "" }) {
  const key = slugify(name);
  if (!key) throw new Error("Give the document a name.");
  const { data: last } = await supabase.from("legal_documents").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("legal_documents").insert({
    key, name: name.trim(), description: description || null, requires_acceptance: requiresAcceptance,
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  if (error) {
    if (/duplicate key/i.test(error.message)) throw new Error("There is already a document with that name.");
    throw error;
  }
  return key;
}

export async function updateLegalDocument(key, { name, requiresAcceptance, active }) {
  const patch = {};
  if (name !== undefined) patch.name = name.trim();
  if (requiresAcceptance !== undefined) patch.requires_acceptance = requiresAcceptance;
  if (active !== undefined) patch.active = active;
  const { error } = await supabase.from("legal_documents").update(patch).eq("key", key);
  if (error) throw error;
}

// Uploads a PDF as a new version. Never replaces an earlier version: the file
// goes to its own path and the version is a new row. `makeCurrent` makes it
// the version businesses must accept.
export async function addLegalDocumentVersion({ documentKey, version, effectiveDate, file, makeCurrent }) {
  const v = String(version ?? "").trim();
  if (!v) throw new Error("Enter the version number.");
  if (!effectiveDate) throw new Error("Enter the effective date.");
  if (!file) throw new Error("Choose the PDF.");
  if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) throw new Error("The file must be a PDF.");
  if (file.size > 20 * 1024 * 1024) throw new Error("The PDF must be 20 MB or smaller.");

  const path = `${documentKey}/v${slugify(v) || "version"}-${Date.now()}.pdf`;
  const { error: upError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: "application/pdf", upsert: false });
  if (upError) throw upError;
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data, error } = await supabase.from("legal_document_versions").insert({
    document_key: documentKey, version: v, effective_date: effectiveDate,
    file_url: pub.publicUrl, file_name: file.name, is_current: false,
  }).select().single();
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
    if (/duplicate key/i.test(error.message)) throw new Error(`Version ${v} of this document already exists — use a new version number.`);
    throw error;
  }
  if (makeCurrent) await setCurrentLegalVersion(data.id);
  return data.id;
}

export async function setCurrentLegalVersion(versionId) {
  const { error } = await supabase.rpc("legal_set_current_version", { p_version_id: versionId });
  if (error) throw error;
}

// Every business account and whether (and when) it accepted this version.
export async function getVersionAcceptance(versionId) {
  const { data, error } = await supabase.rpc("legal_version_acceptance_report", { p_version_id: versionId });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    businessId: r.business_id,
    businessName: r.business_name,
    ownerEmail: r.owner_email,
    acceptedAt: r.accepted_at,
    acceptedBy: r.accepted_by,
    previousVersion: r.previous_version,
  }));
}

// Businesses marked "Updated Terms Require Acceptance": business id → the
// names of the documents it still has to accept.
export async function getBusinessesRequiringAcceptance() {
  const { data, error } = await supabase.rpc("legal_businesses_requiring_acceptance");
  if (error) throw error;
  return new Map((data ?? []).map((r) => [r.business_id, r.outstanding ?? []]));
}

// One business's acceptances: for each current document, its acceptance of
// the current version (or null), plus every acceptance it has ever made.
export async function getBusinessLegalAcceptances(businessId) {
  const [docs, { data, error }] = await Promise.all([
    getLegalDocuments(),
    supabase.from("business_agreement_acceptances")
      .select("agreement_key, agreement_title, version, version_id, accepted_at, recorded_at, email, context")
      .eq("business_id", businessId)
      .order("recorded_at", { ascending: false }),
  ]);
  if (error) throw error;
  const rows = data ?? [];
  return {
    current: docs.filter((d) => d.active && d.requiresAcceptance && d.current).map((d) => ({
      key: d.key, name: d.name, version: d.current.version, fileUrl: d.current.fileUrl,
      acceptance: rows.find((r) => r.version_id === d.current.id) ?? null,
    })),
    history: rows,
  };
}

// "28/09/2026"
export const formatEffective = (ymd) => (ymd ? String(ymd).slice(0, 10).split("-").reverse().join("/") : "");

// "9 Oct 2026, 14:35"
export const formatAcceptedAt = (iso) => (iso
  ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  : "");
