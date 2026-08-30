import { useSyncExternalStore } from "react";
import { BUSINESS_DIRECTORY } from "../../Data/businessPortalMock";

// ─── Mock registry: portal login accounts + pending Content Manager requests
// A business can have exactly one Content Manager seat. This is a second
// user attached to an existing business who can manage listing content but
// cannot see or change Subscriptions & Billing.
// TODO: replace with real Supabase auth + a business_users table on backend integration

let PORTAL_USERS = [
  { id: "pu1", firstName: "James", lastName: "Whitfield", email: "james@coppaclub.co.uk", password: "password", role: "Owner", businessId: "biz_coppa" },
  { id: "pu2", firstName: "Sarah", lastName: "Coombes", email: "sarah@fredricks-hotel.co.uk", password: "password", role: "Owner", businessId: "biz_fredricks" },
];

let PENDING_REQUESTS = {}; // businessId -> [{ id, firstName, lastName, email, password, requestedAt }]

const listeners = new Set();
function emit() { listeners.forEach((l) => l()); }
function subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); }

export function businessName(businessId) {
  return BUSINESS_DIRECTORY.find((b) => b.id === businessId)?.name ?? businessId;
}

// A business may have only one Content Manager — pending or already approved.
export function hasContentManagerSlotTaken(businessId) {
  const pending = PENDING_REQUESTS[businessId]?.length > 0;
  const approved = PORTAL_USERS.some((u) => u.businessId === businessId && u.role === "Content Manager");
  return pending || approved;
}

export function submitUserRegistration({ businessId, firstName, lastName, email, password }) {
  if (hasContentManagerSlotTaken(businessId)) {
    return { ok: false, error: "This business already has a content manager registered or awaiting approval." };
  }
  if (PORTAL_USERS.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: "An account with that email already exists." };
  }
  const req = { id: `req${Date.now()}`, firstName, lastName, email, password, requestedAt: new Date().toISOString().slice(0, 10) };
  PENDING_REQUESTS = { ...PENDING_REQUESTS, [businessId]: [...(PENDING_REQUESTS[businessId] ?? []), req] };
  emit();
  return { ok: true };
}

export function approveRequest(businessId, reqId) {
  const req = (PENDING_REQUESTS[businessId] ?? []).find((r) => r.id === reqId);
  if (!req) return;
  PORTAL_USERS = [...PORTAL_USERS, {
    id: `pu${Date.now()}`, firstName: req.firstName, lastName: req.lastName,
    email: req.email, password: req.password, role: "Content Manager", businessId,
  }];
  PENDING_REQUESTS = { ...PENDING_REQUESTS, [businessId]: PENDING_REQUESTS[businessId].filter((r) => r.id !== reqId) };
  emit();
}

export function declineRequest(businessId, reqId) {
  PENDING_REQUESTS = { ...PENDING_REQUESTS, [businessId]: (PENDING_REQUESTS[businessId] ?? []).filter((r) => r.id !== reqId) };
  emit();
}

export function findUserByEmail(email) {
  return PORTAL_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

function getSnapshot() { return PENDING_REQUESTS; }

export function usePendingRequests(businessId) {
  const all = useSyncExternalStore(subscribe, getSnapshot);
  return all[businessId] ?? [];
}
