import { supabase } from "../../lib/supabaseClient";

// Extra article slots — the paid add-on that raises how many of a business's
// News & Offers posts can be live at once (see
// supabase/sql/article_slots_2026_09.sql on the admin-panel branch).
//
// A slot is not a one-off article. It is a place on the business's profile
// that it can re-use, edit and replace as often as it likes for 12 months.

export const INCLUDED_ARTICLE_SLOTS = 3;

// The packages, exactly as the checkout function prices them — this list is
// display only; the amount charged is decided server-side.
export const ARTICLE_SLOT_PACKS = [
  { pack: 1, quantity: 1, price: "£9.99",  label: "1 Article Slot"  },
  { pack: 3, quantity: 3, price: "£24.99", label: "3 Article Slots" },
  { pack: 6, quantity: 6, price: "£39.99", label: "6 Article Slots" },
];

export const ARTICLE_SLOT_TERMS = [
  "Use them for News or Offers",
  "Edit and update the content as often as you like",
  "Replace it with completely new content during the 12-month period",
  "Appear on your business profile and in the main Articles / News / Offers area across the website and app",
  "Hide an article whenever you choose",
];

const today = () => new Date().toISOString();

// How many live articles this business is allowed, and the packs behind it.
export async function getArticleAllowance(businessId) {
  const [{ data: allowance }, { data: packs }] = await Promise.all([
    supabase.rpc("article_slot_allowance", { p_business_id: businessId }),
    supabase
      .from("business_article_slots")
      .select("*")
      .eq("business_id", businessId)
      .gt("expires_at", today())
      .order("expires_at", { ascending: true }),
  ]);
  const rows = packs ?? [];
  return {
    // Falls back to the included 3 if the migration hasn't run yet, so the
    // page still works rather than showing a business no slots at all.
    allowance: allowance ?? INCLUDED_ARTICLE_SLOTS,
    included: INCLUDED_ARTICLE_SLOTS,
    extra: rows.reduce((n, r) => n + r.quantity, 0),
    packs: rows.map((r) => ({
      id: r.id,
      quantity: r.quantity,
      purchasedAt: r.purchased_at,
      expiresAt: r.expires_at,
    })),
  };
}

// Sends the owner to Stripe Checkout for one of the packages above.
export async function buyArticleSlots(businessId, pack) {
  const { data, error } = await supabase.functions.invoke("stripe-checkout", {
    body: { kind: "article_slots", businessId, pack },
  });
  if (error) {
    let message = error.message;
    try { message = (await error.context?.json())?.error ?? message; } catch { /* keep generic */ }
    throw new Error(message);
  }
  if (!data?.url) throw new Error(data?.error ?? "Stripe didn't return a page to open.");
  window.location.assign(data.url);
}
