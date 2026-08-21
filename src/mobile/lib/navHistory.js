// Deep-link-safe "back" detection for the mobile app.
//
// `navigate(-1)` is only safe when the current screen was actually pushed
// from another screen in this app session. Land directly on a detail screen
// instead — a shared link, a PWA relaunch, or a hard refresh — and there is
// nothing of ours before it in history, so `navigate(-1)` either does
// nothing or exits the app to whatever was open before it. Every back
// control in the app falls back to a sensible in-app destination in that
// case instead (see useMobileBack).
//
// `history.length` only grows while the tab is open, so comparing it against
// a baseline captured the moment the mobile app first mounts reliably tells
// us whether a push happened inside this session.
let baseline = null;

export function markMobileAppMounted() {
  if (baseline === null) baseline = window.history.length;
}

export function hasInAppHistory() {
  return baseline !== null && window.history.length > baseline;
}
