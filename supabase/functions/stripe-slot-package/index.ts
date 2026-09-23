// stripe-slot-package — keeps the Stripe catalogue in step with the homepage
// slot packages admin creates on the Homepage Slots page.
//
// Each package is one Stripe product with one active price. A Stripe price is
// immutable, so changing a package's price creates a new one and archives the
// old — anything already paid for keeps pointing at the price it was sold at.
//
// Called from the admin panel with the admin's own session; the function
// checks is_admin() before touching Stripe or the database.
//
// Deploy:  supabase functions deploy stripe-slot-package --project-ref vnnmzppjswiazzrnkjtq
// Secrets: STRIPE_SECRET_KEY

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const caller = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: "Please sign in again." }, 401);
    const { data: isAdmin } = await caller.rpc("is_admin");
    if (!isAdmin) return json({ error: "Admins only." }, 403);

    const { packageId, action } = await req.json().catch(() => ({}));
    if (!packageId) return json({ error: "Missing package." }, 400);

    const { data: pkg } = await admin
      .from("homepage_slot_packages")
      .select("*, homepage_slot_types(label)")
      .eq("id", packageId)
      .maybeSingle();
    if (!pkg) return json({ error: "That package no longer exists." }, 404);

    // Deleting or deactivating: archive the Stripe price and product so it
    // can't be bought, but keep them for the payments already made.
    if (action === "archive" || pkg.active === false) {
      if (pkg.stripe_price_id) {
        await stripe.prices.update(pkg.stripe_price_id, { active: false }).catch(() => {});
      }
      if (pkg.stripe_product_id) {
        await stripe.products.update(pkg.stripe_product_id, { active: false }).catch(() => {});
      }
      return json({ ok: true, archived: true });
    }

    const slotLabel = pkg.homepage_slot_types?.label ?? pkg.slot_type;
    const productName = `${slotLabel} — ${pkg.name}`;
    const description = `Homepage ${slotLabel} for ${pkg.duration_days} day${pkg.duration_days === 1 ? "" : "s"}.`;
    const metadata = {
      kind: "homepage_slot_package",
      package_id: String(pkg.id),
      slot_type: String(pkg.slot_type),
      duration_days: String(pkg.duration_days),
    };

    // One product per package, reused across price changes.
    let productId: string | null = pkg.stripe_product_id ?? null;
    if (productId) {
      await stripe.products
        .update(productId, { name: productName, description, active: true, metadata })
        .catch(async () => { productId = null; });
    }
    if (!productId) {
      const product = await stripe.products.create({ name: productName, description, metadata });
      productId = product.id;
    }

    // Reuse the existing price when the amount hasn't moved; otherwise mint a
    // new one and retire the old.
    let priceId: string | null = null;
    if (pkg.stripe_price_id) {
      const existing = await stripe.prices.retrieve(pkg.stripe_price_id).catch(() => null);
      if (existing && existing.active && existing.unit_amount === pkg.price_pence && existing.currency === "gbp") {
        priceId = existing.id;
      } else if (existing) {
        await stripe.prices.update(existing.id, { active: false }).catch(() => {});
      }
    }
    if (!priceId) {
      const price = await stripe.prices.create({
        currency: "gbp",
        unit_amount: pkg.price_pence,
        product: productId!,
        metadata,
      });
      priceId = price.id;
      await stripe.products.update(productId!, { default_price: priceId }).catch(() => {});
    }

    await admin
      .from("homepage_slot_packages")
      .update({ stripe_product_id: productId, stripe_price_id: priceId })
      .eq("id", pkg.id);

    return json({ ok: true, stripeProductId: productId, stripePriceId: priceId });
  } catch (e) {
    console.error("stripe-slot-package failed:", e);
    return json({ error: "Could not sync this package with Stripe." }, 500);
  }
});
