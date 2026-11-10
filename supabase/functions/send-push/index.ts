// Sends a notification to every subscribed device matching the requested
// audience: Web Push for browsers, APNs for the iPhone app. Called by the
// admin panel (src/api/admin/siteContent.js sendPush, pushRequests.js) right
// after it records the send in push_notifications.
//
// Only a signed-in Maidenhead admin can call it. The one exception is the
// silent device check ({ check: true }), which a script can also run with
// the PUSH_CHECK_SECRET function secret in an x-push-check header.
//
// What Apple / the browser answered for each device is kept in
// push_delivery_log (supabase/sql/push_delivery_log_2026_11.sql).
//
// Uses the service-role key to read push_subscriptions (RLS on that table
// only allows insert/delete from the anon key, not select — see
// supabase/sql/push_subscriptions.sql), and VAPID keys to sign each request
// per the Web Push protocol (RFC 8030 + RFC 8291).

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";
import { SignJWT, importPKCS8 } from "npm:jose@5";

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:hello@maidenheadtowncentre.co.uk";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

// iPhone app (APNs). Set with `supabase secrets set` from the .p8 key made at
// developer.apple.com → Keys. Until they're set, iPhones are skipped and only
// Web Push is sent.
const APNS_KEY_ID = Deno.env.get("APNS_KEY_ID");
const APNS_TEAM_ID = Deno.env.get("APNS_TEAM_ID") ?? "8J8BUZX9GS";
const APNS_PRIVATE_KEY = Deno.env.get("APNS_PRIVATE_KEY")?.replace(/\\n/g, "\n");
const APNS_BUNDLE_ID = Deno.env.get("APNS_BUNDLE_ID") ?? "com.maidenheadapp.maidenheadapp";

const PUSH_CHECK_SECRET = Deno.env.get("PUSH_CHECK_SECRET");

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Apple accepts one signed token for up to an hour but refuses a new one
// more often than every 20 minutes. It's kept in apns_provider_token so every
// start of this function (and every device in one send) uses the same token
// until it's 50 minutes old.
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let apnsJwt: Promise<string> | null = null;
let apnsJwtAt = 0;
async function loadOrMakeApnsToken(fresh: boolean, maxAgeMin = 50): Promise<string> {
  if (!fresh) {
    const { data } = await supabase.from("apns_provider_token").select("token, issued_at").eq("id", 1).maybeSingle();
    if (data && Date.now() - new Date(data.issued_at).getTime() < maxAgeMin * 60 * 1000) {
      apnsJwtAt = new Date(data.issued_at).getTime();
      return data.token;
    }
  }
  const key = await importPKCS8(APNS_PRIVATE_KEY!, "ES256");
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: APNS_KEY_ID! })
    .setIssuer(APNS_TEAM_ID)
    .setIssuedAt()
    .sign(key);
  apnsJwtAt = Date.now();
  await supabase.from("apns_provider_token").upsert({ id: 1, token, issued_at: new Date(apnsJwtAt).toISOString() });
  return token;
}
function apnsToken(fresh = false) {
  if (fresh || !apnsJwt || Date.now() - apnsJwtAt > 50 * 60 * 1000) {
    apnsJwt = loadOrMakeApnsToken(fresh).catch((e) => { apnsJwt = null; throw e; });
  }
  return apnsJwt;
}
// Apple said the stored token is expired or invalid: make a new one, once
// per run (every device in the run then shares it).
let refreshedThisRun: Promise<string> | null = null;
function refreshApnsToken() {
  if (!refreshedThisRun) refreshedThisRun = apnsToken(true);
  return refreshedThisRun;
}

