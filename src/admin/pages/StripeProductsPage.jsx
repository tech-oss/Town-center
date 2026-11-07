import { useEffect, useState } from "react";
import { getStripeCatalogueStatus, syncStripeCatalogue } from "../../api/admin/stripeCatalogue";
import { BLUE, BORDER, CARD, MUTED, NAVY } from "../theme";

const GROUP_ORDER = ["Visibility Plan", "Add-on packs", "Accommodation plans", "Homepage packages"];
const GROUP_NOTES = {
  "Visibility Plan": "The business subscription — standard, and hotels & accommodation.",
  "Add-on packs": "Extra article, event, Featured Article and push notification slots, valid 12 months.",
  "Accommodation plans": "Accommodation management companies' plans, monthly and yearly.",
  "Homepage packages": "Homepage featuring. Prices are set on the Home Page Featured page.",
};

const STATUS = {
  ok: { label: "In Stripe", bg: "rgba(22,163,74,0.12)", fg: "#15803D" },
  missing: { label: "Missing", bg: "rgba(220,38,38,0.1)", fg: "#991B1B" },
  price_differs: { label: "Price differs", bg: "rgba(217,119,6,0.14)", fg: "#92400E" },
};

const money = (pence) => `£${(pence / 100).toFixed(2).replace(/\.00$/, "")}`;
const billing = (interval) => (interval === "month" ? "Monthly" : interval === "year" ? "Yearly" : "One-off");

// Every payable product on Maidenhead and whether Stripe has it. Stripe only
// takes a payment for something it has as a product, and its reports, tax
// settings and the accountant all work per product — so anything missing
// here is created with one button.
export default function StripeProductsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;
    getStripeCatalogueStatus()
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(e.message || "Couldn't reach Stripe."); });
    return () => { alive = false; };
  }, []);

  async function handleSync() {
    setSyncing(true);
    setError("");
    setMessage("");
    try {
      const d = await syncStripeCatalogue();
      setData(d);
      const left = d.items.filter((i) => i.status !== "ok").length;
      setMessage(left ? `${left} item${left === 1 ? "" : "s"} still couldn't be created — see below.` : "Every product is now in Stripe.");
    } catch (e) {
      setError(e.message || "Couldn't reach Stripe.");
    }
    setSyncing(false);
  }

  const items = data?.items ?? [];
  const outstanding = items.filter((i) => i.status !== "ok").length;
  const dashboard = data?.livemode === false ? "https://dashboard.stripe.com/test" : "https://dashboard.stripe.com";

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Stripe Products</h1>
          <p className="text-sm mt-1 max-w-2xl" style={{ color: MUTED }}>
            Everything a business can pay for, and whether it exists as a product in Stripe. Checkout sells these
            products, so every payment, receipt and report in Stripe names what was bought.
          </p>
          {data?.livemode === false && (
            <p className="text-xs mt-2 font-semibold" style={{ color: "#92400E" }}>Stripe is in test mode — these are test products.</p>
          )}
        </div>
        <button type="button" onClick={handleSync} disabled={syncing || !data}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: BLUE }}>
          {syncing ? "Creating in Stripe…" : outstanding ? `Create ${outstanding} missing in Stripe` : "Check again and fix"}
        </button>
      </div>

      {message && <p className="text-sm font-medium" style={{ color: "#15803D" }}>{message}</p>}
      {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}
      {!data && !error && <p className="text-sm" style={{ color: MUTED }}>Checking Stripe…</p>}

      {data && GROUP_ORDER.map((group) => {
        const rows = items.filter((i) => i.group === group);
        if (!rows.length) return null;
        return (
          <section key={group} className="rounded-2xl p-5" style={CARD}>
            <h2 className="text-base font-bold" style={{ color: NAVY }}>{group}</h2>
            <p className="text-xs mb-3" style={{ color: MUTED }}>{GROUP_NOTES[group]}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs" style={{ color: MUTED }}>
                    <th className="py-2 pr-3 font-semibold">Product</th>
                    <th className="py-2 pr-3 font-semibold">Price</th>
                    <th className="py-2 pr-3 font-semibold">Billing</th>
                    <th className="py-2 pr-3 font-semibold">Stripe</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const st = STATUS[r.status] ?? STATUS.missing;
                    return (
                      <tr key={`${r.group}-${r.key}`} style={{ borderTop: `1px solid ${BORDER}` }}>
                        <td className="py-2.5 pr-3" style={{ color: NAVY }}>
                          {r.name}
                          {r.error && <span className="block text-xs" style={{ color: "#DC2626" }}>{r.error}</span>}
                        </td>
                        <td className="py-2.5 pr-3 font-semibold" style={{ color: NAVY }}>{money(r.amountPence)}</td>
                        <td className="py-2.5 pr-3" style={{ color: MUTED }}>{billing(r.interval)}</td>
                        <td className="py-2.5 pr-3">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.fg }}>{st.label}</span>
                          {r.stripeProductId && r.status === "ok" && (
                            <a href={`${dashboard}/products/${r.stripeProductId}`} target="_blank" rel="noopener noreferrer"
                              className="ml-2 text-xs font-semibold" style={{ color: BLUE }}>Open ↗</a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {data && (
        <div className="rounded-2xl p-5 text-sm flex flex-col gap-2" style={{ border: `1.5px dashed ${BORDER}`, color: MUTED }}>
          <p><strong style={{ color: NAVY }}>Editing in Stripe.</strong> Names, descriptions and tax settings can be changed in Stripe and are
            never overwritten from here. Prices are set by Maidenhead: changing a price inside Stripe doesn't change what businesses are charged.</p>
          <p><strong style={{ color: NAVY }}>Tax.</strong> Each product can be given a tax code in Stripe (or one default for the account
            in Stripe Tax settings) when the accountant sets up tax reporting.</p>
        </div>
      )}
    </div>
  );
}
