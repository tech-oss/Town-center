import { supabase } from "../../lib/supabaseClient";
import { getSubscription } from "./businessSubscription";

// Stripe billing for the Visibility Plan. Payment and card details live entirely
// on Stripe's hosted pages; this only asks our Edge Functions for a page to
// send the owner to. The plan itself changes when Stripe confirms payment to
// the stripe-webhook function — never from the browser.

async function invoke(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    // Functions answer 4xx with { error } in the body — show that, not the
    // generic "non-2xx status code".
    let message = error.message;
    try { message = (await error.context?.json())?.error ?? message; } catch { /* keep generic */ }
    throw new Error(message);
  }
  if (!data?.url) throw new Error(data?.error ?? "Stripe didn't return a page to open.");
  return data.url;
}

// Sends the browser to Stripe Checkout for the Visibility Plan, billed
// "month" or "year".
export async function startPremiumCheckout(businessId, interval = "year") {
  window.location.assign(await invoke("stripe-checkout", { businessId, interval }));
}

// Sends the browser to Stripe's Customer Portal — update card, invoices, cancel.
export async function openBillingPortal(businessId) {
  window.location.assign(await invoke("stripe-portal", { businessId }));
}

// After returning from Checkout, the webhook usually lands within a second or
// two. Polls until the subscription shows the Visibility Plan, or gives up.
export async function waitForPremium(businessId, { timeoutMs = 30000, intervalMs = 2000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const sub = await getSubscription(businessId);
    if (sub?.plan === "premium") return sub;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return null;
}
