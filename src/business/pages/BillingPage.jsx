import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import { Toast, useToast, FOREST, SAGE, MUTED, BORDER, CARD } from "../components/FormKit";
import { ADD_ONS } from "../../Data/businessPortalMock";
import { PLANS, isPremium } from "../../Data/plans";
import { listPayments, getSubscription } from "../api/businessSubscription";
import { openBillingPortal } from "../api/stripeBilling";

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDateTime(iso) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} at ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function BillingPage() {
  const navigate = useNavigate();
  const { user, switchUser } = useBusinessAuth();
  const [toast, setToast] = useToast();
  const [payments, setPayments] = useState([]);
  const [opening, setOpening] = useState(false);

  const premium = isPremium(user.plan);
  const cancelled = !premium && (!!user.cancelled || user.planStatus === "Cancelled");

  // Returning from Stripe's portal may follow a cancellation or card update,
  // so refresh the plan and payments from the database on every visit.
  useEffect(() => {
    let stale = false;
    listPayments(user.id).then((data) => { if (!stale) setPayments(data); });
    getSubscription(user.id).then((sub) => { if (!stale && sub) switchUser({ ...user, ...sub }); });
    return () => { stale = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  // Subscribing goes through Stripe Checkout (the upgrade flow); updating the
  // card, invoices and cancelling go through Stripe's Customer Portal. The
  // plan here then follows whatever Stripe reports to the webhook.
  async function manageBilling() {
    setOpening(true);
    try {
      await openBillingPortal(user.id);
    } catch (e) {
      setToast(e.message);
      setOpening(false);
    }
  }
  function handleUpgrade(plan) {
    if (plan.key === "premium") navigate("/business/upgrade");
    else manageBilling();
  }
  function handlePurchaseAddon(name) {
    // TODO: Stripe one-off payment
    setToast(`"${name}" purchased.`);
  }

  return (
    <BusinessLayout>
      <Toast message={toast} />

      <div className="flex flex-col gap-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: FOREST }}>Subscriptions & Billing</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Manage your plan, add-ons and payment history.</p>
        </div>

        {/* Current plan summary */}
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={CARD}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Current Plan</p>
              <p className="text-xl font-bold" style={{ color: FOREST }}>{premium ? "Premium" : "Free"}</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: cancelled || /Failed|Past Due/.test(user.planStatus ?? "") ? "rgba(220,38,38,0.1)" : "rgba(37,99,235,0.16)", color: cancelled || /Failed|Past Due/.test(user.planStatus ?? "") ? "#991B1B" : "#2563EB" }}>
              {cancelled ? "Cancelled" : (user.planStatus ?? "Active")}
            </span>
          </div>
          {premium ? (
            <div className="grid sm:grid-cols-3 gap-4">
              <div><p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{user.cancelAtPeriodEnd ? "Premium Ends" : "Renewal Date"}</p><p className="text-sm font-medium" style={{ color: FOREST }}>{user.renewalDate ? fmtDate(user.renewalDate) : "—"}</p></div>
              <div><p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Monthly Fee</p><p className="text-sm font-medium" style={{ color: FOREST }}>£{Number(user.monthlyFee ?? 0).toFixed(2)}/mo</p></div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: MUTED }}>Your listing shows your name, address, telephone, email and hero image. Subscribe to Premium to unlock your full business profile.</p>
          )}
          {user.cancelAtPeriodEnd && premium && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(217,119,6,0.08)", color: "#92400E" }}>
              Your Premium subscription is cancelled and ends on {fmtDate(user.renewalDate)}. You keep Premium until then.
            </p>
          )}
          {/Failed|Past Due/.test(user.planStatus ?? "") && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(185,28,28,0.08)", color: "#991B1B" }}>
              Your latest payment didn't go through. Update your card in Manage Billing to keep Premium.
            </p>
          )}
          <div className="flex gap-3 flex-wrap pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
            {!premium && (
              <button onClick={() => navigate("/business/upgrade")} className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>Subscribe to Premium</button>
            )}
            {user.stripeCustomerId && (
              <button onClick={manageBilling} disabled={opening} className="px-5 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50" style={{ border: `1.5px solid ${BORDER}`, color: FOREST }}>
                {opening ? "Opening…" : premium ? "Manage billing or cancel" : "Billing history & cards"}
              </button>
            )}
          </div>
        </div>

        {/* Available plans */}
        <div>
          <p className="text-sm font-bold mb-3" style={{ color: FOREST }}>Available Plans</p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
            {PLANS.map((p) => {
              const current = p.key === (isPremium(user.plan) ? "premium" : "free");
              return (
                <div key={p.key} className="bg-white rounded-2xl p-5 flex flex-col gap-3" style={current ? { border: `2px solid ${SAGE}` } : CARD}>
                  <p className="text-base font-bold" style={{ color: FOREST }}>{p.name}</p>
                  <p className="text-lg font-bold" style={{ color: FOREST }}>{p.price === 0 ? "Free" : `£${p.price}/mo`}</p>
                  <ul className="flex flex-col gap-1">
                    {p.features.map((f) => <li key={f} className="text-xs" style={{ color: MUTED }}>✓ {f}</li>)}
                  </ul>
                  {current ? (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-lg text-center" style={{ backgroundColor: "rgba(37,99,235,0.16)", color: "#2563EB" }}>Current Plan</span>
                  ) : (
                    <button onClick={() => handleUpgrade(p)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={p.key === "premium" ? { backgroundColor: SAGE, color: "#fff" } : { border: `1.5px solid ${BORDER}`, color: FOREST }}>
                      {p.key === "premium" ? "Subscribe" : "Cancel Premium"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add-ons */}
        <div className="bg-white rounded-2xl p-5" style={CARD}>
          <p className="text-sm font-bold mb-3" style={{ color: FOREST }}>Ad-hoc Add-on Services</p>
          <div className="flex flex-col gap-3">
            {ADD_ONS.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-4 flex-wrap rounded-xl p-3" style={{ border: `1px solid ${BORDER}` }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: FOREST }}>{a.name}</p>
                  <p className="text-xs" style={{ color: MUTED }}>{a.description} · {a.price}</p>
                </div>
                <button onClick={() => handlePurchaseAddon(a.name)} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: SAGE }}>Purchase</button>
              </div>
            ))}
          </div>
        </div>

        {/* Payment history */}
        <div className="bg-white rounded-2xl p-5" style={CARD}>
          <p className="text-sm font-bold mb-3" style={{ color: FOREST }}>Payment History</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ backgroundColor: "rgba(16,24,40,0.04)" }}>
                {["Date", "Description", "Amount", "Status", "Invoice"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-[11px] uppercase tracking-wider" style={{ color: FOREST }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-xs" style={{ color: "#9CA3AF" }}>No payments yet. Invoices appear here once you subscribe to Premium.</td></tr>
              )}
              {payments.map((p, i) => (
                <tr key={i} style={{ borderBottom: i < payments.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <td className="px-3 py-2.5" style={{ color: FOREST }}>{p.date}</td>
                  <td className="px-3 py-2.5" style={{ color: MUTED }}>{p.description}</td>
                  <td className="px-3 py-2.5 font-medium" style={{ color: FOREST }}>{p.amount}</td>
                  <td className="px-3 py-2.5"><span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: p.status === "Paid" ? "rgba(37,99,235,0.16)" : "rgba(220,38,38,0.1)", color: p.status === "Paid" ? "#2563EB" : "#991B1B" }}>{p.status}</span></td>
                  <td className="px-3 py-2.5">
                    {p.invoice_pdf || p.invoice_url ? (
                      <a href={p.invoice_pdf || p.invoice_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold" style={{ color: "#2563EB" }}>
                        {p.invoice_pdf ? "Download PDF" : "View invoice"}
                      </a>
                    ) : <span className="text-xs" style={{ color: "#9CA3AF" }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Terms acceptance record */}
        <div className="bg-white rounded-2xl p-5" style={CARD}>
          <p className="text-sm font-bold mb-2" style={{ color: FOREST }}>Terms Acceptance Record</p>
          <p className="text-sm" style={{ color: MUTED }}>Terms accepted on {fmtDateTime(user.termsAcceptedAt)}. <span className="font-semibold cursor-pointer" style={{ color: "#2563EB" }}>View accepted terms →</span></p>
        </div>
      </div>
    </BusinessLayout>
  );
}
