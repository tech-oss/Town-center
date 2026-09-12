// stripe-portal — opens Stripe's Customer Portal for a subscribed business,
// where the owner updates their card, downloads invoices, or cancels.
// Cancelling there reaches us through stripe-webhook like any other change.
//
// Deploy:  supabase functions deploy stripe-portal
// Secrets: STRIPE_SECRET_KEY, SITE_URL (optional ALLOWED_ORIGIN_REGEX)

import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const ORIGIN_RE = new RegExp(
  Deno.env.get("ALLOWED_ORIGIN_REGEX") ?? "^(https://town-center-[a-z0-9-]+\\.vercel\\.app|http://localhost:\\d+)$",
);
function returnBase(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  return ORIGIN_RE.test(origin) ? origin : Deno.env.get("SITE_URL")!;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const caller = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: "Please sign in again." }, 401);

    const { businessId } = await req.json().catch(() => ({}));
    if (!businessId) return json({ error: "Missing business." }, 400);

    const { data: member } = await admin
      .from("business_users")
      .select("role, status")
      .eq("business_id", businessId)
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (!member || member.role !== "Owner" || member.status !== "approved") {
      return json({ error: "Only the business owner can manage billing." }, 403);
    }

    const { data: sub } = await admin
      .from("business_subscriptions")
      .select("stripe_customer_id")
      .eq("business_id", businessId)
      .maybeSingle();
    if (!sub?.stripe_customer_id) {
      return json({ error: "There's no billing account yet — subscribe to Premium first." }, 404);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${returnBase(req)}/business/billing`,
    });
    return json({ url: session.url });
  } catch (e) {
    console.error("stripe-portal failed:", e);
    return json({ error: "Could not open billing. Please try again." }, 500);
  }
});
