// accommodation-billing — an accommodation management company's plan:
// Free (1 property) or 5 / 10 / 15 / 20 / 30 properties, monthly or yearly.
//
//   checkout  Free → a paid tier: a Stripe Checkout session.
//   change    Between paid tiers. More properties: takes effect at once and
//             Stripe charges the difference. Fewer properties (or switching
//             between monthly and yearly): takes effect at the end of the
//             billing period, through a subscription schedule; the owner's
//             choice of properties to keep is stored with it.
//   cancel    Back to Free at the end of the billing period, keeping the one
//             property the owner chose (data for the rest is kept).
//   undo      Cancels a scheduled downgrade or cancellation.
//
// The plan itself only changes when Stripe tells stripe-webhook, which also
// runs accommodation_after_plan_change() to apply the property limit. This
// function never writes the plan.
//
// Prices come from accommodation_plan_tiers. Each tier/interval/amount has
// its own Stripe Price, created on first use and found again by lookup key,
// so changing a price in the table creates a new Stripe Price for new
// subscribers and leaves existing subscribers on theirs.
//
// Deploy:  supabase functions deploy accommodation-billing
// Secrets: STRIPE_SECRET_KEY, SITE_URL (optional ALLOWED_ORIGIN_REGEX)

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

const ORIGIN_RE = new RegExp(
  Deno.env.get("ALLOWED_ORIGIN_REGEX") ?? "^(https://town-center-[a-z0-9-]+\\.vercel\\.app|http://localhost:\\d+)$",
);
function returnBase(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  return ORIGIN_RE.test(origin) ? origin : Deno.env.get("SITE_URL")!;
}

// ── Stripe over plain fetch ────────────────────────────────────────────────
// The Stripe SDK's request client crashes this edge runtime (see
// stripe-webhook), so requests are form-encoded by hand.

