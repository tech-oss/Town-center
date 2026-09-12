// stripe-checkout — starts a Stripe Checkout session for the Premium plan.
//
// Called by the business dashboard's Subscribe flow. The browser is sent to
// the returned Stripe-hosted page to pay; the plan itself only changes when
// Stripe confirms payment to stripe-webhook, never from this function or the
// browser.
//
// Deploy:  supabase functions deploy stripe-checkout
// Secrets: STRIPE_SECRET_KEY, SITE_URL,
//          STRIPE_PRICE_VISIBILITY_MONTHLY (£29.99/month),
//          STRIPE_PRICE_VISIBILITY_YEARLY (£329/year)
//          (optional ALLOWED_ORIGIN_REGEX)

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

// Stripe only redirects back to our own site: the Vercel deployments and
// local dev, never an arbitrary URL supplied by the caller.
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
    // Who is asking — from their own Supabase session.
    const caller = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: "Please sign in again." }, 401);

    const { businessId, interval } = await req.json().catch(() => ({}));
    if (!businessId) return json({ error: "Missing business." }, 400);

    // Monthly or annual Visibility Plan. Only these two Stripe prices can be
    // bought — the price is chosen here, never supplied by the browser.
    const priceId = interval === "year"
      ? Deno.env.get("STRIPE_PRICE_VISIBILITY_YEARLY")
      : (Deno.env.get("STRIPE_PRICE_VISIBILITY_MONTHLY") ?? Deno.env.get("STRIPE_PRICE_PREMIUM"));
    if (!priceId) {
      console.error("Missing Stripe price secret for interval", interval);
      return json({ error: "This billing option isn't available yet." }, 503);
    }

    // Only the approved Owner of an approved business can subscribe it.
    const { data: member } = await admin
      .from("business_users")
      .select("role, status, businesses(name, status)")
      .eq("business_id", businessId)
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (!member || member.role !== "Owner" || member.status !== "approved" || member.businesses?.status !== "Approved") {
      return json({ error: "Only the business owner can subscribe." }, 403);
    }

    const { data: sub } = await admin
      .from("business_subscriptions")
      .select("plan, stripe_customer_id, stripe_subscription_id, cancel_at_period_end")
      .eq("business_id", businessId)
      .maybeSingle();

    if (sub?.plan === "premium" && sub?.stripe_subscription_id && !sub?.cancel_at_period_end) {
      return json({ error: "This business is already on the Visibility Plan." }, 409);
    }

    // One Stripe customer per business, reused across subscriptions.
    let customerId = sub?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: member.businesses?.name ?? undefined,
        metadata: { business_id: businessId },
      });
      customerId = customer.id;
      await admin.from("business_subscriptions")
        .upsert({ business_id: businessId, stripe_customer_id: customerId }, { onConflict: "business_id" });
    }

    const base = returnBase(req);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: businessId,
      metadata: { business_id: businessId },
      subscription_data: { metadata: { business_id: businessId } },
      allow_promotion_codes: true,
      success_url: `${base}/business/upgrade?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/business/upgrade?checkout=cancelled`,
    });

    return json({ url: session.url });
  } catch (e) {
    console.error("stripe-checkout failed:", e);
    return json({ error: "Could not start checkout. Please try again." }, 500);
  }
});
