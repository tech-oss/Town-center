import { Capacitor } from "@capacitor/core";

// Whether the App Store app's first-launch permissions window has been shown
// on this install (see components/PermissionsWelcome.jsx).
const SEEN_KEY = "mh_permissions_welcome_v1";

export function markPermissionsWelcomeSeen() {
  try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* shown again next launch */ }
}

export function shouldShowPermissionsWelcome() {
  if (!Capacitor.isNativePlatform()) return false;
  try { return localStorage.getItem(SEEN_KEY) !== "1"; } catch { return true; }
}
