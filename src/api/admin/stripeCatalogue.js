import { supabase } from "../../lib/supabaseClient";

// Every payable product and whether it exists in Stripe
// (supabase/functions/stripe-catalogue). `sync` creates whatever is missing.
async function call(action) {
  const { data, error } = await supabase.functions.invoke("stripe-catalogue", { body: { action } });
  if (error) {
    let message = error.message;
    try { message = (await error.context?.json())?.error ?? message; } catch { /* keep generic */ }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return { livemode: data.livemode, items: data.items ?? [] };
}

export const getStripeCatalogueStatus = () => call("status");
export const syncStripeCatalogue = () => call("sync");
