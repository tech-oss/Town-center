// stripe-checkout — starts a Stripe Checkout session for the Visibility Plan,
// for a homepage slot booking (kind: "placement"), or for add-on slots —
// articles, events, featured articles and push notification packs
// (kind: "addon_slots").
//
// Called by the business dashboard's Subscribe and Homepage Promotions flows. The browser is sent to
// the returned Stripe-hosted page to pay; the plan itself only changes when
// Stripe confirms payment to stripe-webhook, never from this function or the
// browser.
//
// Prices: the stripe_catalogue table (admin → Stripe Products), falling back
// to the secrets below for the Visibility Plan.
//
// Deploy:  supabase functions deploy stripe-checkout
// Secrets: STRIPE_SECRET_KEY, SITE_URL,
//          STRIPE_PRICE_VISIBILITY_MONTHLY (£29.99/month),
//          STRIPE_PRICE_VISIBILITY_YEARLY (£329/year)
//          optional STRIPE_PRICE_HOTEL_MONTHLY (£39.99/month) and
//          STRIPE_PRICE_HOTEL_YEARLY (£399/year) — without them the hotel
//          prices are found in Stripe by lookup key, and made the first time
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
// Hotels and accommodation (business type "hotel") pay more for the
// Visibility Plan (Data/plans.js → HOTEL_BILLING_OPTIONS). Their Stripe
// prices come from the secrets when set; otherwise they're found by lookup
// key, and created — under one "Visibility Plan — Hotels & Accommodation"
// product — the first time a hotel subscribes.
const HOTEL_PRICES = {
  month: { pence: 3999, key: "visibility_hotel_monthly", secret: "STRIPE_PRICE_HOTEL_MONTHLY" },
  year: { pence: 39900, key: "visibility_hotel_yearly", secret: "STRIPE_PRICE_HOTEL_YEARLY" },
} as const;

async function hotelPriceId(interval: "month" | "year") {
  const spec = HOTEL_PRICES[interval];
  const fromSecret = Deno.env.get(spec.secret);
  if (fromSecret) return fromSecret;
  const { data: existing } = await stripe.prices.list({
    lookup_keys: [HOTEL_PRICES.month.key, HOTEL_PRICES.year.key], active: true, limit: 10,
  });
  const match = existing.find((p: Stripe.Price) => p.lookup_key === spec.key && p.unit_amount === spec.pence && p.currency === "gbp");
  if (match) return match.id;
  const sibling = existing.find((p: Stripe.Price) => p.lookup_key !== spec.key);
  const product = typeof sibling?.product === "string" ? sibling.product : sibling?.product?.id;
  const price = await stripe.prices.create({
    currency: "gbp",
    unit_amount: spec.pence,
    recurring: { interval },
    lookup_key: spec.key,
    transfer_lookup_key: true,
    metadata: { plan: "premium", audience: "hotel" },
    ...(product
      ? { product }
      : { product_data: { name: "Visibility Plan — Hotels & Accommodation", metadata: { plan: "premium" } } }),
  });
  return price.id;
}

// Everything sold at a fixed price is a product in Stripe, listed in
// stripe_catalogue (admin → Stripe Products creates them). Checkout sells
// that product, so Stripe's reports, receipts and tax settings name what was
// bought. Before, add-on packs were one-off amounts with no product behind
// them at all.
// deno-lint-ignore no-explicit-any
type CatalogueRow = any;
async function catalogueRow(key: string): Promise<CatalogueRow | null> {
  const { data } = await admin.from("stripe_catalogue").select("*").eq("key", key).eq("active", true).maybeSingle();
  return data ?? null;
}

