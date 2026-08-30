import { useState, useCallback, useSyncExternalStore } from "react";
import { coppaMockUser } from "../../Data/businessPortalMock";

// ─── Mock auth store ────────────────────────────────────────────────────────
// A single in-memory "logged in user" shared across the portal. Swap
// `currentUser` to `hotelMockUser` (see businessPortalMock.js) to exercise
// the hotel/multi-site conditional UI, or call `setMockUser` from anywhere.
// TODO: replace with real Supabase auth session on backend integration
let currentUser = null; // null = signed out
let loggedIn = false;
const listeners = new Set();

function emit() { listeners.forEach((l) => l()); }

export function mockLogin(user = coppaMockUser) {
  currentUser = user;
  loggedIn = true;
  emit();
}
export function mockLogout() {
  loggedIn = false;
  emit();
}
export function setMockUser(user) {
  currentUser = user;
  emit();
}

// TODO: update Supabase visibility field
export function toggleVisibility() {
  if (!currentUser) return;
  currentUser = { ...currentUser, visible: !currentUser.visible };
  emit();
}

function subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); }
function getSnapshot() { return loggedIn ? currentUser : null; }

export default function useBusinessAuth() {
  const user = useSyncExternalStore(subscribe, getSnapshot);
  return { user, isLoggedIn: !!user, login: mockLogin, logout: mockLogout, switchUser: setMockUser, toggleVisibility };
}
