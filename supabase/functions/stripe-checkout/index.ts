// stripe-checkout — starts a Stripe Checkout session for the Visibility Plan,
// for a homepage slot booking (kind: "placement"), or for extra article slots
// (kind: "article_slots").
//
// Called by the business dashboard's Subscribe and Homepage Promotions flows. The browser is sent to
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

    const { businessId, interval, kind, slotType, pack } = await req.json().catch(() => ({}));
    if (!businessId) return json({ error: "Missing business." }, 400);

    // Only the approved Owner of an approved business can pay for it.
    const { data: member } = await admin
      .from("business_users")
      .select("role, status, businesses(name, status)")
      .eq("business_id", businessId)
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (!member || member.role !== "Owner" || member.status !== "approved" || member.businesses?.status !== "Approved") {
      return json({ error: "Only the business owner can do this." }, 403);
    }

    const { data: sub } = await admin
      .from("business_subscriptions")
      .select("plan, stripe_customer_id, stripe_subscription_id, cancel_at_period_end")
      .eq("business_id", businessId)
      .maybeSingle();

    // One Stripe customer per business, reused across every payment.
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

    if (kind === "placement") {
      // Reserve the next free slot as the caller, so the database checks
      // ownership and availability; the price comes from that reservation.
      const { data: hold, error: holdError } = await caller.rpc("book_homepage_slot", {
        p_business_id: businessId,
        p_slot_type: slotType,
      });
      if (holdError || !hold) {
        return json({ error: holdError?.message ?? "That slot couldn't be reserved." }, 409);
      }
      const { data: type } = await admin
        .from("homepage_slot_types").select("label, duration_days").eq("key", slotType).single();

      const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", {
        timeZone: "Europe/London", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
      const metadata = { kind: "placement", business_id: businessId, placement_id: hold.id, slot_type: slotType };
      try {
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer: customerId,
          client_reference_id: businessId,
          line_items: [{
            quantity: 1,
            price_data: {
              currency: "gbp",
              unit_amount: hold.amount_pence,
              product_data: {
                name: `Homepage ${type?.label ?? "slot"} — ${type?.duration_days ?? ""} days`,
                description: `${fmt(hold.starts_at)} to ${fmt(hold.ends_at)} (UK time)`,
              },
            },
          }],
          metadata,
          payment_intent_data: { metadata },
          // An invoice for the business's billing history.
          invoice_creation: { enabled: true, invoice_data: { metadata } },
          // The slot is held for 40 minutes; checkout closes before that (Stripe
          // needs at least 30 minutes).
          expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
          success_url: `${base}/business/billing?promotion=success&placement=${hold.id}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${base}/business/billing?promotion=cancelled&placement=${hold.id}`,
        });
        await admin.from("homepage_placements").update({ stripe_session_id: session.id }).eq("id", hold.id);
        return json({ url: session.url });
      } catch (e) {
        await admin.from("homepage_placements").delete().eq("id", hold.id).eq("status", "held");
        throw e;
      }
    }

    // Extra article slots. The packs are defined here, never taken from the
    // browser, so a caller can't invent a price. Each slot is valid 12 months
    // and can be re-used for different content during that time; the slots
    // themselves are granted by the webhook once Stripe confirms payment.
    if (kind === "article_slots") {
      const PACKS: Record<string, { quantity: number; amount: number; name: string }> = {
        "1": { quantity: 1, amount: 999,  name: "1 extra article slot" },
        "3": { quantity: 3, amount: 2499, name: "3 extra article slots" },
        "6": { quantity: 6, amount: 3999, name: "6 extra article slots" },
      };
      const chosen = PACKS[String(pack)];
      if (!chosen) return json({ error: "Choose one of the article slot packages." }, 400);

      // Add-ons ride on an active Visibility Plan.
      if (sub?.plan !== "premium") {
        return json({ error: "Extra article slots are available with an active Business Visibility subscription." }, 409);
      }

      const metadata = {
        kind: "article_slots",
        business_id: businessId,
        quantity: String(chosen.quantity),
      };
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        client_reference_id: businessId,
        line_items: [{
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: chosen.amount,
            product_data: {
              name: chosen.name,
              description: "Valid 12 months. Re-usable — edit or replace the content as often as you like.",
            },
          },
        }],
        metadata,
        payment_intent_data: { metadata },
        invoice_creation: { enabled: true, invoice_data: { metadata } },
        success_url: `${base}/business/articles?slots=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/business/articles?slots=cancelled`,
      });
      return json({ url: session.url });
    }

    // Monthly or annual Visibility Plan. Only these two Stripe prices can be
    // bought — the price is chosen here, never supplied by the browser.
    const priceId = interval === "year"
      ? Deno.env.get("STRIPE_PRICE_VISIBILITY_YEARLY")
      : (Deno.env.get("STRIPE_PRICE_VISIBILITY_MONTHLY") ?? Deno.env.get("STRIPE_PRICE_PREMIUM"));
    if (!priceId) {
      console.error("Missing Stripe price secret for interval", interval);
      return json({ error: "This billing option isn't available yet." }, 503);
    }

    if (sub?.plan === "premium" && sub?.stripe_subscription_id && !sub?.cancel_at_period_end) {
      return json({ error: "This business is already on the Visibility Plan." }, 409);
    }

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
