import { supabase } from "../../lib/supabaseClient";

// Add-on slots — the paid extras that decide how much of a business's own
// content can be on the platform at once (see
// supabase/sql/addon_slots_2026_09.sql on the admin-panel branch).
//
// A slot is never a one-off piece of content. It is a re-usable place: for 12
// months the business can edit what sits in it, hide it, or replace it
// entirely — and when an event has finished, put the next one in the same
// slot. Being on the HOMEPAGE is a separate purchase (Homepage Promotions).

export const ADDON_KINDS = {
  article: {
    key: "article",
    label: "Extra Article Slots",
    noun: "article",
    included: 3,
    intro: "Want to get more of your news and offers seen across Maidenhead.com and The Maidenhead App? Purchase additional article slots and use them throughout the year.",
    packs: [
      { pack: 1, price: "£9.99",  label: "1 Article Slot"  },
      { pack: 3, price: "£24.99", label: "3 Article Slots" },
      { pack: 6, price: "£39.99", label: "6 Article Slots" },
    ],
    terms: [
      "Use them for News or Offers",
      "Edit and update the content as often as you like",
      "Replace it with completely new content during the 12-month period",
      "Appear on your business profile and in the main Articles / News / Offers area across the website and app",
      "Hide an article whenever you choose",
    ],
  },
  event: {
    key: "event",
    label: "Event Slots",
    noun: "event",
    included: 0,
    intro: "An event slot puts one of your events on Maidenhead.com and The Maidenhead App. When that event has finished, re-use the same slot for the next one.",
    packs: [
      { pack: 1, price: "£9.99",  label: "1 Event Slot"  },
      { pack: 3, price: "£24.99", label: "3 Event Slots" },
      { pack: 6, price: "£39.99", label: "6 Event Slots" },
    ],
    terms: [
      "Run one event at a time per slot",
      "It appears on your business profile, the See & Do page and the calendar",
      "Edit the date, title, images, description and booking link whenever you need to",
      "A one-off event or a recurring one — a recurring event is still one event, so it uses one slot",
      "Once the event has finished, re-use the same slot for another",
      "Hide the event if you have nothing to promote right now",
    ],
  },
  featured_article: {
    key: "featured_article",
    label: "Featured Article Slots",
    noun: "featured article",
    included: 0,
    intro: "A Featured Article is a longer, editorial-style piece with a hero image and pictures through the text. Featured articles are always shown first on the Offers page.",
    packs: [
      { pack: 1, price: "£49.99",  label: "1 Featured Article Slot"  },
      { pack: 3, price: "£119.99", label: "3 Featured Article Slots" },
      { pack: 6, price: "£199.99", label: "6 Featured Article Slots" },
    ],
    terms: [
      "One active Featured Article per slot",
      "A longer-form editorial-style article, with a hero image and pictures through the text",
      "Include a link to your own website",
      "Edit and update it while it is running",
      "Replace it with a completely new Featured Article during the 12-month period",
      "Appears on your business profile and in the main Articles / News / Offers area, across the website and app",
      "Hide it whenever you choose",
    ],
  },
};

// The line every one of these cards ends on.
export const ADDON_SMALLPRINT =
  "Slots are not one-off pieces of content — each slot can be re-used during its 12-month validity. " +
  "Add-ons are available while your Business Visibility subscription is active; if it is cancelled, " +
  "unused slots are deactivated. Showing something on the homepage is a separate purchase.";

const today = () => new Date().toISOString();

// How many of `kind` this business may have on the platform at once, and the
// packs behind it.
export async function getAddonAllowance(businessId, kind) {
  const [{ data: allowance }, { data: packs }] = await Promise.all([
    supabase.rpc("addon_slot_allowance", { p_business_id: businessId, p_kind: kind }),
    supabase
      .from("business_addon_slots")
      .select("*")
      .eq("business_id", businessId)
      .eq("kind", kind)
      .gt("expires_at", today())
      .order("expires_at", { ascending: true }),
  ]);
  const rows = packs ?? [];
  const included = ADDON_KINDS[kind]?.included ?? 0;
  return {
    kind,
    // Falls back to what's included if the migration hasn't run yet, so the
    // page still works rather than showing no allowance at all.
    allowance: allowance ?? included,
    included,
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
export async function buyAddonSlots(businessId, kind, pack) {
  const { data, error } = await supabase.functions.invoke("stripe-checkout", {
    body: { kind: "addon_slots", addon: kind, businessId, pack },
  });
  if (error) {
    let message = error.message;
    try { message = (await error.context?.json())?.error ?? message; } catch { /* keep generic */ }
    throw new Error(message);
  }
  if (!data?.url) throw new Error(data?.error ?? "Stripe didn't return a page to open.");
  window.location.assign(data.url);
}
