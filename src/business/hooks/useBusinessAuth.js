import { useSyncExternalStore } from "react";
import { logActivity } from "../api/businessActivity";
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

// The snapshot pairs the user with `restored`, and is replaced on every emit.
// Returning currentUser alone meant a signed-out visitor never re-rendered
// when the restore finished (null → null looks unchanged to React), so
// anything waiting on `restored` would wait forever.
let snapshot = { user: currentUser, restored };
function emit() {
  snapshot = { user: currentUser, restored };
  listeners.forEach((l) => l());
}
function subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); }
function getSnapshot() { return snapshot; }

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
      plan: "free",
      planStatus: "Active",
      renewalDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      monthlyFee: 0,
      isMultiSite: false,
      visible: true,
      termsAcceptedAt: new Date().toISOString(),
      upgradePlanKey: "free",
    };
  return {
    ...base,
    id: row.business_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone ?? base.phone,
    role: row.role,
    // The businesses row is already joined for the approval check, so the real
    // name comes from there. It used to fall back to a placeholder that just
    // returns the business id, which showed up verbatim wherever a business
    // had no business_listings row yet — every admin-registered listing that
    // hasn't had content added, for instance.
    businessName: row.businesses?.name ?? base.businessName,
    // Real, persisted visibility — this used to be a hardcoded `true` on the
    // mock base with a TODO admitting no column existed, so toggling it did
    // nothing beyond the current page load.
    visible: row.businesses?.visible ?? base.visible ?? true,
    // Null for someone who claimed a business: a claim never collected a plan
    // or a terms acceptance, so the portal asks for them once, on first
    // sign-in after approval.
    onboardingCompletedAt: row.onboarding_completed_at ?? null,
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

// Two independent gates have to both be open before a session is built: the
// person's own account (business_users.status) and the business itself
// (businesses.status) — admin approves each separately (Business
// Registrations vs. Users), in either order, and both are required. Fetched
// together via the FK from business_users -> businesses so one query settles
// both. This mirrors is_approved_business_member() at the database level
// (supabase/sql/dual_gate_login.sql) — the RLS on every business-scoped table
// enforces the same rule independent of whatever this client checks.
async function fetchOwnRow(authUserId) {
  const { data, error } = await supabase
    .from("business_users")
    .select("*, businesses(status, visible, name)")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  return error ? null : data;
}

function isFullyApproved(row) {
  return !!row && row.status === "approved" && row.businesses?.status === "Approved";
}

async function refreshFromSession(session) {
  if (!session) {
    currentUser = null;
    restored = true;
    emit();
    return;
  }
  const row = await fetchOwnRow(session.user.id);

  // Build the whole session — listing identity and plan included — before
  // announcing it. Announcing early let the route guards and plan locks run
  // against a half-built user: a subscribed owner briefly saw Free-plan locks.
  let user = isFullyApproved(row) ? buildSessionUser(row) : null;
  if (user) {
    user = await applyListingIdentity(user);
    user = await applySubscription(user);
  }
  currentUser = user;
  restored = true;
  emit();
}

// Re-reads the signed-in user's row. Used after a write that changes
// something the session is built from — completing claim onboarding sets
// onboarding_completed_at, and the route guard reads it off the session.
export async function refresh() {
  const { data } = await supabase.auth.getSession();
  await refreshFromSession(data.session);
}

supabase.auth.getSession().then(({ data }) => refreshFromSession(data.session));
supabase.auth.onAuthStateChange((_event, session) => refreshFromSession(session));

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };

  // Checked here (not just left to refreshFromSession) so a denied login can
  // say *why* — "your account" vs. "this business" — rather than one generic
  // message, and so credentials that are correct but not yet approved don't
  // leave a signed-in Supabase Auth session sitting in the browser.
  const row = await fetchOwnRow(data.session.user.id);
  if (!row) {
    await supabase.auth.signOut();
    return { ok: false, error: "No business account found for this login." };
  }
  if (row.status !== "approved") {
    await supabase.auth.signOut();
    return { ok: false, error: "Your account is still awaiting admin approval." };
  }
  if (row.businesses?.status !== "Approved") {
    await supabase.auth.signOut();
    return { ok: false, error: "This business's registration is still awaiting admin approval." };
  }

  await refreshFromSession(data.session);
  if (!currentUser) return { ok: false, error: "No approved business account found for this login." };
  return { ok: true };
}

export async function logout() {
  await supabase.auth.signOut();
}

// Persists the account-holder's own name/phone to their business_users row
// (Account Settings' Personal Details section) and updates the live session.
export async function updatePersonalDetails({ firstName, lastName, phone }) {
  if (!currentUser) return { ok: false, error: "Not signed in." };
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("business_users")
    .update({ first_name: firstName, last_name: lastName, phone })
    .eq("auth_user_id", authUser.id);
  if (error) return { ok: false, error: error.message };
  currentUser = { ...currentUser, firstName, lastName, phone };
  emit();
  await logActivity(currentUser.id, { action: "profile.details_updated", entityType: "profile", entityId: currentUser.id });
  return { ok: true };
}

// Dev-only local override for demo-switching between seeded mock users —
// does not touch Supabase.
export function setMockUser(user) {
  currentUser = user;
  emit();
}

// Writes through set_business_visibility rather than updating `businesses`
// directly: owners have no UPDATE policy on that table, and giving them one
// would also hand them status, name and featured. The optimistic flip is
// reverted if the write fails, so the switch can't sit in a state the
// database disagrees with.
export async function toggleVisibility() {
  if (!currentUser) return { ok: true };
  const next = !currentUser.visible;
  const previous = currentUser.visible;
  currentUser = { ...currentUser, visible: next };
  emit();

  const { error } = await supabase.rpc("set_business_visibility", {
    target_business_id: currentUser.id,
    is_visible: next,
  });
  if (error) {
    currentUser = { ...currentUser, visible: previous };
    emit();
    return { ok: false, error: error.message };
  }
  await logActivity(currentUser.id, { action: next ? "profile.visible" : "profile.hidden", entityType: "profile", entityId: currentUser.id });
  return { ok: true };
}

export default function useBusinessAuth() {
  const { user, restored: isRestored } = useSyncExternalStore(subscribe, getSnapshot);
  return {
    user,
    isLoggedIn: !!user,
    restored: isRestored,
    // True only for someone who claimed a business and hasn't yet chosen a
    // plan or accepted the terms — the two things a claim never asked for.
    needsOnboarding: !!user && !user.onboardingCompletedAt,
    login,
    logout,
    refresh,
    switchUser: setMockUser,
    toggleVisibility,
    updatePersonalDetails,
  };
}
