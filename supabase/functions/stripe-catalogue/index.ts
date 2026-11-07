// stripe-catalogue — makes sure every fixed-price thing a business can buy
// exists in Stripe as a product with its current price, and reports on it.
//
//   { action: "status" }  what's in Stripe and what isn't (read only)
//   { action: "sync" }    creates whatever is missing, then reports
//
// Covers:
//   · stripe_catalogue — the Visibility Plan (standard and hotel) and the
//     article, event, featured article and push notification packs
//     (supabase/sql/stripe_catalogue_2026_11.sql);
//   · accommodation_plan_tiers — found by the same lookup key and product id
//     accommodation-billing uses, so a plan made here is the one it sells;
//   · homepage_slot_packages — the same product/price shape as
//     stripe-slot-package.
//
// Never overwrites a product's name, description or tax settings once it
// exists: those can be edited in Stripe (and the accountant will set tax
// codes there). A price whose amount no longer matches is replaced by a new
// price — Stripe prices can't change — and the old one is archived, so
// anything already paid keeps pointing at what it was sold at.
//
// Admins only (is_admin()).
//
// Deploy:  supabase functions deploy stripe-catalogue --project-ref vnnmzppjswiazzrnkjtq
// Secrets: STRIPE_SECRET_KEY (optional STRIPE_PRICE_VISIBILITY_MONTHLY /
//          STRIPE_PRICE_VISIBILITY_YEARLY — the prices the standard plan was
//          sold at before this; adopted rather than duplicated)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

// ── Stripe over plain fetch (the SDK's client crashes this runtime; see
// accommodation-billing) ─────────────────────────────────────────────────────
// deno-lint-ignore no-explicit-any
function encode(params: Record<string, any>, prefix = "", out: string[] = []): string[] {
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((x) => out.push(`${encodeURIComponent(`${key}[]`)}=${encodeURIComponent(String(x))}`));
    else if (typeof v === "object") encode(v as Record<string, unknown>, key, out);
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
  }
  return out;
}

// deno-lint-ignore no-explicit-any
async function stripe(method: "GET" | "POST", path: string, params: Record<string, any> = {}): Promise<any> {
  const body = encode(params).join("&");
  const url = method === "GET" && body ? `https://api.stripe.com/v1/${path}?${body}` : `https://api.stripe.com/v1/${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${Deno.env.get("STRIPE_SECRET_KEY")}`,
      "Stripe-Version": "2024-06-20",
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: method === "POST" ? body : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.error?.message ?? `Stripe ${path} failed (${res.status})`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return data;
}

// deno-lint-ignore no-explicit-any
type Price = any;
const notFound = (e: unknown) => (e as { status?: number }).status === 404;

async function getPrice(id: string | null | undefined): Promise<Price | null> {
  if (!id) return null;
  try { return await stripe("GET", `prices/${id}`, { "expand[]": "product" }); }
  catch (e) { if (notFound(e)) return null; throw e; }
}
async function priceByLookup(lookupKey: string): Promise<Price | null> {
  const found = await stripe("GET", "prices", { lookup_keys: [lookupKey], active: "true", limit: 1, "expand[]": "data.product" });
  return found.data?.[0] ?? null;
}
async function productExists(id: string): Promise<boolean> {
  try { await stripe("GET", `products/${id}`); return true; }
  catch (e) { if (notFound(e)) return false; throw e; }
}

// A price is right when it's active, in pounds, the right amount and
// billing, and its product is active.
function matches(price: Price | null, amount: number, interval: string | null): boolean {
  if (!price || !price.active || price.currency !== "gbp" || price.unit_amount !== amount) return false;
  const priceInterval = price.recurring?.interval ?? null;
  if (priceInterval !== interval) return false;
  return typeof price.product === "object" ? price.product.active !== false : true;
}

const productIdOf = (price: Price | null) =>
  !price ? null : typeof price.product === "object" ? price.product.id : price.product;

type Item = {
  group: string;
  key: string;
  name: string;
  amountPence: number;
  interval: string | null;
  status: "ok" | "missing" | "price_differs";
  stripeProductId: string | null;
  stripePriceId: string | null;
  livemode: boolean | null;
  error?: string;
};