// A brand-new token is refused by most of Apple's servers for about a
// minute ("TooManyProviderTokenUpdates"), which is why notifications sent
// after a quiet hour used to reach only some phones. Before a token is used
// for real, it's tried against a made-up device address (nothing is
// delivered anywhere) until Apple accepts it several times in a row.
const PROBE_DEVICE = "0".repeat(64);
const probeLog: string[] = [];
async function tokenAccepted(): Promise<boolean> {
  try {
    const res = await fetch(`https://api.push.apple.com/3/device/${PROBE_DEVICE}`, {
      method: "POST",
      headers: {
        authorization: `bearer ${await apnsToken()}`,
        "apns-topic": APNS_BUNDLE_ID,
        "apns-push-type": "background",
        "apns-priority": "5",
        "content-type": "application/json",
      },
      body: JSON.stringify({ aps: { "content-available": 1 } }),
      signal: AbortSignal.timeout(8000),
    });
    const reason = (await res.json().catch(() => ({})))?.reason;
    probeLog.push(`${res.status} ${reason ?? ""}`);
    // The made-up address is refused (BadDeviceToken) once the token itself is fine.
    return res.status === 400 && reason === "BadDeviceToken";
  } catch (e) {
    probeLog.push(`error ${String((e as Error)?.message ?? e).slice(0, 60)}`);
    return false;
  }
}
async function warmApnsToken(maxWaitMs: number) {
  if (Date.now() - apnsJwtAt > 3 * 60 * 1000) return true; // settled already
  const until = Date.now() + maxWaitMs;
  let inARow = 0;
  while (Date.now() < until) {
    inARow = (await tokenAccepted()) ? inARow + 1 : 0;
    if (inARow >= 4) return true;
    await wait(inARow ? 500 : 4000);
  }
  return false;
}

// What happened for one device.
type Outcome = { ok: boolean; status?: number; reason?: string; host?: string; attempts: number; gone?: boolean };

// The address no longer reaches the app: deleted, reinstalled, or made for
// an earlier build of the app (a different bundle ID).
const GONE_REASONS = new Set(["Unregistered", "BadDeviceToken", "DeviceTokenNotForTopic"]);
// Worth one more try a moment later.
const TRANSIENT_STATUS = new Set([429, 500, 502, 503, 504]);

// App Store and TestFlight installs use Apple's production service; a
// build run from Xcode uses the sandbox, so a token production rejects is
// tried there once. A check is a silent background push: Apple confirms
// the address works, and nothing shows on the phone.
async function sendApns(deviceToken: string, payload: string, check: boolean): Promise<Outcome> {
  let attempts = 0;
  let last: Outcome = { ok: false, attempts: 0 };
  for (const host of ["api.push.apple.com", "api.sandbox.push.apple.com"]) {
    for (let tryNo = 0; tryNo < 5; tryNo++) {
      attempts++;
      let res: Response;
      try {
        res = await fetch(`https://${host}/3/device/${deviceToken}`, {
          method: "POST",
          headers: {
            authorization: `bearer ${await apnsToken()}`,
            "apns-topic": APNS_BUNDLE_ID,
            "apns-push-type": check ? "background" : "alert",
            "apns-priority": check ? "5" : "10",
            "content-type": "application/json",
          },
          body: payload,
          signal: AbortSignal.timeout(10000),
        });
      } catch (e) {
        // Connection dropped or timed out: try again shortly.
        last = { ok: false, reason: `network: ${String((e as Error)?.message ?? e).slice(0, 80)}`, host, attempts };
        if (tryNo < 2) { await wait(400 * (tryNo + 1)); continue; }
        return last;
      }
      if (res.ok) return { ok: true, status: res.status, host, attempts };
      const reason = (await res.json().catch(() => ({})))?.reason ?? String(res.status);
      last = { ok: false, status: res.status, reason, host, attempts };
      if ((reason === "ExpiredProviderToken" || reason === "InvalidProviderToken") && tryNo === 0) {
        await refreshApnsToken().catch(() => {});
        continue;
      }
      if (reason === "TooManyProviderTokenUpdates" && tryNo < 4) { await wait(8000); continue; }
      if (TRANSIENT_STATUS.has(res.status) && tryNo < 2) { await wait(400 * (tryNo + 1)); continue; }
      break;
    }
    if (last.reason === "BadDeviceToken" && host === "api.push.apple.com") continue;
    break;
  }
  return { ...last, gone: last.status === 410 || GONE_REASONS.has(last.reason ?? "") };
}

