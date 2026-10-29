import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { App } from "@capacitor/app";
import { linkTarget } from "./appLinks";
import { supabase } from "../../lib/supabaseClient";

// Web Push subscription capture. The actual sending lives in the send-push
// Edge Function (supabase/functions/send-push) — this just gets the browser's
// permission and hands its subscription to Supabase so that function has
// somewhere to deliver to.

function urlBase64ToUint8Array(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// In the App Store app, notifications go through Apple's push service: the
// device token is saved as an 'ios' row in the same table (see
// supabase/sql/push_ios_2026_10.sql), and send-push delivers it via APNs.
const native = Capacitor.isNativePlatform();

// Resolves with the device token once iOS hands it over.
function registerNative() {
  return new Promise((resolve, reject) => {
    let done = false;
    const handles = [];
    const finish = (fn, v) => {
      if (done) return;
      done = true;
      handles.forEach((h) => h.then((l) => l.remove()));
      fn(v);
    };
    handles.push(PushNotifications.addListener("registration", (t) => finish(resolve, t.value)));
    handles.push(PushNotifications.addListener("registrationError", (e) => finish(reject, new Error(e.error || "Couldn't register for notifications."))));
    PushNotifications.register().catch((e) => finish(reject, e));
    setTimeout(() => finish(reject, new Error("Couldn't register for notifications. Try again in a moment.")), 15000);
  });
}

// This phone's own entry, remembered so it can be marked as caught up (the
// number on the app icon) and replaced when iOS issues a new token.
const ENDPOINT_KEY = "mh_push_endpoint";
function savedEndpoint() {
  try { return localStorage.getItem(ENDPOINT_KEY); } catch { return null; }
}

async function saveNativeToken(token) {
  const endpoint = `apns:${token}`;
  const previous = savedEndpoint();
  const { error } = await supabase.from("push_subscriptions").insert({ endpoint, platform: "ios", seen_at: new Date().toISOString() });
  if (error && !error.message.includes("duplicate")) throw error;
  if (previous && previous !== endpoint) await supabase.from("push_subscriptions").delete().eq("endpoint", previous);
  try { localStorage.setItem(ENDPOINT_KEY, endpoint); } catch { /* replaced next launch */ }
}

// The app being opened clears the number on its icon (SceneDelegate.swift),
// so the push service is told this phone has seen everything so far and the
// next notification's number starts again from 1.
export async function markNativePushSeen() {
  if (!native) return;
  const endpoint = savedEndpoint();
  if (!endpoint) return;
  try { await supabase.rpc("push_mark_seen", { p_endpoint: endpoint }); } catch { /* recounted next send */ }
}
if (native) {
  App.addListener("appStateChange", ({ isActive }) => { if (isActive) markNativePushSeen(); });
}

let nativePermission = "default";
if (native) {
  PushNotifications.checkPermissions()
    .then((p) => { nativePermission = p.receive === "granted" ? "granted" : p.receive === "denied" ? "denied" : "default"; })
    .catch(() => {});
}

// Already allowed: re-register on every launch, since iOS can issue a new token.
export async function refreshNativePush() {
  if (!native) return;
  const p = await PushNotifications.checkPermissions();
  if (p.receive !== "granted") return;
  nativePermission = "granted";
  try { await saveNativeToken(await registerNative()); } catch { /* tried again next launch */ }
  markNativePushSeen();
}

// Opens the screen a notification links to when it's tapped.
export function onNativePushOpened(go) {
  if (!native) return () => {};
  const handle = PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    // Tapped from outside the app: open its link, or the home screen.
    const target = linkTarget(action.notification?.data?.url);
    if (target?.external) { window.open(target.external, "_blank", "noopener"); go("/mobile/home"); }
    else go(target?.path ?? "/mobile/home");
  });
  return () => { handle.then((h) => h.remove()); };
}

export async function nativePushPermission() {
  if (!native) return pushPermission();
  const p = await PushNotifications.checkPermissions();
  return p.receive === "granted" ? "granted" : p.receive === "denied" ? "denied" : "default";
}

export function pushSupported() {
  if (native) return true;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function pushPermission() {
  if (native) return nativePermission;
  return pushSupported() ? Notification.permission : "unsupported";
}

export async function subscribeToPush() {
  if (native) {
    try {
      let p = await PushNotifications.checkPermissions();
      if (p.receive === "prompt" || p.receive === "prompt-with-rationale") p = await PushNotifications.requestPermissions();
      if (p.receive !== "granted") {
        return { ok: false, error: "Notifications are turned off for Maidenhead. You can turn them on in the iPhone's Settings app." };
      }
      nativePermission = "granted";
      await saveNativeToken(await registerNative());
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }
  if (!pushSupported()) return { ok: false, error: "Push notifications aren't supported on this browser." };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, error: "Notification permission was not granted." };

  const publicKey = window.PUSH_VAPID_PUBLIC_KEY;
  if (!publicKey) return { ok: false, error: "Push isn't configured yet." };

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const json = subscription.toJSON();
  const { error } = await supabase.from("push_subscriptions").insert({
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  });
  // A duplicate endpoint (already subscribed on this device) isn't a failure.
  if (error && !error.message.includes("duplicate")) return { ok: false, error: error.message };

  return { ok: true };
}

export async function unsubscribeFromPush() {
  if (native) return { ok: true };
  if (!pushSupported()) return { ok: true };
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return { ok: true };

  await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
  await subscription.unsubscribe();
  return { ok: true };
}