// ── stripe_catalogue rows ───────────────────────────────────────────────────
// deno-lint-ignore no-explicit-any
async function catalogueItem(row: any, sync: boolean, siblings: Map<string, string>): Promise<Item> {
  const group = row.product_key.startsWith("visibility") ? "Visibility Plan" : "Add-on packs";
  const base = { group, key: row.key, name: row.product_name, amountPence: row.amount_pence, interval: row.billing_interval };

  // What it was sold at before: the stored price, the old secret (standard
  // plan only), or the lookup key.
  const legacySecret = row.key === "visibility_monthly" ? Deno.env.get("STRIPE_PRICE_VISIBILITY_MONTHLY") ?? Deno.env.get("STRIPE_PRICE_PREMIUM")
    : row.key === "visibility_yearly" ? Deno.env.get("STRIPE_PRICE_VISIBILITY_YEARLY") : null;
  let price = await getPrice(row.stripe_price_id);
  if (!matches(price, row.amount_pence, row.billing_interval)) {
    const legacy = await getPrice(legacySecret);
    const byLookup = await priceByLookup(row.lookup_key);
    price = [legacy, byLookup].find((p) => matches(p, row.amount_pence, row.billing_interval)) ?? price ?? byLookup ?? legacy;
  }
  const ok = matches(price, row.amount_pence, row.billing_interval);

  if (ok || !sync) {
    if (ok && (row.stripe_price_id !== price.id || row.stripe_product_id !== productIdOf(price))) {
      await admin.from("stripe_catalogue").update({
        stripe_price_id: price.id, stripe_product_id: productIdOf(price), synced_at: new Date().toISOString(),
      }).eq("key", row.key);
    }
    if (ok) siblings.set(row.product_key, productIdOf(price)!);
    return {
      ...base,
      status: ok ? "ok" : price ? "price_differs" : "missing",
      stripeProductId: productIdOf(price),
      stripePriceId: price?.id ?? null,
      livemode: price?.livemode ?? null,
    };
  }

  // Create: reuse the product this row (or a sibling price) already has;
  // otherwise a new one with a stable id, so running twice never doubles up.
  let productId = productIdOf(price) ?? siblings.get(row.product_key) ?? row.stripe_product_id ?? null;
  if (productId && !(await productExists(productId))) productId = null;
  if (!productId) {
    productId = `mh_${row.product_key}`;
    if (await productExists(productId)) {
      await stripe("POST", `products/${productId}`, { active: "true" });
    } else {
      await stripe("POST", "products", {
        id: productId,
        name: row.product_name,
        description: row.description ?? undefined,
        metadata: { maidenhead_key: row.product_key },
      });
    }
  } else {
    // Brought back if it had been archived; name and description are left
    // as they are in Stripe.
    await stripe("POST", `products/${productId}`, { active: "true" });
  }

  const created = await stripe("POST", "prices", {
    product: productId,
    currency: "gbp",
    unit_amount: row.amount_pence,
    ...(row.billing_interval ? { recurring: { interval: row.billing_interval } } : {}),
    lookup_key: row.lookup_key,
    transfer_lookup_key: "true",
    nickname: row.billing_interval === "year" ? "Yearly" : row.billing_interval === "month" ? "Monthly" : row.product_name,
    metadata: { maidenhead_key: row.key },
  });
  // A one-price product shows that price first in Stripe.
  if (!row.billing_interval) await stripe("POST", `products/${productId}`, { default_price: created.id }).catch(() => {});
  // The old price stays for what was already sold, but can't be bought.
  if (price?.id && price.id !== created.id && price.active && price.id !== legacySecret) {
    await stripe("POST", `prices/${price.id}`, { active: "false" }).catch(() => {});
  }
  await admin.from("stripe_catalogue").update({
    stripe_product_id: productId, stripe_price_id: created.id, synced_at: new Date().toISOString(),
  }).eq("key", row.key);
  siblings.set(row.product_key, productId);
  return { ...base, status: "ok", stripeProductId: productId, stripePriceId: created.id, livemode: created.livemode };
}

// ── Accommodation plans (same scheme as accommodation-billing) ──────────────
// deno-lint-ignore no-explicit-any
async function accommodationItem(tier: any, interval: "month" | "year", sync: boolean): Promise<Item> {
  const amount = Math.round(Number(interval === "year" ? tier.yearly_price : tier.monthly_price) * 100);
  const lookupKey = `${tier.key}_${interval}_${amount}`;
  const productId = `accommodation_${String(tier.key).replace(/[^a-z0-9_]/gi, "_")}`;
  const base = { group: "Accommodation plans", key: lookupKey, name: `Maidenhead Accommodation — ${tier.name}`, amountPence: amount, interval };

  let price = await priceByLookup(lookupKey);
  if (!matches(price, amount, interval) && sync) {
    if (!(await productExists(productId))) {
      await stripe("POST", "products", { id: productId, name: base.name, metadata: { accommodation_tier: tier.key } });
    } else {
      await stripe("POST", `products/${productId}`, { active: "true" });
    }
    price = await stripe("POST", "prices", {
      product: productId, currency: "gbp", unit_amount: amount, recurring: { interval },
      lookup_key: lookupKey, transfer_lookup_key: "true",
      nickname: interval === "year" ? "Yearly" : "Monthly",
      metadata: { accommodation_tier: tier.key },
    });
  }
  const ok = matches(price, amount, interval);
  if (ok) {
    const col = interval === "year" ? "stripe_price_yearly" : "stripe_price_monthly";
    if (tier[col] !== price.id) await admin.from("accommodation_plan_tiers").update({ [col]: price.id }).eq("key", tier.key);
  }
  return {
    ...base,
    status: ok ? "ok" : price ? "price_differs" : "missing",
    stripeProductId: ok ? productIdOf(price) : null,
    stripePriceId: price?.id ?? null,
    livemode: price?.livemode ?? null,
  };
}

