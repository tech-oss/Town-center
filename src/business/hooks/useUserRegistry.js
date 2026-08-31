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

// Real business directory, used by the "Register a User" business search —
// replaces the old static BUSINESS_DIRECTORY mock so newly registered
// businesses actually show up.
export async function listBusinesses() {
  const { data, error } = await supabase.from("businesses").select("id, name").order("name");
  if (error) throw error;
  return data ?? [];
}

// A business may have only one Content Manager — pending or already approved.
export async function hasContentManagerSlotTaken(businessId) {
  const { count, error } = await supabase
    .from("business_users")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("role", "Content Manager")
    .in("status", ["pending", "approved"]);
  return !error && count > 0;
}

export async function submitUserRegistration({ businessId, firstName, lastName, email, password }) {
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError) return { ok: false, error: signUpError.message };

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