async function sendWeb(sub: { endpoint: string; p256dh: string; auth: string }, payload: string): Promise<Outcome> {
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
    return { ok: true, attempts: 1 };
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    const reason = String((err as Error)?.message ?? err).slice(0, 120);
    return {
      ok: false, status, attempts: 1, reason,
      // 410 Gone / 404: the browser has unsubscribed on its end. A
      // subscription whose keys are malformed ("p256dh value should be 65
      // bytes long") can never be delivered to either — one has failed every
      // send since it was saved — so it's removed the same way.
      gone: status === 410 || status === 404 || /should be \d+ bytes long|p256dh|auth secret/i.test(reason),
    };
  }
}

// Runs fn over items, a few at a time, so one send doesn't open dozens of
// connections to Apple at once.
async function mapLimited<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }));
  return out;
}

// Called directly from the admin panel's browser session (supabase.functions.
// invoke), so it needs to answer the browser's CORS preflight and echo these
// headers on every response — without them the browser blocks the request
// before it ever reaches here, which shows up client-side as a bare "Failed
// to fetch" with no status code to debug from.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-push-check",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });

// Keeps working after the reply has gone back (Supabase's EdgeRuntime).
declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;
function runAfterReply(p: Promise<unknown>) {
  const safe = p.catch((e) => console.error("send-push background:", e));
  if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(safe);
}