// The Stripe price for a catalogue row: its stored price while that is still
// right, otherwise the price carrying its lookup key. Null when neither
// exists yet — the caller then falls back rather than refusing the sale.
async function catalogueStripePrice(row: CatalogueRow): Promise<string | null> {
  // deno-lint-ignore no-explicit-any
  const right = (p: any) => !!p && p.active && p.currency === "gbp" && p.unit_amount === row.amount_pence
    && (p.recurring?.interval ?? null) === (row.billing_interval ?? null);
  if (row.stripe_price_id) {
    const stored = await stripe.prices.retrieve(row.stripe_price_id).catch(() => null);
    if (right(stored)) return stored!.id;
  }
  const { data } = await stripe.prices.list({ lookup_keys: [row.lookup_key], active: true, limit: 1 });
  const found = data?.[0];
  if (!right(found)) return null;
  await admin.from("stripe_catalogue").update({
    stripe_price_id: found.id,
    stripe_product_id: typeof found.product === "string" ? found.product : found.product?.id,
  }).eq("key", row.key);
  return found.id;
}

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

    const { businessId, interval, kind, slotType, packageId, pack, addon } = await req.json().catch(() => ({}));
    if (!businessId) return json({ error: "Missing business." }, 400);

    // Only the approved Owner of an approved business can pay for it.
    const { data: member } = await admin
      .from("business_users")
      // business_type lives on the listing, not on businesses. Asking for it
      // on businesses made this whole read fail, so every owner was told
      // "Only the business owner can do this" and nothing could be bought.
      .select("role, status, businesses(name, status, kind)")
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

    // One Stripe customer per business, reused across every payment — unless
    // it no longer exists in Stripe (deleted there, say). Reusing a deleted
    // customer made every checkout for that business fail with "Could not
    // start checkout", so a new one is made in its place.
    let customerId = sub?.stripe_customer_id;
    if (customerId) {
      const existing = await stripe.customers.retrieve(customerId).catch((e: { code?: string; statusCode?: number }) => {
        if (e?.code === "resource_missing" || e?.statusCode === 404) return null;
        throw e;
      });
      // deno-lint-ignore no-explicit-any
      if (!existing || (existing as any).deleted) {
        console.warn("Stripe customer gone; making a new one", businessId, customerId);
        customerId = null;
      }
    }
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
        p_package_id: packageId ?? null,
      });
      if (holdError || !hold) {
        return json({ error: holdError?.message ?? "That slot couldn't be reserved." }, 409);
      }
      const { data: type } = await admin
        .from("homepage_slot_types").select("label").eq("key", slotType).single();
      // The package decides the price and the length — and carries the Stripe
      // price admin created for it, so Checkout sells the catalogue entry
      // itself rather than an ad-hoc amount.
      const { data: pkg } = packageId
        ? await admin.from("homepage_slot_packages")
            .select("name, duration_days, stripe_price_id").eq("id", packageId).maybeSingle()
        : { data: null };
      const days = pkg?.duration_days
        ?? Math.round((new Date(hold.ends_at).getTime() - new Date(hold.starts_at).getTime()) / 86_400_000);

      const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", {
        timeZone: "Europe/London", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
      const metadata = {
        kind: "placement", business_id: businessId, placement_id: hold.id,
        slot_type: slotType, package_id: packageId ?? "", duration_days: String(days),
      };
      // The package's Stripe price is used only while it charges what the
      // business was shown (the amount on the hold). If admin changed the
      // price and Stripe wasn't updated, the stored price is still the old
      // one, so the amount is sent directly instead.
      const storedPrice = pkg?.stripe_price_id
        ? await stripe.prices.retrieve(pkg.stripe_price_id).catch(() => null)
        : null;
      const priceIsCurrent = !!storedPrice && storedPrice.active && storedPrice.currency === "gbp"
        && storedPrice.unit_amount === hold.amount_pence;
      if (pkg?.stripe_price_id && !priceIsCurrent) {
        console.warn("Homepage package price out of step with Stripe; charging the hold amount", packageId);
      }
      // Stripe won't take a description alongside a catalogue price, so the
      // dates ride in the session's custom text instead.
      const lineItem = priceIsCurrent
        ? { quantity: 1, price: storedPrice!.id }
        : {
            quantity: 1,
            price_data: {
              currency: "gbp",
              unit_amount: hold.amount_pence,
              product_data: {
                name: `Homepage ${type?.label ?? "slot"}${pkg?.name ? ` — ${pkg.name}` : ` — ${days} days`}`,
                description: `${fmt(hold.starts_at)} to ${fmt(hold.ends_at)} (UK time)`,
              },
            },
          };
      try {
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer: customerId,
          client_reference_id: businessId,
          line_items: [lineItem],
          custom_text: {
            submit: { message: `Your slot runs ${fmt(hold.starts_at)} to ${fmt(hold.ends_at)} (UK time).` },
          },
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

    // Add-on slots: articles, events and featured articles. The packs are
    // defined here, never taken from the browser, so a caller can't invent a
    // price. Each slot is valid 12 months and is re-usable for different
    // content during that time; the slots are granted by the webhook once
    // Stripe confirms payment. Being on the homepage is a separate purchase.
    if (kind === "article_slots" || kind === "addon_slots") {
      const CATALOGUE: Record<string, { noun: string; packs: Record<string, number> }> = {
        article:           { noun: "article slot",          packs: { "1": 999,  "3": 2499,  "6": 3999  } },
        event:             { noun: "event slot",            packs: { "1": 999,  "3": 2499,  "6": 3999  } },
        featured_article:  { noun: "featured article slot", packs: { "1": 4999, "3": 11999, "6": 19999 } },
        // Consumed one at a time, not a reusable slot — but the same 12-month
        // purchase shape (see push_notification_addon_2026_09.sql).
        push_notification: { noun: "push notification",     packs: { "1": 1499, "3": 3499, "6": 5999, "12": 9999 } },
      };
      // kind "article_slots" is the older call shape, which only ever meant
      // articles.
      const slotKind = kind === "article_slots" ? "article" : String(addon ?? "");
      const entry = CATALOGUE[slotKind];
      if (!entry || !entry.packs[String(pack)]) return json({ error: "Choose one of the packages offered." }, 400);
      // The catalogue's amount and Stripe product; the list above is only the
      // fallback for before the catalogue exists.
      const row = await catalogueRow(`addon_${slotKind}_${Number(pack)}`);
      const amount: number = row?.amount_pence ?? entry.packs[String(pack)];
      const catalogPrice = row ? await catalogueStripePrice(row) : null;

      const quantity = Number(pack);
      // "Extra" reads right for a slot on top of what's included (article
      // slots start with 3 free) — a push credit has no included baseline to
      // be extra to, so it's just "N push notifications".
      const name = slotKind === "push_notification"
        ? `${quantity} push notification${quantity === 1 ? "" : "s"}`
        : `${quantity} extra ${entry.noun}${quantity === 1 ? "" : "s"}`;
      const description = slotKind === "push_notification"
        ? "Valid 12 months. Use them whenever you like — each one sent uses up one credit."
        : "Valid 12 months. Re-usable — edit or replace the content as often as you like.";

      // Add-ons ride on an active Visibility Plan.
      if (sub?.plan !== "premium") {
        return json({ error: "Add-ons are available with an active Business Visibility subscription." }, 409);
      }

      const metadata = {
        kind: "addon_slots",
        addon: slotKind,
        business_id: businessId,
        quantity: String(quantity),
      };
      // Back to the page the slots were bought from: a featured article slot
      // belongs to Featured Articles, not the News & Offers tab.
      const backTo = slotKind === "event" ? "events"
        : slotKind === "featured_article" ? "featured-articles"
        : slotKind === "push_notification" ? "push-notifications"
        : "articles";
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        client_reference_id: businessId,
        line_items: [catalogPrice
          ? { quantity: 1, price: catalogPrice }
          : {
              quantity: 1,
              price_data: {
                currency: "gbp",
                unit_amount: amount,
                product_data: {
                  name: row?.product_name ?? name,
                  description: row?.description ?? description,
                },
              },
            }],
        metadata,
        payment_intent_data: { metadata },
        invoice_creation: { enabled: true, invoice_data: { metadata } },
        success_url: `${base}/business/${backTo}?slots=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/business/${backTo}?slots=cancelled`,
      });
      return json({ url: session.url });
    }

    // An accommodation company buys an accommodation plan (5–30 properties)
    // through accommodation-billing, never the Visibility Plan.
    // deno-lint-ignore no-explicit-any
    if ((member as any).businesses?.kind === "accommodation_company") {
      return json({ error: "Accommodation companies choose an accommodation plan instead." }, 409);
    }

    // Monthly or annual Visibility Plan. Only these two Stripe prices can be
    // bought — the price is chosen here, never supplied by the browser.
    // deno-lint-ignore no-explicit-any
    const { data: listing } = await admin
      .from("business_listings").select("business_type").eq("business_id", businessId).maybeSingle();
    const hotel = listing?.business_type === "hotel";
    const yearly = interval === "year";
    // The catalogue's product first; then the older ways of finding the
    // same price, so nothing stops selling before the catalogue is synced.
    const planRow = await catalogueRow(`visibility_${hotel ? "hotel_" : ""}${yearly ? "yearly" : "monthly"}`);
    const catalogPrice = planRow ? await catalogueStripePrice(planRow) : null;
    // Admin sets this price on Stripe Products. With a catalogue row, its
    // amount is what's charged — even if its Stripe price is missing, so a
    // price admin changed is never undercut by an older fixed price.
    const priceId = catalogPrice ?? (planRow ? null : hotel
      ? await hotelPriceId(yearly ? "year" : "month")
      : yearly
        ? Deno.env.get("STRIPE_PRICE_VISIBILITY_YEARLY")
        : (Deno.env.get("STRIPE_PRICE_VISIBILITY_MONTHLY") ?? Deno.env.get("STRIPE_PRICE_PREMIUM")));
    const planLine = priceId
      ? { price: priceId, quantity: 1 }
      : planRow
        ? {
            quantity: 1,
            price_data: {
              currency: "gbp",
              unit_amount: planRow.amount_pence,
              recurring: { interval: yearly ? "year" : "month" },
              ...(planRow.stripe_product_id
                ? { product: planRow.stripe_product_id }
                : { product_data: { name: planRow.product_name } }),
            },
          }
        : null;
    if (!planLine) {
      console.error("Missing Stripe price secret for interval", interval);
      return json({ error: "This billing option isn't available yet." }, 503);
    }

    if (sub?.plan === "premium" && sub?.stripe_subscription_id && !sub?.cancel_at_period_end) {
      return json({ error: "This business is already on the Visibility Plan." }, 409);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      // deno-lint-ignore no-explicit-any
      line_items: [planLine as any],
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
    // Stripe's own reason, when it gave one, so the next problem can be read
    // off the screen rather than guessed at.
    // deno-lint-ignore no-explicit-any
    const reason = (e as any)?.type === "StripeInvalidRequestError" ? ` (${(e as Error).message})` : "";
    return json({ error: `Could not start checkout. Please try again.${reason}` }, 500);
  }
});