// ── Homepage slot packages (same shape as stripe-slot-package) ──────────────
// deno-lint-ignore no-explicit-any
async function homepageItem(pkg: any, sync: boolean): Promise<Item> {
  const slotLabel = pkg.homepage_slot_types?.label ?? pkg.slot_type;
  const name = `${slotLabel} — ${pkg.name}`;
  const base = { group: "Homepage packages", key: String(pkg.id), name, amountPence: pkg.price_pence, interval: null };
  let price = await getPrice(pkg.stripe_price_id);
  if (!matches(price, pkg.price_pence, null) && sync) {
    const metadata = {
      kind: "homepage_slot_package", package_id: String(pkg.id),
      slot_type: String(pkg.slot_type), duration_days: String(pkg.duration_days),
    };
    let productId: string | null = pkg.stripe_product_id ?? null;
    if (productId && !(await productExists(productId))) productId = null;
    if (productId) await stripe("POST", `products/${productId}`, { active: "true" });
    else {
      const product = await stripe("POST", "products", {
        name, description: `Homepage ${slotLabel} for ${pkg.duration_days} day${pkg.duration_days === 1 ? "" : "s"}.`, metadata,
      });
      productId = product.id;
    }
    if (price?.active) await stripe("POST", `prices/${price.id}`, { active: "false" }).catch(() => {});
    price = await stripe("POST", "prices", { currency: "gbp", unit_amount: pkg.price_pence, product: productId, metadata });
    await stripe("POST", `products/${productId}`, { default_price: price.id }).catch(() => {});
    await admin.from("homepage_slot_packages").update({ stripe_product_id: productId, stripe_price_id: price.id }).eq("id", pkg.id);
    price = await getPrice(price.id);
  }
  const ok = matches(price, pkg.price_pence, null);
  return {
    ...base,
    status: ok ? "ok" : price ? "price_differs" : "missing",
    stripeProductId: productIdOf(price),
    stripePriceId: price?.id ?? null,
    livemode: price?.livemode ?? null,
  };
}

// Runs one at a time per group: catalogue rows sharing a product must see
// each other's product, and Stripe rate-limits bursts anyway.
async function each<T>(list: T[], fn: (x: T) => Promise<Item>, fallback: (x: T) => Item): Promise<Item[]> {
  const out: Item[] = [];
  for (const x of list) {
    try { out.push(await fn(x)); }
    catch (e) { out.push({ ...fallback(x), error: (e as Error).message }); }
  }
  return out;
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
    const { data: isAdmin } = await caller.rpc("is_admin");
    if (!isAdmin) return json({ error: "Admins only." }, 403);

    const { action } = await req.json().catch(() => ({}));
    const sync = action === "sync";

    const [{ data: rows, error: e1 }, { data: tiers, error: e2 }, { data: packages, error: e3 }] = await Promise.all([
      admin.from("stripe_catalogue").select("*").eq("active", true).order("sort_order"),
      admin.from("accommodation_plan_tiers").select("*").eq("active", true).order("sort_order"),
      admin.from("homepage_slot_packages").select("*, homepage_slot_types(label)").eq("active", true).order("slot_type").order("price_pence"),
    ]);
    if (e1 || e2 || e3) throw e1 ?? e2 ?? e3;

    const siblings = new Map<string, string>();
    const missing = (group: string, key: string, name: string, amountPence: number, interval: string | null): Item =>
      ({ group, key, name, amountPence, interval, status: "missing", stripeProductId: null, stripePriceId: null, livemode: null });

    const catalogue = await each(rows ?? [], (r) => catalogueItem(r, sync, siblings),
      // deno-lint-ignore no-explicit-any
      (r: any) => missing(r.product_key.startsWith("visibility") ? "Visibility Plan" : "Add-on packs", r.key, r.product_name, r.amount_pence, r.billing_interval));

    // deno-lint-ignore no-explicit-any
    const paidTiers = (tiers ?? []).filter((t: any) => Number(t.monthly_price) > 0 || Number(t.yearly_price) > 0);
    // deno-lint-ignore no-explicit-any
    const tierJobs = paidTiers.flatMap((t: any) => [[t, "month"], [t, "year"]] as const)
      // deno-lint-ignore no-explicit-any
      .filter(([t, i]: any) => Number(i === "year" ? t.yearly_price : t.monthly_price) > 0);
    const accommodation = await each(tierJobs, ([t, i]) => accommodationItem(t, i, sync),
      // deno-lint-ignore no-explicit-any
      ([t, i]: any) => missing("Accommodation plans", `${t.key}_${i}`, `Maidenhead Accommodation — ${t.name}`,
        Math.round(Number(i === "year" ? t.yearly_price : t.monthly_price) * 100), i));

    const homepage = await each(packages ?? [], (p) => homepageItem(p, sync),
      // deno-lint-ignore no-explicit-any
      (p: any) => missing("Homepage packages", String(p.id), p.name, p.price_pence, null));

    const items = [...catalogue, ...accommodation, ...homepage];
    const livemode = items.find((i) => i.livemode != null)?.livemode ?? null;
    return json({ ok: true, livemode, items });
  } catch (e) {
    console.error("stripe-catalogue failed:", e);
    return json({ error: (e as Error).message ?? "Could not reach Stripe." }, 500);
  }
});
