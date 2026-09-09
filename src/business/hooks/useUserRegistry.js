import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

// ─── Supabase-backed business_users registry ───────────────────────────────
// business_users is the single source of truth for portal logins (Owner +
// Content Manager rows) and pending Content Manager join requests. Replaces
// the old in-memory PORTAL_USERS / PENDING_REQUESTS / BUSINESS_TEAM mocks.

export function businessName(businessId) {
  // Synchronous fallback only — used as a placeholder in the generic session
  // base before the real name (from business_listings) overrides it. Not a
  // real lookup anymore now that the businesses table is the source of truth.
  return businessId;
}

// Real business directory, used by the "Register a Content Manager" business
// search — replaces the old static BUSINESS_DIRECTORY mock so newly
// registered businesses actually show up.
export async function listBusinesses() {
  const { data, error } = await supabase.from("businesses").select("id, name").order("name");
  if (error) throw error;
  return data ?? [];
}

// Claiming only makes sense for a business nobody already runs — one with no
// Owner row at all, pending or approved. An admin-registered business with no
// owner attached (see src/api/admin/businesses.js on admin-panel) is exactly
// this state; that's the case this whole flow exists for.
//
// Goes through the unclaimed_businesses() RPC rather than a client-side join
// against business_users — that table is RLS-locked (it holds emails, roles,
// approval status) and this page runs signed out, on the anon key, so a
// direct query would just come back empty and the picker would show every
// business as unclaimed. See supabase/sql/unclaimed_businesses.sql.
export async function listUnclaimedBusinesses() {
  const { data, error } = await supabase.rpc("unclaimed_businesses");
  if (error) throw error;
  return data ?? [];
}

// A business may have only one Content Manager — pending or already
// approved. Goes through the business_role_slot_taken() RPC rather than a
// direct count against business_users: that table is RLS-locked, and this
// runs on the anon key before any session exists, so a direct query always
// came back as 0 rows (not blocked — just filtered to nothing), which meant
// this check silently never actually fired. See
// supabase/sql/unclaimed_businesses.sql.
export async function hasContentManagerSlotTaken(businessId) {
  const { data, error } = await supabase.rpc("business_role_slot_taken", {
    target_business_id: businessId,
    target_role: "Content Manager",
  });
  return !error && data === true;
}

// Same rule for Owner: at most one pending-or-approved claim per business.
// Checked again here (not just left to the unclaimed-businesses filter)
// because the picker's list can be a few seconds stale if two people are
// claiming the same business at once.
export async function hasOwnerSlotTaken(businessId) {
  const { data, error } = await supabase.rpc("business_role_slot_taken", {
    target_business_id: businessId,
    target_role: "Owner",
  });
  return !error && data === true;
}

// A Supabase Auth "already registered" error reads as a raw sentence fragment
// ("User already registered") if shown verbatim — this turns it into
// something that tells the person what to do next.
function readableSignUpError(error) {
  const message = String(error?.message ?? "");
  if (/already registered|already exists/i.test(message)) {
    return "An account with this email already exists. Log in instead, or use a different email address.";
  }
  return message;
}

export async function submitUserRegistration({ businessId, firstName, lastName, email, password }) {
  if (await hasContentManagerSlotTaken(businessId)) {
    return { ok: false, error: "This business already has a content manager registered or awaiting approval." };
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError) return { ok: false, error: readableSignUpError(signUpError) };

  const { error: insertError } = await supabase.from("business_users").insert({
    auth_user_id: signUpData.user.id,
    business_id: businessId,
    role: "Content Manager",
    first_name: firstName,
    last_name: lastName,
    email,
    status: "pending",
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, error: "This business already has a content manager registered or awaiting approval." };
    }
    return { ok: false, error: insertError.message };
  }
  return { ok: true };
}

// Claiming a business — registers the person as its Owner, pending admin
// approval. Same shape as submitUserRegistration; the only real difference is
// the role and the RLS policy it goes through (see
// supabase/sql/fix_owner_self_register_policy.sql — "self-register as pending
// owner" already allows exactly this insert, so no new migration is needed).
export async function submitBusinessClaim({ businessId, firstName, lastName, email, password }) {
  if (await hasOwnerSlotTaken(businessId)) {
    return { ok: false, error: "This business has already been claimed, or has a claim awaiting approval." };
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError) return { ok: false, error: readableSignUpError(signUpError) };

  const { error: insertError } = await supabase.from("business_users").insert({
    auth_user_id: signUpData.user.id,
    business_id: businessId,
    role: "Owner",
    first_name: firstName,
    last_name: lastName,
    email,
    status: "pending",
    requested_at: new Date().toISOString(),
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, error: "This business has already been claimed, or has a claim awaiting approval." };
    }
    return { ok: false, error: insertError.message };
  }
  return { ok: true };
}

export async function approveRequest(businessId, reqId) {
  await supabase
    .from("business_users")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", reqId)
    .eq("business_id", businessId);
}

export async function declineRequest(businessId, reqId) {
  await supabase
    .from("business_users")
    .update({ status: "declined" })
    .eq("id", reqId)
    .eq("business_id", businessId);
}

function useBusinessUsersByStatus(businessId, status) {
  const [rows, setRows] = useState([]);

  const refetch = useCallback(async () => {
    if (!businessId) { setRows([]); return; }
    const { data } = await supabase
      .from("business_users")
      .select("*")
      .eq("business_id", businessId)
      .eq("role", "Content Manager")
      .eq("status", status)
      .order("requested_at");
    setRows(data ?? []);
  }, [businessId, status]);

  useEffect(() => {
    refetch();
    if (!businessId) return;
    const channel = supabase
      .channel(`business_users:${businessId}:${status}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "business_users", filter: `business_id=eq.${businessId}` }, refetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [businessId, status, refetch]);

  return rows;
}

export function usePendingRequests(businessId) {
  const rows = useBusinessUsersByStatus(businessId, "pending");
  return rows.map((r) => ({ id: r.id, firstName: r.first_name, lastName: r.last_name, email: r.email, requestedAt: r.requested_at?.slice(0, 10) }));
}

export function useApprovedTeam(businessId) {
  const [rows, setRows] = useState([]);

  const refetch = useCallback(async () => {
    if (!businessId) { setRows([]); return; }
    const { data } = await supabase
      .from("business_users")
      .select("*")
      .eq("business_id", businessId)
      .eq("status", "approved")
      .order("role", { ascending: false }); // Owner before Content Manager
    setRows(data ?? []);
  }, [businessId]);

  useEffect(() => {
    refetch();
    if (!businessId) return;
    const channel = supabase
      .channel(`business_users_team:${businessId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "business_users", filter: `business_id=eq.${businessId}` }, refetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [businessId, refetch]);

  return rows.map((r) => ({ id: r.id, name: `${r.first_name} ${r.last_name}`, email: r.email, role: r.role }));
}
