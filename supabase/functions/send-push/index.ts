// Sends a Web Push notification to every subscribed device matching the
// requested audience. Called by the admin panel (src/api/admin/siteContent.js
// sendPush) right after it records the send in push_notifications.
//
// NOT DEPLOYED YET — deploying and configuring this is the one piece of the
// push feature that needs the project owner's own action (CLI + dashboard
// secrets), not something I can do from here. See the deploy note at the
// bottom of this file.
//
// Uses the service-role key to read push_subscriptions (RLS on that table
// only allows insert/delete from the anon key, not select — see
// supabase/sql/push_subscriptions.sql), and VAPID keys to sign each request
// per the Web Push protocol (RFC 8030 + RFC 8291).

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:hello@maidenheadtowncentre.co.uk";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Called directly from the admin panel's browser session (supabase.functions.
// invoke), so it needs to answer the browser's CORS preflight and echo these
// headers on every response — without them the browser blocks the request
// before it ever reaches here, which shows up client-side as a bare "Failed
// to fetch" with no status code to debug from.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  const { title, body, url, audience = "all" } = await req.json();
  if (!title) {
    return new Response(JSON.stringify({ error: "title is required" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  let query = supabase.from("push_subscriptions").select("*");
  if (audience !== "all") query = query.eq("audience", audience);
  const { data: subs, error } = await query;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const payload = JSON.stringify({ title, body, url });

  const results = await Promise.allSettled(
    (subs ?? []).map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      ).catch(async (err) => {
        // 410 Gone / 404 means the browser has unsubscribed on its end —
        // clean up the dead row rather than retrying it forever.
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
        throw err;
      }),
    ),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return new Response(JSON.stringify({ sent, total: subs?.length ?? 0 }), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});

// ═══ Deploy steps (one-time, needs the project owner's Supabase CLI login) ═══
//
// 1. Install the CLI if not already: npm install -g supabase
// 2. supabase login
// 3. supabase link --project-ref vnnmzppjswiazzrnkjtq
// 4. Set the VAPID keys as function secrets. The public key is in
//    public/push-vapid-public-key.js; the private key was generated
//    alongside it but was NOT committed anywhere — it was given to you
//    directly, keep it out of git:
//      supabase secrets set VAPID_PUBLIC_KEY=<public key>
//      supabase secrets set VAPID_PRIVATE_KEY=<private key>
//      supabase secrets set VAPID_SUBJECT=mailto:you@example.com
// 5. supabase functions deploy send-push
//
// After that, sendPush() in src/api/admin/siteContent.js will actually
// deliver — right now it only records the send in push_notifications.
