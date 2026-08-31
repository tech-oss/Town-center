import { useSyncExternalStore } from "react";
import { supabase } from "../../lib/supabaseClient";
import { coppaMockUser, hotelMockUser } from "../../Data/businessPortalMock";
import { businessName } from "./useUserRegistry";
import { getSubscription } from "../api/businessSubscription";

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
  const isSeeded = row.business_id === "biz_coppa" || row.business_id === "biz_fredricks";
  const base = isSeeded
    ? (row.business_id === "biz_coppa" ? coppaMockUser : hotelMockUser)
    : {
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
    _isSeeded: isSeeded,
  };
}

// For businesses registered via the real "Register a Business" flow (not one
// of the two seeded demo businesses), the generic fallback above can't know
// the real business name/type — pull them from business_listings, which now
// exists for every registered business.
async function applyListingIdentity(user) {
  if (user._isSeeded) return user;
  const { data } = await supabase
    .from("business_listings")
    .select("name, business_type")
    .eq("business_id", user.id)
    .maybeSingle();
  if (!data) return user;
  return { ...user, businessName: data.name ?? user.businessName, businessType: data.business_type ?? user.businessType };
}

// Billing fields (plan, planStatus, renewalDate, monthlyFee, isMultiSite,
// siteTierKey, upgradePlanKey, termsAcceptedAt) come from the real
// business_subscriptions table when a row exists, overriding the mock base
// built above. businessType/phone/businessName/visible stay on the mock base
// (not billing fields, out of scope for this migration).
async function applySubscription(user) {
  const sub = await getSubscription(user.id);
  return sub ? { ...user, ...sub } : user;
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
  if (currentUser) {
    currentUser = await applyListingIdentity(currentUser);
    currentUser = await applySubscription(currentUser);
    emit();
  }
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
