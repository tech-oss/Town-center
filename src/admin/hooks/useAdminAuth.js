import { recordLogin } from "../../lib/recordLogin";
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
  // Coming back while still signed in counts as a sign-in, once a day.
  if (currentAdmin && !signingIn) recordLogin("admin", session.user.id);
}

supabase.auth.getSession().then(({ data }) => refreshFromSession(data.session));
supabase.auth.onAuthStateChange((_event, session) => refreshFromSession(session));

// The signed-in admin, readable outside React — the api/ layer needs it to
// attribute audit log entries without every caller passing it down.
export function getCurrentAdmin() { return currentAdmin; }

// Set while login() runs, so the session refresh it triggers doesn't record
// the same sign-in a second time.
let signingIn = false;

export async function login(email, password) {
  signingIn = true;
  try { return await doLogin(email, password); } finally { signingIn = false; }
}

async function doLogin(email, password) {
  signedOutOnPurpose = false;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  await refreshFromSession(data.session);
  if (!currentAdmin) {
    await supabase.auth.signOut({ scope: "local" });
    return { ok: false, error: "This account does not have admin access." };
  }
  // For the Reporting page's User Activity chart. Fire and forget: a failure
  // to record must never block signing in.
  recordLogin("admin", data.session.user.id, null, { always: true });
  return { ok: true };
}

// Signs out this browser only. supabase-js's default ("global") ended the
// admin account's sign-in on every device, so signing out on a phone left
// an editor open on a laptop unable to save ("violates row-level security").
// Settings has its own "Sign out everywhere" for when that's wanted.
export async function logout() {
  signedOutOnPurpose = true;
  await supabase.auth.signOut({ scope: "local" });
}

// Before a save or an upload: is this browser still signed in as an admin?
// Tries to renew an expired sign-in first. False means saving would be
// refused, so the editor can say so (and keep the work) instead.
export async function ensureAdminSession() {
  const { data } = await supabase.auth.getSession();
  let session = data?.session;
  const expiresSoon = session && (session.expires_at ?? 0) * 1000 < Date.now() + 60_000;
  if (!session || expiresSoon) {
    const { data: renewed } = await supabase.auth.refreshSession();
    session = renewed?.session ?? null;
  }
  if (!session) return false;
  const { data: ok } = await supabase.rpc("is_admin");
  return ok === true;
}

export const SIGNED_OUT_MESSAGE =
  "You've been signed out of admin, so this couldn't be saved. Sign in again in the box on screen — " +
  "everything you've typed stays on the page — then try again.";

// Set when someone presses Sign out, so the full login page shows rather
// than the "signed out while working" box over the page.
let signedOutOnPurpose = false;
export function wasSignedOutOnPurpose() { return signedOutOnPurpose; }

export default function useAdminAuth() {
  const admin = useSyncExternalStore(subscribe, getSnapshot);
  return { admin, isLoggedIn: !!admin, restored, login, logout };
}
