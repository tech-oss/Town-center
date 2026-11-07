import { useSyncExternalStore } from "react";
import { supabase } from "../../lib/supabaseClient";
import { BILLING_OPTIONS, HOTEL_BILLING_OPTIONS, PREMIUM_PLAN } from "../../Data/plans";
import { ADDON_KINDS } from "./addonSlots";

// The prices admin sets on Stripe Products (the stripe_catalogue table on the
// admin-panel branch), applied over the built-in ones before the portal
// shows anything. Every page already reads its prices from BILLING_OPTIONS,
// HOTEL_BILLING_OPTIONS and ADDON_KINDS when it draws, so those objects are
// updated in place and nothing else has to change. Checkout charges the same
// table, so what a business sees is what Stripe takes.
//
// If the table can't be read, the built-in prices stay — the portal never
// waits on this for more than a few seconds.

const OPTIONS = {
  visibility_monthly: [BILLING_OPTIONS, "month"],
  visibility_yearly: [BILLING_OPTIONS, "year"],
  visibility_hotel_monthly: [HOTEL_BILLING_OPTIONS, "month"],
  visibility_hotel_yearly: [HOTEL_BILLING_OPTIONS, "year"],
};

// The built-in amounts, in pence: while a price is unchanged its hand-written
// "a day" wording ("Less than £1.40 a day") is kept.
const BUILT_IN = Object.fromEntries(
  Object.entries(OPTIONS).map(([key, [opts, interval]]) => [key, Math.round(opts[interval].price * 100)]),
);

const money = (pence) => `£${(pence / 100).toFixed(2)}`;
// "99p" / "£1.33": the price spread over a month (30 days) or a year, rounded
// down so it's never overstated.
function perDay(pence, interval) {
  const p = Math.floor(pence / (interval === "year" ? 365 : 30));
  return p < 100 ? `${p}p` : `£${(p / 100).toFixed(2)}`;
}

function apply(rows) {
  for (const row of rows) {
    const pence = Number(row.amount_pence);
    if (!(pence > 0)) continue;

    const option = OPTIONS[row.key];
    if (option) {
      const [opts, interval] = option;
      opts[interval].price = pence / 100;
      if (pence !== BUILT_IN[row.key]) {
        opts[interval].perDay = perDay(pence, interval);
        opts[interval].perDayText = undefined;
      }
      continue;
    }

    const m = /^addon_(.+)_(\d+)$/.exec(row.key);
    const pack = m && ADDON_KINDS[m[1]]?.packs.find((p) => p.pack === Number(m[2]));
    if (pack) pack.price = money(pence);
  }

  // "Save £…" on the yearly price: twelve months against one year, rounded
  // down (£359.88 − £329 = "Save £30").
  for (const opts of [BILLING_OPTIONS, HOTEL_BILLING_OPTIONS]) {
    const diff = Math.round(opts.month.price * 100) * 12 - Math.round(opts.year.price * 100);
    opts.year.saving = Math.max(0, Math.floor(diff / 100));
  }
  PREMIUM_PLAN.price = BILLING_OPTIONS.month.price;
  PREMIUM_PLAN.yearlyPrice = BILLING_OPTIONS.year.price;
}

let ready = false;
const listeners = new Set();
function done() {
  if (ready) return;
  ready = true;
  listeners.forEach((l) => l());
}

let started = false;
function load() {
  if (started) return;
  started = true;
  const timer = setTimeout(done, 4000);
  supabase.from("stripe_catalogue").select("key, amount_pence").eq("active", true)
    .then(({ data, error }) => {
      if (!error && data) apply(data);
    })
    .catch(() => { /* keep the built-in prices */ })
    .finally(() => { clearTimeout(timer); done(); });
}

// True once the live prices are in (or the built-in ones are being kept).
export default function useLivePrices() {
  load();
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => ready,
  );
}
