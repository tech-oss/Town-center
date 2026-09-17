import { useSyncExternalStore } from "react";
import { supabase } from "./supabaseClient";
import { invalidateLiveBusinesses } from "../api/liveBusinesses";
import { setHomepageClockHandler } from "./homepageClock";

// Live updates for the public website and app.
//
// The database broadcasts a "change" message on the `site-updates` channel
// whenever public content changes (see supabase/sql/realtime_site_updates_2026_09.sql).
// On each message this bumps a version number; useFetch re-runs its loader
// when the version changes, so every open page quietly re-reads its data.
//
// Also refreshes when the app comes back to the screen after a while, since a
// phone drops the live connection for a backgrounded PWA.

let version = 0;
const listeners = new Set();
let users = 0;
let channel = null;
let debounce = null;
let hiddenAt = null;

const RESUME_REFRESH_MS = 30_000;

function bump() {
  invalidateLiveBusinesses();
  version += 1;
  listeners.forEach((l) => l());
}

// Admin often saves several tables at once; refresh once for the whole burst.
function scheduleBump() {
  clearTimeout(debounce);
  debounce = setTimeout(bump, 600);
}

function onVisibility() {
  if (document.visibilityState === "hidden") {
    hiddenAt = Date.now();
  } else if (hiddenAt && Date.now() - hiddenAt > RESUME_REFRESH_MS) {
    hiddenAt = null;
    bump();
  }
}

function start() {
  channel = supabase
    .channel("site-updates")
    .on("broadcast", { event: "change" }, scheduleBump)
    .subscribe();
  document.addEventListener("visibilitychange", onVisibility);
}

function stop() {
  clearTimeout(debounce);
  if (channel) supabase.removeChannel(channel);
  channel = null;
  document.removeEventListener("visibilitychange", onVisibility);
}

// Called by the public site and the app while they're mounted. Admin and the
// business dashboard don't turn this on, so a form being edited there is
// never refreshed out from under someone.
export function enableLiveUpdates() {
  if (users++ === 0) {
    setHomepageClockHandler(bump);
    start();
  }
  return () => {
    if (--users === 0) stop();
  };
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLiveVersion() {
  return useSyncExternalStore(subscribe, () => version, () => 0);
}
