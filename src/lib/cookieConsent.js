// The visitor's cookie choices (Cookie Policy, /cookies).
//
// Essential storage (sign-in, the push token, preferences such as this
// choice itself) is always allowed. Two optional groups need the visitor's
// say-so first:
//   analytics  — the anonymous visitor token kept with page views (trackView)
//   functional — features run by other companies: the Elfsight chat assistant
//                and the embedded OpenStreetMap maps
// Until a choice is saved both are off. Page views are still counted without
// the token, since counting a view stores nothing on the device.
import { useEffect, useState } from "react";

const KEY = "mh_cookie_consent_v1";
const CHANGED = "mh-cookie-consent";
const OPEN = "mh-cookie-settings";
export const ANALYTICS_STORAGE_KEY = "mh_view_session";

export function getConsent() {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (c && c.v === 1) return c;
  } catch { /* storage blocked or bad value */ }
  return null;
}

export function hasConsent(group) {
  if (group === "necessary") return true;
  return !!getConsent()?.[group];
}

export function saveConsent({ analytics, functional }) {
  const c = { v: 1, analytics: !!analytics, functional: !!functional, savedAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
    if (!c.analytics) localStorage.removeItem(ANALYTICS_STORAGE_KEY);
  } catch { /* the choice still applies to this visit */ }
  window.__mhCookieConsent = c;
  window.dispatchEvent(new CustomEvent(CHANGED, { detail: c }));
  return c;
}

// The saved choice, re-rendering when it changes.
export function useCookieConsent() {
  const [consent, setConsent] = useState(() => getConsent() ?? window.__mhCookieConsent ?? null);
  useEffect(() => {
    const on = (e) => setConsent(e.detail);
    window.addEventListener(CHANGED, on);
    return () => window.removeEventListener(CHANGED, on);
  }, []);
  return consent;
}

// "Cookie Settings" links call this to reopen the choices.
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN));
}

export function onOpenCookieSettings(fn) {
  window.addEventListener(OPEN, fn);
  return () => window.removeEventListener(OPEN, fn);
}
