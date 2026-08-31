import { useSyncExternalStore } from "react";
import { supabase } from "../../lib/supabaseClient";
import { coppaMockUser, hotelMockUser } from "../../Data/businessPortalMock";
import { businessName } from "./useUserRegistry";

// ─── Supabase-backed auth store ────────────────────────────────────────────
// A single "logged in user" derived from the Supabase Auth session, shared
// across the portal via useSyncExternalStore. `user.id` is deliberately kept
// equal to the business id string (e.g. "biz_coppa") — not the Supabase Auth
// uid — because every other business-portal page keys its mock data lookups
// (BUSINESS_LISTING[user.id], BUSINESS_ARTICLES[user.id], etc.) off that
// business id, and migrating that is out of scope here.
let currentUser = null; // null = signed out
let restored = false; // true once the initial getSession() resolves
const listeners = new Set();

function emit() { listeners.forEach((l) => l()); }
function subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); }
function getSnapshot() { return currentUser; }

// Owners of the two fully seeded demo businesses reuse their rich mock
// records; any other business (registered only via "Register a User") gets a
// sensible generic session — every page already falls back gracefully when a
// business has no seeded listing/articles/reviews content yet.
function buildSessionUser(row) {
  const base =
    row.business_id === "biz_coppa" ? coppaMockUser :
    row.business_id === "biz_fredricks" ? hotelMockUser :
    {
      id: row.business_id,
      businessName: businessName(row.business_id),
      businessType: "eat-drink",
      plan: "standard",
      planStatus: "Active",
      renewalDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      monthlyFee: 39,
      isMultiSite: false,
      visible: true,
      termsAcceptedAt: new Date().toISOString(),
      upgradePlanKey: "basic",
    };
  return {
    ...base,
    id: row.business_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    role: row.role,
  };
}

async function refreshFromSession(session) {
  if (!session) {
    currentUser = null;
    restored = true;
    emit();
    return;
  }
  const { data: row, error } = await supabase
    .from("business_users")
    .select("*")
    .eq("auth_user_id", session.user.id)
    .eq("status", "approved")
    .maybeSingle();

  currentUser = error || !row ? null : buildSessionUser(row);
  restored = true;
  emit();
}

supabase.auth.getSession().then(({ data }) => refreshFromSession(data.session));
supabase.auth.onAuthStateChange((_event, session) => refreshFromSession(session));

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  await refreshFromSession(data.session);
  if (!currentUser) return { ok: false, error: "No approved business account found for this login." };
  return { ok: true };
}

export async function logout() {
  await supabase.auth.signOut();
}

// Dev-only local override for demo-switching between seeded mock users —
// does not touch Supabase.
export function setMockUser(user) {
  currentUser = user;
  emit();
}

// TODO: `visible` is part of the still-mocked business profile — no
// `businesses.visible` column exists yet (out of scope for this pass).
export function toggleVisibility() {
  if (!currentUser) return;
  currentUser = { ...currentUser, visible: !currentUser.visible };
  emit();
}

export default function useBusinessAuth() {
  const user = useSyncExternalStore(subscribe, getSnapshot);
  return { user, isLoggedIn: !!user, restored, login, logout, switchUser: setMockUser, toggleVisibility };
}
