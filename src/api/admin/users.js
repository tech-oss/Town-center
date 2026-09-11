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
// the service-role key — that must never reach the browser. So this goes
// through the admin-create-business Edge Function (the same one the Business
// Registrations form uses), which verifies the caller is an admin, creates the
// login, and writes the business_users row linked to it.
//
// This used to insert the business_users row directly with no auth account
// behind it. The table requires the link, so the insert failed — and the
// modal never heard about it, which is why registering looked stuck.
export async function registerUser(data) {
  const password = data.autoPassword || !data.password
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 14)
    : data.password;

  const { data: result, error } = await supabase.functions.invoke("admin-create-business", {
    body: {
      businessId: data.businessId,
      email: data.email.trim(),
      password,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone || null,
      role: data.role === "Business Owner" ? "Owner" : "Content Manager",
    },
  });
  if (error) {
    // The function answers 4xx with { error } in the body; surface that
    // message rather than the generic "non-2xx status code".
    let message = error.message;
    try { message = (await error.context?.json())?.error ?? message; } catch { /* keep generic */ }
    throw new Error(message);
  }
  if (result?.error) throw new Error(result.error);

  const { data: row } = await supabase
    .from("business_users").select(SELECT).eq("auth_user_id", result.userId).maybeSingle();
  const user = row ? fromRow(row) : { id: result.userId, name: `${data.firstName} ${data.lastName}` };
  await addLog("Registered by admin", user, data.sendInvite ? "Login details to be shared with the user" : "");
  return { ok: true, user, password: data.autoPassword ? password : null };
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