// deno-lint-ignore no-explicit-any
function encode(params: Record<string, any>, prefix = "", out: string[] = []): string[] {
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") encode(v as Record<string, unknown>, key, out);
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

type Tier = { key: string; name: string; max_properties: number; monthly_price: number; yearly_price: number; active: boolean };

// The Stripe Price for a tier at an interval, created the first time.
async function priceFor(tier: Tier, interval: "month" | "year"): Promise<string> {
  const amount = Math.round(Number(interval === "year" ? tier.yearly_price : tier.monthly_price) * 100);
  if (!(amount > 0)) throw new Error("This plan doesn't have a price yet.");
  const lookupKey = `${tier.key}_${interval}_${amount}`;
  const found = await stripe("GET", "prices", { "lookup_keys[]": lookupKey, active: "true", limit: 1 });
  if (found.data?.[0]?.id) return found.data[0].id;

  const productId = `accommodation_${tier.key.replace(/[^a-z0-9_]/gi, "_")}`;
  try {
    await stripe("GET", `products/${productId}`);
  } catch (e) {
    if ((e as { status?: number }).status !== 404) throw e;
    await stripe("POST", "products", {
      id: productId,
      name: `Maidenhead Accommodation — ${tier.name}`,
      metadata: { accommodation_tier: tier.key },
    });
  }
  const price = await stripe("POST", "prices", {
    product: productId,
    currency: "gbp",
    unit_amount: amount,
    recurring: { interval },
    lookup_key: lookupKey,
    metadata: { accommodation_tier: tier.key },
  });
  // Kept on the tier for reference (admin, support); the lookup key is what
  // finds it again.
  await admin.from("accommodation_plan_tiers")
    .update({ [interval === "year" ? "stripe_price_yearly" : "stripe_price_monthly"]: price.id, updated_at: new Date().toISOString() })
    .eq("key", tier.key);
  return price.id;
}

// Properties the owner can choose to keep: the ones using a slot now.
async function occupying(companyId: string): Promise<string[]> {
  const { data } = await admin.from("businesses").select("id")
    .eq("parent_id", companyId).in("property_state", ["live", "pending", "rejected"]);
  return (data ?? []).map((r) => r.id);
}

async function validKeep(companyId: string, keep: unknown, limit: number) {
  const ids = Array.isArray(keep) ? keep.map(String) : [];
  const current = await occupying(companyId);
  if (current.length <= limit) return { ok: true as const, keep: current };
  if (ids.length === 0) return { ok: false as const, error: `Choose which ${limit === 1 ? "property" : `${limit} properties`} should stay live.` };
  if (ids.length > limit) return { ok: false as const, error: `The new plan allows ${limit} ${limit === 1 ? "property" : "properties"}.` };
  if (ids.some((id) => !current.includes(id))) return { ok: false as const, error: "Choose from your properties that are using a slot." };
  return { ok: true as const, keep: ids };
}

// deno-lint-ignore no-explicit-any
async function releaseSchedule(sub: any) {
  const scheduleId = typeof sub.schedule === "string" ? sub.schedule : sub.schedule?.id;
  if (!scheduleId) return;
  const schedule = await stripe("GET", `subscription_schedules/${scheduleId}`);
  if (["not_started", "active"].includes(schedule.status)) {
    await stripe("POST", `subscription_schedules/${scheduleId}/release`);
  }
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

    const { action, businessId, tier: tierKey, interval: rawInterval, keep } = await req.json().catch(() => ({}));
    if (!businessId) return json({ error: "Missing business." }, 400);
    const interval: "month" | "year" = rawInterval === "year" ? "year" : "month";

    // Only the approved owner of an approved accommodation company.
    const { data: member } = await admin
      .from("business_users")
      .select("role, status, businesses(name, status, kind)")
      .eq("business_id", businessId)
      .eq("auth_user_id", user.id)
      .maybeSingle();
    // deno-lint-ignore no-explicit-any
    const biz = (member as any)?.businesses;
    if (!member || member.role !== "Owner" || member.status !== "approved" || biz?.status !== "Approved") {
      return json({ error: "Only the business owner can change the plan." }, 403);
    }
    if (biz?.kind !== "accommodation_company") {
      return json({ error: "Accommodation plans are for accommodation companies." }, 400);
    }

    const [{ data: tiers }, { data: sub }] = await Promise.all([
      admin.from("accommodation_plan_tiers").select("*").eq("active", true),
      admin.from("business_subscriptions")
        .select("plan, site_tier_key, stripe_customer_id, stripe_subscription_id, cancel_at_period_end, billing_interval, current_period_end")
        .eq("business_id", businessId).maybeSingle(),
    ]);
    const tierByKey = new Map((tiers ?? []).map((t: Tier) => [t.key, t]));
    const active = sub?.plan === "premium" && !!sub?.stripe_subscription_id;
    const currentTier = active ? tierByKey.get(sub?.site_tier_key ?? "") : tierByKey.get("acc-free");

    // ── Undo a scheduled downgrade or cancellation ──
    if (action === "undo") {
      if (!active) return json({ error: "There's no paid plan to keep." }, 409);
      const stripeSub = await stripe("GET", `subscriptions/${sub!.stripe_subscription_id}`);
      await releaseSchedule(stripeSub);
      if (stripeSub.cancel_at_period_end) {
        await stripe("POST", `subscriptions/${stripeSub.id}`, { cancel_at_period_end: "false" });
      }
      await admin.from("accommodation_plan_changes").delete().eq("business_id", businessId);
      return json({ ok: true });
    }

    // ── Cancel: back to Free at the end of the period ──
    if (action === "cancel") {
      if (!active) return json({ error: "You're already on the Free plan." }, 409);
      const check = await validKeep(businessId, keep, 1);
      if (!check.ok) return json({ error: check.error }, 400);
      const stripeSub = await stripe("GET", `subscriptions/${sub!.stripe_subscription_id}`);
      await releaseSchedule(stripeSub);
      const updated = await stripe("POST", `subscriptions/${stripeSub.id}`, { cancel_at_period_end: "true" });
      await admin.from("accommodation_plan_changes").upsert({
        business_id: businessId, change: "cancel", target_tier: "acc-free", target_interval: null,
        keep: check.keep.slice(0, 1),
        effective_at: new Date(updated.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "business_id" });
      return json({ ok: true, effectiveAt: updated.current_period_end });
    }

    const target = tierByKey.get(String(tierKey ?? ""));
    if (!target || target.key === "acc-free") return json({ error: "Choose one of the paid plans." }, 400);
    const priceId = await priceFor(target, interval);

    // ── Checkout: Free → paid ──
    if (action === "checkout") {
      if (active && !sub?.cancel_at_period_end) return json({ error: "You already have a paid plan — change it instead." }, 409);
      let customerId = sub?.stripe_customer_id;
      if (!customerId) {
        const customer = await stripe("POST", "customers", {
          email: user.email ?? undefined, name: biz?.name ?? undefined, metadata: { business_id: businessId },
        });
        customerId = customer.id;
        await admin.from("business_subscriptions")
          .upsert({ business_id: businessId, stripe_customer_id: customerId }, { onConflict: "business_id" });
      }
      const base = returnBase(req);
      const metadata = { business_id: businessId, accommodation_tier: target.key };
      const session = await stripe("POST", "checkout/sessions", {
        mode: "subscription",
        customer: customerId,
        client_reference_id: businessId,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata,
        subscription_data: { metadata },
        allow_promotion_codes: "true",
        success_url: `${base}/business/upgrade?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/business/upgrade?checkout=cancelled`,
      });
      return json({ url: session.url });
    }

    // ── Change between paid tiers ──
    if (action === "change") {
      if (!active) return json({ error: "Choose a plan to subscribe to first." }, 409);
      const stripeSub = await stripe("GET", `subscriptions/${sub!.stripe_subscription_id}`);
      const item = stripeSub.items?.data?.[0];
      const currentPrice = item?.price?.id;
      const currentInterval = item?.price?.recurring?.interval === "year" ? "year" : "month";
      if (target.key === currentTier?.key && interval === currentInterval && !stripeSub.cancel_at_period_end) {
        return json({ error: "You're already on this plan." }, 409);
      }

      // A new choice replaces any change already scheduled.
      await releaseSchedule(stripeSub);
      await admin.from("accommodation_plan_changes").delete().eq("business_id", businessId);

      const upgrade = target.max_properties > (currentTier?.max_properties ?? 1);
      if (upgrade) {
        // More properties straight away; Stripe charges the difference now.
        await stripe("POST", `subscriptions/${stripeSub.id}`, {
          items: [{ id: item.id, price: priceId }],
          proration_behavior: "always_invoice",
          cancel_at_period_end: "false",
          metadata: { business_id: businessId, accommodation_tier: target.key },
        });
        return json({ ok: true, effective: "now" });
      }

      // Fewer properties (or a billing interval change): at the end of the
      // period, keeping the properties the owner chose.
      const check = await validKeep(businessId, keep, target.max_properties);
      if (!check.ok) return json({ error: check.error }, 400);
      if (stripeSub.cancel_at_period_end) {
        await stripe("POST", `subscriptions/${stripeSub.id}`, { cancel_at_period_end: "false" });
      }
      const schedule = await stripe("POST", "subscription_schedules", { from_subscription: stripeSub.id });
      const phase = schedule.phases?.[0];
      await stripe("POST", `subscription_schedules/${schedule.id}`, {
        end_behavior: "release",
        proration_behavior: "none",
        phases: [
          { items: [{ price: currentPrice, quantity: 1 }], start_date: phase.start_date, end_date: stripeSub.current_period_end },
          { items: [{ price: priceId, quantity: 1 }], iterations: 1, metadata: { business_id: businessId, accommodation_tier: target.key } },
        ],
      });
      await admin.from("accommodation_plan_changes").upsert({
        business_id: businessId, change: "downgrade", target_tier: target.key, target_interval: interval,
        keep: check.keep,
        effective_at: new Date(stripeSub.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "business_id" });
      return json({ ok: true, effective: "period_end", effectiveAt: stripeSub.current_period_end });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (e) {
    console.error("accommodation-billing failed:", e);
    return json({ error: (e as Error).message || "Could not change the plan. Please try again." }, 500);
  }
});
