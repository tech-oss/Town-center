import { supabase } from "../../lib/supabaseClient";
import { getCurrentAdmin } from "../../admin/hooks/useAdminAuth";

// Portal users are business_users rows — the people who sign in to the business
// dashboard, either as the account Owner or as a Content Manager they invited.
// Admin sees them all here and controls whether they can sign in at all
// (business_users.status is what the login flow checks).
//
// The DB stores status lowercase ("approved"); the admin UI has always shown it
// title-cased, so the two are mapped at this boundary.

const TO_UI = { approved: "Approved", pending: "Pending", rejected: "Rejected", suspended: "Suspended" };
const TO_DB = { Approved: "approved", Pending: "pending", Rejected: "rejected", Suspended: "suspended" };

function fromRow(row) {
  return {
    id: row.id,
    name: [row.first_name, row.last_name].filter(Boolean).join(" ") || row.email,
    email: row.email,
    phone: row.phone,
    businessId: row.business_id,
    business: row.businesses?.name ?? row.business_id,
    // "Owner" / "Content Manager" is the portal role; the admin screens have
    // always called the account holder a Business Owner.
    role: row.role === "Owner" ? "Business Owner" : row.role,
    status: TO_UI[row.status] ?? row.status,
    // The plan belongs to the business, not the person — the Subscriptions
    // screen is where it's actually managed.
    tier: row.plan ?? "Basic",
    joined: (row.requested_at ?? "").slice(0, 10),
    lastLogin: (row.approved_at ?? "").slice(0, 10),
  };
}

const SELECT = "*, businesses(name)";

// ── Audit log ─────────────────────────────────────────────────────────────────

export async function addLog(action, user, note = "") {
  // Who performed it, and acting as what role — the log is far less use
  // without it, and admin_users.role is the answer to "which role did this".
  const actor = getCurrentAdmin();
  const { error } = await supabase.from("admin_logs").insert({
    action,
    target_id: String(user?.id ?? ""),
    target_name: user?.name ?? "",
    note: note || null,
    actor_id: actor?.id ?? null,
    actor_name: actor?.name ?? null,
    actor_role: actor?.role ?? null,
  });
  // A failed audit write must never take down the action it was recording.
  if (error) console.error("admin_logs insert failed:", error.message);
}

export async function getAdminLogs() {
  const { data, error } = await supabase
    .from("admin_logs")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    timestamp: r.timestamp,
    action: r.action,
    targetName: r.target_name,
    targetId: r.target_id,
    note: r.note ?? "",
    // Entries written before actor attribution existed have none.
    actorName: r.actor_name ?? "—",
    actorRole: r.actor_role ?? "—",
  }));
}

export async function deleteAdminLogs(ids) {
  if (!ids?.length) return { deleted: 0 };
  const { error } = await supabase.from("admin_logs").delete().in("id", ids);
  if (error) throw error;
  return { deleted: ids.length };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getUsers({ role, status } = {}) {
  let q = supabase.from("business_users").select(SELECT).order("requested_at", { ascending: false });
  if (status) q = q.eq("status", TO_DB[status] ?? status);
  const { data, error } = await q;
  if (error) throw error;

  let list = (data ?? []).map(fromRow);
  if (role) list = list.filter((u) => u.role === role);
  return list;
}

export async function getUserById(id) {
  const { data, error } = await supabase.from("business_users").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

// ── Mutations ─────────────────────────────────────────────────────────────────

async function setUserStatus(id, status, action, note = "") {
  const { data: row } = await supabase.from("business_users").select("*, businesses(name)").eq("id", id).maybeSingle();
  const patch = { status };
  if (status === "approved") patch.approved_at = new Date().toISOString();

  const { error } = await supabase.from("business_users").update(patch).eq("id", id);
  if (error) throw error;
  if (row) await addLog(action, fromRow(row), note);
  return { ok: true };
}

export function approveUser(id) {
  return setUserStatus(id, "approved", "Approved");
}

export function rejectUser(id, note = "") {
  return setUserStatus(id, "rejected", "Rejected", note);
}

export function suspendUser(id) {
  return setUserStatus(id, "suspended", "Suspended");
}

// Creating a portal login means creating a Supabase Auth account, which needs
// the service-role key — that must never reach the browser. Admin therefore
// records the person against the business here, and they set their own password
// through the portal's normal "Register a User" flow using this email.
export async function registerUser(data) {
  const { data: inserted, error } = await supabase
    .from("business_users")
    .insert({
      business_id: data.businessId ?? data.business ?? null,
      role: data.role === "Business Owner" ? "Owner" : (data.role ?? "Content Manager"),
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone ?? null,
      status: "pending",
      requested_at: new Date().toISOString(),
    })
    .select(SELECT)
    .single();
  if (error) throw error;

  const user = fromRow(inserted);
  await addLog("Registered by admin", user, data.sendInvite ? "Invitation email to send" : "");
  return { ok: true, user };
}

export async function deleteUser(id) {
  const { data: row } = await supabase.from("business_users").select("*, businesses(name)").eq("id", id).maybeSingle();
  const { error } = await supabase.from("business_users").delete().eq("id", id);
  if (error) throw error;
  if (row) await addLog("Deleted account", fromRow(row));
  return { ok: true };
}

export async function getRecentActivity() {
  return [];
}
