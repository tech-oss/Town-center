import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CARD, BORDER, MUTED, FOREST, SAGE } from "./FormKit";
import { listTiers, getSlotUsage } from "../api/accommodation";
import { getPlanChange } from "../api/accommodationBilling";

// The Subscriptions page's plan card for an accommodation company: its tier,
// billing, property slots and any change scheduled for the end of the
// period. Plans are chosen on the Accommodation plans page; cards and
// invoices stay in Stripe's billing portal.

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—");

export default function AccommodationPlanSummary({ user, onManageBilling, opening }) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listTiers(), getSlotUsage(user.id), getPlanChange(user.id)])
      .then(([tiers, usage, change]) => { if (!cancelled) setInfo({ tiers, usage, change }); })
      .catch(() => { if (!cancelled) setInfo({ tiers: [], usage: null, change: null }); });
    return () => { cancelled = true; };
  }, [user.id]);

  const paid = user.plan === "premium";
  const tierName = (key) => info?.tiers.find((t) => t.key === key)?.name;
  const name = paid ? tierName(user.siteTierKey) ?? "Accommodation plan" : "Free";
  const failing = /Failed|Past Due/.test(user.planStatus ?? "");
  const change = info?.change;

  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={CARD}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Current Plan</p>
          <p className="text-xl font-bold" style={{ color: FOREST }}>{name}</p>
          {info?.usage && <p className="text-xs mt-0.5" style={{ color: MUTED }}>{info.usage.used} of {info.usage.limit} property {info.usage.limit === 1 ? "slot" : "slots"} used</p>}
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full"
          style={{ backgroundColor: failing ? "rgba(220,38,38,0.1)" : "rgba(37,99,235,0.16)", color: failing ? "#991B1B" : "#2563EB" }}>
          {user.planStatus ?? "Active"}
        </span>
      </div>

      {paid && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div><p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{change ? "Changes on" : "Renewal Date"}</p><p className="text-sm font-medium" style={{ color: FOREST }}>{fmtDate(change?.effectiveAt ?? user.renewalDate)}</p></div>
          <div><p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Billing</p><p className="text-sm font-medium" style={{ color: FOREST }}>£{Number(user.priceAmount ?? 0).toFixed(2)} / {user.billingInterval === "year" ? "year" : "month"}</p></div>
        </div>
      )}
      {!paid && (
        <p className="text-sm" style={{ color: MUTED }}>One basic property with its name, address, map pin and your company details. Upgrade for full property profiles and more properties.</p>
      )}

      {change && (
        <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(217,119,6,0.08)", color: "#92400E" }}>
          {change.change === "cancel"
            ? `Your plan ends on ${fmtDate(change.effectiveAt)}; you'll then be on Free with one basic property.`
            : `You move to ${tierName(change.targetTier) ?? "a smaller plan"} on ${fmtDate(change.effectiveAt)}.`}
          {" "}<Link to="/business/upgrade" className="font-semibold underline">Manage this change</Link>
        </p>
      )}
      {failing && (
        <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(185,28,28,0.08)", color: "#991B1B" }}>
          Your latest payment didn't go through. Update your card in billing to keep your plan.
        </p>
      )}

      <div className="flex gap-3 flex-wrap pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
        <Link to="/business/upgrade" className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>
          {paid ? "Change plan" : "See accommodation plans"}
        </Link>
        {user.stripeCustomerId && (
          <button onClick={onManageBilling} disabled={opening} className="px-5 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50" style={{ color: FOREST, border: `1.5px solid ${BORDER}` }}>
            {opening ? "Opening…" : "Cards & invoices"}
          </button>
        )}
      </div>
    </div>
  );
}
