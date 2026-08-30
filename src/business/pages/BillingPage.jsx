import { useState } from "react";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import { Toast, useToast, ConfirmModal, FOREST, SAGE, MUTED, BORDER, CARD } from "../components/FormKit";
import {
  SUBSCRIPTION_PLANS, HOTEL_SITE_TIERS, ACCOMMODATION_TIERS, BUSINESS_PAYMENTS, ADD_ONS,
} from "../../Data/businessPortalMock";

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDateTime(iso) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} at ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function BillingPage() {
  const { user } = useBusinessAuth();
  const [toast, setToast] = useToast();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const isHotel = user.businessType === "hotel";
  const tiers = isHotel ? HOTEL_SITE_TIERS : null;
  const plans = isHotel ? null : SUBSCRIPTION_PLANS;
  const payments = BUSINESS_PAYMENTS[user.id] ?? [];

  function handleUpgrade(name) {
    // TODO: Stripe checkout
    setToast(`Switched to ${name}.`);
  }
  function handlePurchaseAddon(name) {
    // TODO: Stripe one-off payment
    setToast(`"${name}" purchased.`);
  }
  function handleCancel() {
    setConfirmCancel(false);
    setCancelled(true);
    setToast("Subscription cancelled.");
  }

  return (
    <BusinessLayout>
      <Toast message={toast} />
      {confirmCancel && (
        <ConfirmModal title="Cancel your plan?" body="You'll lose access to paid features at the end of your current billing period." confirmLabel="Cancel Plan"
          onConfirm={handleCancel} onCancel={() => setConfirmCancel(false)} />
      )}

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
              <p className="text-xl font-bold capitalize" style={{ color: FOREST }}>{user.plan.replace(/-/g, " ")}</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: cancelled ? "rgba(220,38,38,0.1)" : "rgba(82,199,182,0.16)", color: cancelled ? "#991B1B" : "#0F766E" }}>
              {cancelled ? "Cancelled" : user.planStatus}
            </span>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div><p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Renewal Date</p><p className="text-sm font-medium" style={{ color: FOREST }}>{fmtDate(user.renewalDate)}</p></div>
            <div><p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Monthly Fee</p><p className="text-sm font-medium" style={{ color: FOREST }}>£{user.monthlyFee}/mo</p></div>
            {isHotel && (
              <div><p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Sites on Plan</p><p className="text-sm font-medium" style={{ color: FOREST }}>{HOTEL_SITE_TIERS.find((t) => t.key === user.siteTierKey)?.label}</p></div>
            )}
          </div>
          <div className="flex gap-3 flex-wrap pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
            <button className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>Upgrade</button>
            <button onClick={() => setConfirmCancel(true)} disabled={cancelled} className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40" style={{ backgroundColor: "#DC2626" }}>Cancel Plan</button>
          </div>
        </div>

        {/* Available plans */}
        <div>
          <p className="text-sm font-bold mb-3" style={{ color: FOREST }}>Available Plans</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {isHotel ? tiers.map((t) => {
              const current = t.key === user.siteTierKey;
              return (
                <div key={t.key} className="bg-white rounded-2xl p-5 flex flex-col gap-3" style={current ? { border: `2px solid ${SAGE}` } : CARD}>
                  <p className="text-base font-bold" style={{ color: FOREST }}>{t.label}</p>
                  <p className="text-lg font-bold" style={{ color: FOREST }}>{t.price != null ? `£${t.price}/mo` : "Contact us"}</p>
                  {current ? (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-lg text-center" style={{ backgroundColor: "rgba(82,199,182,0.16)", color: "#0F766E" }}>Current Plan</span>
                  ) : (
                    <button onClick={() => handleUpgrade(t.label)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ border: `1.5px solid ${BORDER}`, color: FOREST }}>Switch to this plan</button>
                  )}
                </div>
              );
            }) : plans.map((p) => {
              const current = p.key === user.plan;
              return (
                <div key={p.key} className="bg-white rounded-2xl p-5 flex flex-col gap-3" style={current ? { border: `2px solid ${SAGE}` } : CARD}>
                  <p className="text-base font-bold" style={{ color: FOREST }}>{p.name}</p>
                  <p className="text-lg font-bold" style={{ color: FOREST }}>{p.price === 0 ? "Free" : `£${p.price}/mo`}</p>
                  <ul className="flex flex-col gap-1">
                    {p.features.map((f) => <li key={f} className="text-xs" style={{ color: MUTED }}>✓ {f}</li>)}
                  </ul>
                  {current ? (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-lg text-center" style={{ backgroundColor: "rgba(82,199,182,0.16)", color: "#0F766E" }}>Current Plan</span>
                  ) : (
                    <button onClick={() => handleUpgrade(p.name)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ border: `1.5px solid ${BORDER}`, color: FOREST }}>Switch to this plan</button>
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
              <tr style={{ backgroundColor: "rgba(28,46,56,0.04)" }}>
                {["Date", "Description", "Amount", "Status", "Invoice"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-[11px] uppercase tracking-wider" style={{ color: FOREST }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={i} style={{ borderBottom: i < payments.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <td className="px-3 py-2.5" style={{ color: FOREST }}>{p.date}</td>
                  <td className="px-3 py-2.5" style={{ color: MUTED }}>{p.description}</td>
                  <td className="px-3 py-2.5 font-medium" style={{ color: FOREST }}>{p.amount}</td>
                  <td className="px-3 py-2.5"><span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: p.status === "Paid" ? "rgba(82,199,182,0.16)" : "rgba(220,38,38,0.1)", color: p.status === "Paid" ? "#0F766E" : "#991B1B" }}>{p.status}</span></td>
                  <td className="px-3 py-2.5"><span className="text-xs font-semibold cursor-pointer" style={{ color: "#0F766E" }}>Download PDF</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Terms acceptance record */}
        <div className="bg-white rounded-2xl p-5" style={CARD}>
          <p className="text-sm font-bold mb-2" style={{ color: FOREST }}>Terms Acceptance Record</p>
          <p className="text-sm" style={{ color: MUTED }}>Terms accepted on {fmtDateTime(user.termsAcceptedAt)}. <span className="font-semibold cursor-pointer" style={{ color: "#0F766E" }}>View accepted terms →</span></p>
        </div>
      </div>
    </BusinessLayout>
  );
}
