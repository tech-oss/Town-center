// stripe-webhook — the single source of truth for a business's paid plan.
//
// Stripe calls this after every billing event. Each delivery is verified
// against the signing secret, recorded once in stripe_events (Stripe retries),
// and then mirrored onto business_subscriptions / business_payments with the
// service role. Nothing in the browser can set a paid plan.
//
// Deploy:  supabase functions deploy stripe-webhook --no-verify-jwt
//          (Stripe can't send a Supabase JWT; the Stripe signature is the auth)
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
//
// Stripe → Developers → Webhooks → endpoint URL:
//   https://<project-ref>.supabase.co/functions/v1/stripe-webhook
// Events: checkout.session.completed, checkout.session.expired,
//   customer.subscription.created,
//   customer.subscription.updated, customer.subscription.deleted,
//   invoice.paid, invoice.payment_failed

import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

// Reads a Stripe object straight from the REST API. The SDK's own request
// client crashes this edge runtime ("Deno.core.runMicrotasks() is not
// supported"), so API reads use fetch; the SDK is only used to verify
// signatures. Pinned to the API version this code was written against.
// deno-lint-ignore no-explicit-any
async function stripeGet(path: string): Promise<any> {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: {
      Authorization: `Bearer ${Deno.env.get("STRIPE_SECRET_KEY")}`,
      "Stripe-Version": "2024-06-20",
    },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Stripe ${path}: ${body?.error?.message ?? res.status}`);
  return body;
}
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const text = (body: string, status = 200) => new Response(body, { status });

// A Stripe subscription in one of these states still grants Premium; past_due
// keeps it during Stripe's payment retries rather than cutting a business off
// at the first declined card.
const PREMIUM_STATES = new Set(["active", "trialing", "past_due"]);

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  trialing: "Active",
  past_due: "Past Due",
  unpaid: "Payment Failed",
  canceled: "Cancelled",
  incomplete: "Incomplete",
  incomplete_expired: "Cancelled",
  paused: "Paused",
};

async function businessIdFor(sub: Stripe.Subscription): Promise<string | null> {
  if (sub.metadata?.business_id) return sub.metadata.business_id;
  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const { data } = await admin
    .from("business_subscriptions").select("business_id").eq("stripe_customer_id", customer).maybeSingle();
  return data?.business_id ?? null;
}

async function logActivity(businessId: string, action: string, title: string, detail?: string) {
  await admin.from("business_activity").insert({
    business_id: businessId, action, entity_type: "subscription", entity_id: businessId,
    title, detail: detail ?? null, actor: "system",
  });
}

async function applySubscription(sub: Stripe.Subscription) {
  const businessId = await businessIdFor(sub);
  if (!businessId) {
    console.warn("No business for subscription", sub.id);
    return;
  }

  const premium = PREMIUM_STATES.has(sub.status);
  const price = sub.items.data[0]?.price;
  // Annual billing is stored with a monthly-equivalent fee so revenue figures
  // (MRR) stay comparable across monthly and yearly subscribers.
  const interval = price?.recurring?.interval === "year" ? "year" : "month";
  const amount = (price?.unit_amount ?? 0) / 100;
  const monthlyFee = interval === "year" ? Math.round((amount / 12) * 100) / 100 : amount;
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const { data: before } = await admin
    .from("business_subscriptions").select("plan").eq("business_id", businessId).maybeSingle();

  const planStatus = premium && sub.cancel_at_period_end ? "Cancelling" : (STATUS_LABEL[sub.status] ?? sub.status);

  const { error } = await admin.from("business_subscriptions").upsert({
    business_id: businessId,
    plan: premium ? "premium" : "free",
    upgrade_plan_key: premium ? "premium" : "free",
    monthly_fee: premium ? monthlyFee : 0,
    billing_interval: premium ? interval : null,
    price_amount: premium ? amount : null,
    plan_status: planStatus,
    cancelled: !premium,
    stripe_customer_id: customer,
    stripe_subscription_id: premium ? sub.id : null,
    // Paid through Stripe now, so no longer an admin-granted (non-paying) plan.
    granted_by_admin: null,
    granted_at: null,
    current_period_end: periodEnd?.toISOString() ?? null,
    renewal_date: periodEnd ? periodEnd.toISOString().slice(0, 10) : null,
    cancel_at_period_end: !!sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: "business_id" });
  if (error) throw error;

  const newPlan = premium ? "premium" : "free";
  if (before?.plan !== newPlan) {
    await logActivity(businessId, "subscription.changed", premium ? "Visibility Plan" : "Free");
  }
}

function money(amountMinor: number, currency: string) {
  const symbol = currency.toLowerCase() === "gbp" ? "£" : `${currency.toUpperCase()} `;
  return `${symbol}${(amountMinor / 100).toFixed(2)}`;
}

async function recordInvoice(invoice: Stripe.Invoice, status: "Paid" | "Failed") {
  const subId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  // Newer Stripe API versions moved the subscription details under `parent`.
  // deno-lint-ignore no-explicit-any
  const parentDetails = (invoice as any).parent?.subscription_details;
  let businessId = invoice.subscription_details?.metadata?.business_id
    ?? parentDetails?.metadata?.business_id
    ?? null;
  if (!businessId && invoice.customer) {
    const customer = typeof invoice.customer === "string" ? invoice.customer : invoice.customer.id;
    const { data } = await admin
      .from("business_subscriptions").select("business_id").eq("stripe_customer_id", customer).maybeSingle();
    businessId = data?.business_id ?? null;
  }
  if (!businessId) {
    // Throwing makes Stripe retry later, by which time the subscription (and
    // its customer) is on file — rather than silently losing the payment.
    throw new Error(`No business found yet for invoice ${invoice.id} (${subId ?? parentDetails?.subscription ?? "no subscription"})`);
  }

  const paidAt = invoice.status_transitions?.paid_at ?? invoice.created;
  const { error } = await admin.from("business_payments").upsert({
    business_id: businessId,
    date: new Date(paidAt * 1000).toISOString().slice(0, 10),
    description: invoice.lines?.data?.[0]?.description ?? "Visibility Plan subscription",
    amount: money(status === "Paid" ? invoice.amount_paid : invoice.amount_due, invoice.currency),
    status,
    stripe_invoice_id: invoice.id,
    invoice_url: invoice.hosted_invoice_url ?? null,
    invoice_pdf: invoice.invoice_pdf ?? null,
  }, { onConflict: "stripe_invoice_id" });
  if (error) throw error;

  if (status === "Failed") {
    await admin.from("business_subscriptions")
      .update({ plan_status: "Payment Failed", updated_at: new Date().toISOString() })
      .eq("business_id", businessId);
    await logActivity(businessId, "subscription.payment_failed", "Visibility Plan", "Your latest Visibility Plan payment didn't go through.");
  }
}

// Records a subscription's latest invoice once it's paid. Called from every
// subscription event as well as checkout, so billing history fills in even if
// the endpoint isn't sent invoice.paid or checkout.session.completed.
async function recordLatestInvoice(sub: Stripe.Subscription) {
  const invoiceId = typeof sub.latest_invoice === "string" ? sub.latest_invoice : sub.latest_invoice?.id;
  if (!invoiceId) return;
  const invoice = await stripeGet(`invoices/${invoiceId}`);
  if (invoice.status === "paid") await recordInvoice(invoice, "Paid");
}

// A paid homepage slot booking: confirm the reserved slot (or the next free
// one if the hold lapsed) and record the payment in billing history.
// deno-lint-ignore no-explicit-any
async function settlePlacement(session: any) {
  const meta = session.metadata ?? {};
  const { data: placement, error } = await admin.rpc("settle_homepage_payment", {
    p_placement_id: meta.placement_id,
    p_business_id: meta.business_id,
    p_slot_type: meta.slot_type,
    p_session_id: session.id,
    p_payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
    p_amount_pence: session.amount_total ?? 0,
  });
  if (error) throw error;

  const { data: type } = await admin.from("homepage_slot_types").select("label").eq("key", meta.slot_type).maybeSingle();
  const label = type?.label ?? "Homepage slot";
  const invoiceId = typeof session.invoice === "string" ? session.invoice : session.invoice?.id;
  if (invoiceId) {
    await recordInvoice(await stripeGet(`invoices/${invoiceId}`), "Paid");
  } else {
    const { error: payError } = await admin.from("business_payments").upsert({
      business_id: meta.business_id,
      date: new Date().toISOString().slice(0, 10),
      description: `Homepage ${label}`,
      amount: money(session.amount_total ?? 0, session.currency ?? "gbp"),
      status: "Paid",
      stripe_invoice_id: session.id,
    }, { onConflict: "stripe_invoice_id" });
    if (payError) throw payError;
  }

  const when = new Date(placement.starts_at).toLocaleString("en-GB", {
    timeZone: "Europe/London", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  await admin.from("business_activity").insert({
    business_id: meta.business_id, action: "placement.booked", entity_type: "placement", entity_id: placement.id,
    title: `Homepage ${label}`,
    detail: meta.slot_type === "featured_business"
      ? `Booked from ${when}. Waiting for admin approval.`
      : `Booked from ${when}. Choose what to show in Subscriptions & Billing.`,
    actor: "system",
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return text("Method not allowed", 405);

  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body, signature ?? "", Deno.env.get("STRIPE_WEBHOOK_SECRET")!, undefined, cryptoProvider,
    );
  } catch (e) {
    console.error("Bad Stripe signature:", (e as Error).message);
    return text("Invalid signature", 400);
  }

  // Stripe delivers at least once. A repeat of an event already handled is
  // acknowledged without doing the work twice.
  const { error: seenError } = await admin.from("stripe_events").insert({ id: event.id, type: event.type });
  if (seenError?.code === "23505") return text("Already processed");

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.kind === "placement") {
          if (session.payment_status === "paid") await settlePlacement(session);
          break;
        }
        if (session.mode === "subscription" && session.subscription) {
          const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          const sub = await stripeGet(`subscriptions/${subId}`);
          await applySubscription(sub);
          // Record the first payment here too, so billing history doesn't
          // depend on invoice.paid arriving (or being enabled). Recording is
          // keyed on the invoice id, so a later invoice.paid just updates it.
          await recordLatestInvoice(sub);
        }
        break;
      }
      case "checkout.session.expired": {
        // Checkout closed without paying: give the reserved slot back.
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.kind === "placement" && session.metadata.placement_id) {
          await admin.from("homepage_placements").delete()
            .eq("id", session.metadata.placement_id).eq("status", "held");
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        // Re-read from the API so the shape matches this code's API version,
        // whatever version the webhook endpoint sends events in.
        const sub = await stripeGet(`subscriptions/${(event.data.object as Stripe.Subscription).id}`);
        await applySubscription(sub);
        await recordLatestInvoice(sub);
        break;
      }
      case "invoice.paid":
        await recordInvoice(await stripeGet(`invoices/${(event.data.object as Stripe.Invoice).id}`), "Paid");
        break;
      case "invoice.payment_failed":
        await recordInvoice(await stripeGet(`invoices/${(event.data.object as Stripe.Invoice).id}`), "Failed");
        break;
      default:
        break;
    }
  } catch (e) {
    // Forget the event so Stripe's retry gets a clean second attempt.
    await admin.from("stripe_events").delete().eq("id", event.id);
    console.error(`Handling ${event.type} failed:`, e);
    return text("Handler error", 500);
  }

  return text("ok");
});
