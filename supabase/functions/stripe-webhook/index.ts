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
// Events: checkout.session.completed, customer.subscription.created,
//   customer.subscription.updated, customer.subscription.deleted,
//   invoice.paid, invoice.payment_failed

import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();
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
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const { data: before } = await admin
    .from("business_subscriptions").select("plan").eq("business_id", businessId).maybeSingle();

  const planStatus = premium && sub.cancel_at_period_end ? "Cancelling" : (STATUS_LABEL[sub.status] ?? sub.status);

  const { error } = await admin.from("business_subscriptions").upsert({
    business_id: businessId,
    plan: premium ? "premium" : "free",
    upgrade_plan_key: premium ? "premium" : "free",
    monthly_fee: premium ? (price?.unit_amount ?? 0) / 100 : 0,
    plan_status: planStatus,
    cancelled: !premium,
    stripe_customer_id: customer,
    stripe_subscription_id: premium ? sub.id : null,
    current_period_end: periodEnd?.toISOString() ?? null,
    renewal_date: periodEnd ? periodEnd.toISOString().slice(0, 10) : null,
    cancel_at_period_end: !!sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: "business_id" });
  if (error) throw error;

  const newPlan = premium ? "premium" : "free";
  if (before?.plan !== newPlan) {
    await logActivity(businessId, "subscription.changed", premium ? "Premium" : "Free");
  }
}

function money(amountMinor: number, currency: string) {
  const symbol = currency.toLowerCase() === "gbp" ? "£" : `${currency.toUpperCase()} `;
  return `${symbol}${(amountMinor / 100).toFixed(2)}`;
}

async function recordInvoice(invoice: Stripe.Invoice, status: "Paid" | "Failed") {
  const subId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  let businessId = invoice.subscription_details?.metadata?.business_id ?? null;
  if (!businessId && invoice.customer) {
    const customer = typeof invoice.customer === "string" ? invoice.customer : invoice.customer.id;
    const { data } = await admin
      .from("business_subscriptions").select("business_id").eq("stripe_customer_id", customer).maybeSingle();
    businessId = data?.business_id ?? null;
  }
  if (!businessId) {
    console.warn("No business for invoice", invoice.id, subId);
    return;
  }

  const paidAt = invoice.status_transitions?.paid_at ?? invoice.created;
  const { error } = await admin.from("business_payments").upsert({
    business_id: businessId,
    date: new Date(paidAt * 1000).toISOString().slice(0, 10),
    description: invoice.lines?.data?.[0]?.description ?? "Premium subscription",
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
    await logActivity(businessId, "subscription.payment_failed", "Premium", "Your latest Premium payment didn't go through.");
  }
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
        if (session.mode === "subscription" && session.subscription) {
          const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          await applySubscription(await stripe.subscriptions.retrieve(subId));
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await applySubscription(event.data.object as Stripe.Subscription);
        break;
      case "invoice.paid":
        await recordInvoice(event.data.object as Stripe.Invoice, "Paid");
        break;
      case "invoice.payment_failed":
        await recordInvoice(event.data.object as Stripe.Invoice, "Failed");
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
