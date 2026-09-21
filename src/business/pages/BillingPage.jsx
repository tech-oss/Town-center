import { useEffect, useState } from "react";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import { Toast, useToast, FOREST, SAGE, MUTED, BORDER, CARD } from "../components/FormKit";
import { isPremium } from "../../Data/plans";
import { TERMS_TEXT } from "../../Data/businessPortalMock";
import {
  PAGE_TYPE_CSS, TermsDialog, useVisibilityCheckout, VisibilityPlanCard, VisibilityFeatures, ClosingBand,
} from "../components/VisibilityPlan";
import { listPayments, getSubscription } from "../api/businessSubscription";
import { openBillingPortal } from "../api/stripeBilling";
import HomepagePromotions from "../components/HomepagePromotions";
import ArticleSlotsCard from "../components/ArticleSlotsCard";

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDateTime(iso) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} at ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

// The Terms of Use the business agreed to at signup, with when they agreed.
function AcceptedTermsDialog({ acceptedAt, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(15,23,42,0.55)" }} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="accepted-terms-title"
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-1">
          <h2 id="accepted-terms-title" className="text-lg font-bold" style={{ color: FOREST }}>Accepted Terms of Use</h2>
          <button onClick={onClose} aria-label="Close" className="text-xl leading-none opacity-50 hover:opacity-90" style={{ color: FOREST }}>✕</button>
        </div>
        {acceptedAt && <p className="text-xs mb-4" style={{ color: MUTED }}>Accepted on {fmtDateTime(acceptedAt)}</p>}
        <div className="flex-1 overflow-y-auto rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line" style={{ border: `1.5px solid ${BORDER}`, color: MUTED, backgroundColor: "#f8fafc" }}>
          {TERMS_TEXT}
        </div>
        <button onClick={onClose} className="mt-5 w-full py-3 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: SAGE }}>Close</button>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const { user, switchUser } = useBusinessAuth();
  const [toast, setToast] = useToast();
  const [payments, setPayments] = useState([]);
  const [opening, setOpening] = useState(false);
  const [showAcceptedTerms, setShowAcceptedTerms] = useState(false);
  const vp = useVisibilityCheckout(user.id);

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
  return (
    <BusinessLayout>
      <Toast message={toast} />
      <style>{PAGE_TYPE_CSS}</style>
      {vp.showTerms && <TermsDialog onClose={() => vp.setShowTerms(false)} />}
      {showAcceptedTerms && <AcceptedTermsDialog acceptedAt={user.termsAcceptedAt} onClose={() => setShowAcceptedTerms(false)} />}

      <div className="visibility-plan-page flex flex-col gap-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: FOREST }}>Subscriptions & Billing</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Manage your plan, homepage promotions and payment history.</p>
        </div>

        {/* Current plan summary */}
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={CARD}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Current Plan</p>
              <p className="text-xl font-bold" style={{ color: FOREST }}>{premium ? "Visibility Plan" : "Free"}</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: cancelled || /Failed|Past Due/.test(user.planStatus ?? "") ? "rgba(220,38,38,0.1)" : "rgba(37,99,235,0.16)", color: cancelled || /Failed|Past Due/.test(user.planStatus ?? "") ? "#991B1B" : "#2563EB" }}>
              {cancelled ? "Cancelled" : (user.planStatus ?? "Active")}
            </span>
          </div>
          {premium ? (
            <div className="grid sm:grid-cols-3 gap-4">
              <div><p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{user.cancelAtPeriodEnd ? "Plan Ends" : "Renewal Date"}</p><p className="text-sm font-medium" style={{ color: FOREST }}>{user.renewalDate ? fmtDate(user.renewalDate) : "—"}</p></div>
              <div><p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Billing</p><p className="text-sm font-medium" style={{ color: FOREST }}>{user.billingInterval === "year" ? `£${Number(user.priceAmount ?? 329).toFixed(2)} / year` : `£${Number(user.priceAmount ?? user.monthlyFee ?? 0).toFixed(2)} / month`}</p></div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: MUTED }}>Your listing shows your business name, address, telephone and email, with a pin on the homepage map. Upgrade to the Visibility Plan to unlock your full business profile.</p>
          )}
          {user.cancelAtPeriodEnd && premium && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(217,119,6,0.08)", color: "#92400E" }}>
              Your Visibility Plan is cancelled and ends {user.renewalDate ? `on ${fmtDate(user.renewalDate)}` : "at the end of your current billing period"}. You keep every feature until then.
            </p>
          )}
          {/Failed|Past Due/.test(user.planStatus ?? "") && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(185,28,28,0.08)", color: "#991B1B" }}>
              Your latest payment didn't go through. Update your card in Manage Billing to keep the Visibility Plan.
            </p>
          )}
          <div className="flex gap-3 flex-wrap pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
            {user.stripeCustomerId && (
              <button onClick={manageBilling} disabled={opening} className="px-5 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50" style={{ border: `1.5px solid ${BORDER}`, color: FOREST }}>
                {opening ? "Opening…" : premium ? "Manage billing or cancel" : "Billing history & cards"}
              </button>
            )}
          </div>
        </div>

        {/* The Visibility Plan — same sections as the subscription page, and
            the upgrade buttons go straight to Stripe Checkout. */}
        {premium ? (
          <VisibilityFeatures included />
        ) : (
          <>
            <VisibilityPlanCard checkout={vp} />
            <VisibilityFeatures />
            <ClosingBand checkout={vp} />
          </>
        )}

        {/* Paid homepage slots (the ad-hoc add-ons) */}
        <HomepagePromotions
          businessId={user.id}
          premium={premium}
          onToast={setToast}
          onBooked={() => listPayments(user.id).then(setPayments)}
        />

        {/* Extra article slots — the other ad-hoc add-on */}
        <ArticleSlotsCard businessId={user.id} premium={premium} onToast={setToast} />

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
                <tr><td colSpan={5} className="px-3 py-6 text-center text-xs" style={{ color: "#9CA3AF" }}>No payments yet. Invoices appear here once you upgrade to the Visibility Plan.</td></tr>
              )}
              {payments.map((p, i) => (
                <tr key={i} style={{ borderBottom: i < payments.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: FOREST }}>{p.date ? fmtDate(p.date) : "—"}</td>
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
          <p className="text-sm" style={{ color: MUTED }}>{user.termsAcceptedAt ? `Terms accepted on ${fmtDateTime(user.termsAcceptedAt)}.` : "Terms accepted when your business was registered."} <button type="button" onClick={() => setShowAcceptedTerms(true)} className="font-semibold hover:underline" style={{ color: "#2563EB" }}>View accepted terms →</button></p>
        </div>
      </div>
    </BusinessLayout>
  );
}
