import { useSyncExternalStore } from "react";
import { supabase } from "../../lib/supabaseClient";

// Admin auth store — mirrors the business portal's useBusinessAuth shape so
// both portals behave the same, but gates on an `admin_users` row rather than
// `business_users`. A Supabase Auth account with no active admin_users row is
// signed straight back out, so /admin is never reachable with a business login.
let currentAdmin = null;
let restored = false;
const listeners = new Set();

function emit() { listeners.forEach((l) => l()); }
function subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); }
function getSnapshot() { return currentAdmin; }

function fromRow(row) {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    name: row.name,
    email: row.email,
    role: row.role, // "Super Admin" | "Admin" | "Moderator"
  };
}

async function refreshFromSession(session) {
  if (!session) {
    currentAdmin = null;
    restored = true;
    emit();
    return;
  }
  const { data: row, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("auth_user_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();

  currentAdmin = error || !row ? null : fromRow(row);
  restored = true;
  emit();
}

supabase.auth.getSession().then(({ data }) => refreshFromSession(data.session));
supabase.auth.onAuthStateChange((_event, session) => refreshFromSession(session));

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  await refreshFromSession(data.session);
  if (!currentAdmin) {
    await supabase.auth.signOut();
    return { ok: false, error: "This account does not have admin access." };
  }
  return { ok: true };
}

export async function logout() {
  await supabase.auth.signOut();
}

export default function useAdminAuth() {
  const admin = useSyncExternalStore(subscribe, getSnapshot);
  return { admin, isLoggedIn: !!admin, restored, login, logout };
}
