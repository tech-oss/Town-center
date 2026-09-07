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

export function pushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function pushPermission() {
  return pushSupported() ? Notification.permission : "unsupported";
}

export async function subscribeToPush() {
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
  if (!pushSupported()) return { ok: true };
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return { ok: true };

  await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
  await subscription.unsubscribe();
  return { ok: true };
}