// A signed-in, active Maidenhead admin (is_admin()).
async function callerIsAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return false;
  const callerClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await callerClient.auth.getUser();
  if (!user) return false;
  const { data: isAdmin } = await callerClient.rpc("is_admin");
  return isAdmin === true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  refreshedThisRun = null;
  const input = await req.json().catch(() => ({}));
  const check = input.check === true;
  const warmOnly = input.warm === true;
  const secretOk = (check || warmOnly) && !!PUSH_CHECK_SECRET && req.headers.get("x-push-check") === PUSH_CHECK_SECRET;
  if (!secretOk && !(await callerIsAdmin(req))) {
    return json({ error: "Only a Maidenhead admin can send notifications." }, 403);
  }

  const apnsReady = !!(APNS_KEY_ID && APNS_PRIVATE_KEY);

  // Opening the admin Push page renews the token if it's over 35 minutes
  // old, so it has settled with Apple by the time Send is pressed.
  if (warmOnly) {
    if (!apnsReady) return json({ warm: false, reason: "APNs not set up" });
    await loadOrMakeApnsToken(false, 35).then((t) => { apnsJwt = Promise.resolve(t); });
    if (input.probe === true) { probeLog.length = 0; for (let i = 0; i < 3; i++) await tokenAccepted(); return json({ probes: probeLog }); }
    const ageSec = Math.round((Date.now() - apnsJwtAt) / 1000);
    if (ageSec < 180) runAfterReply(warmApnsToken(75000));
    return json({ warm: true, tokenAgeSec: ageSec });
  }

  const { title, body, url, audience = "all", notificationId = null } = input;
  if (!check && !title) return json({ error: "title is required" }, 400);

  // The admin panel retries once if the first call errors. If that first
  // call did get through, don't send the same notification twice.
  if (!check && notificationId) {
    const { data: done } = await supabase.from("push_delivery_log").select("ok")
      .eq("kind", "send").eq("notification_id", notificationId);
    if (done?.length) {
      return json({ sent: done.filter((d) => d.ok).length, total: done.length, iosSkipped: 0, repeat: true });
    }
  }

  let query = supabase.from("push_subscriptions").select("*");
  if (!check && audience !== "all") query = query.eq("audience", audience);
  const { data: subs, error } = await query;
  if (error) return json({ error: error.message }, 500);

  const targets = (subs ?? []).filter((sub) => (sub.platform ?? "web") === "ios" ? apnsReady : !check);

  // The number on each iPhone's app icon: notifications sent to phones since
  // that device last opened the app's notification list (this one included).
  let sentTimes: number[] = [];
  if (!check) {
    const { data: recent } = await supabase.from("push_notifications").select("sent_at")
      .contains("channels", ["Mobile"]).in("audience", ["all", "users"])
      .gte("sent_at", new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString());
    sentTimes = (recent ?? []).map((r) => new Date(r.sent_at).getTime());
  }
  const badgeFor = (sub: { seen_at?: string | null; created_at?: string }) => {
    const since = new Date(sub.seen_at ?? sub.created_at ?? 0).getTime();
    return Math.max(1, sentTimes.filter((t) => t > since).length);
  };

  const hasIos = targets.some((sub) => sub.platform === "ios");
  if (hasIos) await apnsToken().catch(() => {});

  const deliver = async () => {
    if (hasIos) await warmApnsToken(75000);

    const webPayload = JSON.stringify({ title, body, url });
    const results = await mapLimited(targets, 5, (sub) => sub.platform === "ios"
      ? sendApns(
        sub.endpoint.replace(/^apns:/, ""),
        check
          ? JSON.stringify({ aps: { "content-available": 1 } })
          : JSON.stringify({ aps: { alert: { title, body: body ?? "" }, sound: "default", badge: badgeFor(sub) }, url }),
        check,
      )
      : sendWeb(sub, webPayload));

    // Addresses that no longer reach the app are removed.
    const goneIds = targets.filter((_, i) => results[i].gone).map((s) => s.id);
    if (goneIds.length) await supabase.from("push_subscriptions").delete().in("id", goneIds);

    await supabase.from("push_delivery_log").insert(targets.map((sub, i) => ({
      kind: check ? "check" : "send",
      notification_id: check ? null : notificationId,
      subscription_id: sub.id,
      platform: sub.platform ?? "web",
      device: String(sub.endpoint).slice(-8),
      registered_at: sub.created_at,
      ok: results[i].ok,
      status: results[i].status ?? null,
      reason: results[i].reason ?? null,
      host: results[i].host ?? null,
      attempts: results[i].attempts,
    })));

    const sent = results.filter((r) => r.ok).length;
    // Per device, without its address: what Apple / the browser push service said.
    const outcomes = results.map((r, i) => ({
      platform: targets[i].platform ?? "web",
      ok: r.ok,
      reason: r.reason,
      removed: r.gone || undefined,
    }));
    // The admin's list of sent notifications shows how many devices it reached.
    if (!check && notificationId) {
      await supabase.from("push_notifications").update({ reach: sent, tried: targets.length }).eq("id", notificationId);
    }
    return { sent, outcomes, removed: goneIds.length };
  };

  // A token made in the last 3 minutes needs up to a minute to settle with
  // Apple, longer than the admin panel should wait: reply now and send in
  // the background (reach is filled in when it's done).
  if (hasIos && Date.now() - apnsJwtAt < 3 * 60 * 1000) {
    runAfterReply(deliver());
    return json({ queued: true, total: targets.length, iosSkipped: (subs?.length ?? 0) - targets.length });
  }
  const { sent, outcomes, removed } = await deliver();
  return json({ sent, total: targets.length, iosSkipped: (subs?.length ?? 0) - targets.length, removed, outcomes });
});

// Deploy: supabase functions deploy send-push --project-ref vnnmzppjswiazzrnkjtq
// Secrets (set once): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT,
// APNS_KEY_ID, APNS_PRIVATE_KEY, and optionally PUSH_CHECK_SECRET.
