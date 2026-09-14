import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import { FOREST, SAGE, MUTED, BORDER } from "../components/FormKit";
import { BILLING_OPTIONS, isPremium, formatPrice } from "../../Data/plans";
import { openBillingPortal, waitForPremium } from "../api/stripeBilling";
import {
  INK, PAGE_TYPE_CSS, TINT, RING, Icon, TermsDialog,
  useVisibilityCheckout, VisibilityPlanCard, VisibilityFeatures, WhyUpgrade, ClosingBand,
} from "../components/VisibilityPlan";

// The Visibility Plan subscription page. One scrolling page rather than a
// wizard: what the business gets, the two ways to pay, and a single action
// that goes straight to Stripe's secure checkout. On return from Stripe it
// waits for the payment to be confirmed to our webhook before celebrating —
// the plan isn't live until then.

// ─── Return-from-Stripe states ───────────────────────────────────────────────
function Confirming({ timedOut, onRetry }) {
  return (
    <div className="max-w-md mx-auto flex flex-col items-center text-center gap-4 py-20">
      {timedOut ? (
        <>
          <span className="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: "#FEF3C7" }}>⏳</span>
          <h1 className="text-xl" style={{ color: INK, fontWeight: 700 }}>Your payment is still being confirmed</h1>
          <p className="text-sm" style={{ color: MUTED }}>Stripe hasn't confirmed it to us yet — this usually takes a few seconds. You won't be charged twice.</p>
          <button onClick={onRetry} className="px-6 py-3 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: SAGE }}>Check again</button>
        </>
      ) : (
        <>
          <span className="w-12 h-12 rounded-full border-4 animate-spin" style={{ borderColor: RING, borderTopColor: SAGE }} />
          <h1 className="text-xl" style={{ color: INK, fontWeight: 700 }}>Confirming your payment…</h1>
          <p className="text-sm" style={{ color: MUTED }}>Please keep this page open.</p>
        </>
      )}
    </div>
  );
}

function Welcome({ subscription }) {
  const navigate = useNavigate();
  const yearly = subscription?.billingInterval === "year";
  return (
    <div className="max-w-xl mx-auto flex flex-col items-center text-center gap-5 py-14">
      <span className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "#DCFCE7" }}>
        <Icon name="check" size={30} color="#16A34A" stroke={2.4} />
      </span>
      <div>
        <h1 className="text-2xl sm:text-3xl tracking-tight" style={{ color: INK, fontWeight: 800 }}>You're on the Visibility Plan</h1>
        <p className="text-sm mt-2" style={{ color: MUTED }}>
          {yearly ? `${formatPrice(BILLING_OPTIONS.year.price)} a year` : `${formatPrice(BILLING_OPTIONS.month.price)} a month`}
          {subscription?.renewalDate ? ` · renews ${new Date(subscription.renewalDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}` : ""}
        </p>
      </div>
      <p className="text-sm max-w-md" style={{ color: MUTED }}>
        Everything is unlocked. Start by adding your description, opening hours and photos — they appear on your page as soon as they're saved.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <button onClick={() => navigate("/business/listing")} className="px-6 py-3 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: SAGE }}>Complete your profile</button>
        <button onClick={() => navigate("/business/dashboard")} className="px-6 py-3 rounded-xl text-sm font-semibold" style={{ border: `1.5px solid ${BORDER}`, color: FOREST }}>Go to dashboard</button>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function UpgradeFlowPage() {
  const [params, setParams] = useSearchParams();
  const { user, switchUser } = useBusinessAuth();
  const checkout = params.get("checkout");

  const vp = useVisibilityCheckout(user.id);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(checkout === "success");
  const [timedOut, setTimedOut] = useState(false);
  const [welcome, setWelcome] = useState(null);
  const [notice, setNotice] = useState(checkout === "cancelled" ? "Checkout was cancelled — you haven't been charged." : "");

  const premium = isPremium(user.plan);

  async function confirmPayment() {
    setTimedOut(false);
    const sub = await waitForPremium(user.id);
    if (sub) {
      switchUser({ ...user, ...sub });
      setWelcome(sub);
      setConfirming(false);
    } else {
      setTimedOut(true);
    }
  }

  // Back from Stripe: wait for the webhook to put the business on the plan.
  useEffect(() => {
    if (checkout === "success") confirmPayment();
    if (checkout) setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function manage() {
    setOpening(true);
    try {
      await openBillingPortal(user.id);
    } catch (e) {
      setError(e.message);
      setOpening(false);
    }
  }

  if (confirming) return <BusinessLayout><Confirming timedOut={timedOut} onRetry={confirmPayment} /></BusinessLayout>;
  if (welcome) return <BusinessLayout><Welcome subscription={welcome} /></BusinessLayout>;

  return (
    <BusinessLayout>
      {vp.showTerms && <TermsDialog onClose={() => vp.setShowTerms(false)} />}

      <style>{PAGE_TYPE_CSS}</style>
      <div className="visibility-plan-page max-w-4xl mx-auto flex flex-col gap-8 sm:gap-10 pb-10">
        {/* ── Status strip ── */}
        {premium ? (
          <div className="rounded-2xl px-5 py-4 flex items-center gap-4 flex-wrap" style={{ backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0" }}>
            <Icon name="check" size={22} color="#059669" stroke={2.2} />
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm font-bold" style={{ color: "#065F46" }}>You're on the Visibility Plan</p>
              <p className="text-xs mt-0.5" style={{ color: "#047857" }}>
                {user.cancelAtPeriodEnd
                  ? `Cancelled — your plan stays active until ${user.renewalDate ? new Date(user.renewalDate).toLocaleDateString("en-GB", { day: "numeric", month: "long" }) : "the end of this period"}.`
                  : "Every feature below is unlocked for your business."}
              </p>
            </div>
            <button onClick={manage} disabled={opening} className="px-4 py-2 rounded-lg text-xs font-semibold bg-white disabled:opacity-60" style={{ color: "#065F46", border: "1px solid #A7F3D0" }}>
              {opening ? "Opening…" : "Manage billing"}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl px-5 py-4 flex items-center gap-4" style={{ backgroundColor: TINT, border: `1px solid ${RING}` }}>
            <Icon name="bars" size={24} />
            <div>
              <p className="vp-strong text-sm" style={{ color: "#1E3A8A" }}>You're already on Maidenhead.com!</p>
              <p className="text-xs mt-0.5" style={{ color: "#3B5BA9" }}>Your business is listed and visible to local people. Upgrade to get more from your profile.</p>
            </div>
          </div>
        )}

        {notice && (
          <div role="status" className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}>{notice}</div>
        )}

        {/* ── Hero ── */}
        <header>
          <h1 className="text-3xl sm:text-[42px] leading-[1.1] tracking-tight" style={{ color: INK, fontWeight: 800 }}>
            Get more visibility for your business
          </h1>
          <p className="vp-strong text-lg sm:text-xl mt-3" style={{ color: "#1E293B" }}>
            Showcase your business, attract more local customers and see what's working.
          </p>
          <p className="text-base mt-3 max-w-3xl leading-relaxed" style={{ color: MUTED }}>
            Upgrade to the Visibility Plan and unlock powerful features to make your business stand out, share your latest news and offers, and understand how people are engaging with your profile.
          </p>
        </header>

        {/* ── Plan & billing ── */}
        {!premium && <VisibilityPlanCard checkout={vp} />}
        {error && (
          <p role="alert" className="text-sm px-4 py-2.5 rounded-xl" style={{ backgroundColor: "#FEF2F2", color: "#991B1B" }}>{error}</p>
        )}

        <VisibilityFeatures included={premium} />

        <WhyUpgrade />

        {/* ── Closing band — billing choice repeated under the button ── */}
        {!premium && <ClosingBand checkout={vp} />}

        {premium && (
          <p className="text-center text-sm" style={{ color: MUTED }}>
            Need your invoices or to change your card? <Link to="/business/billing" className="font-semibold" style={{ color: SAGE }}>Go to Subscriptions &amp; Billing</Link>
          </p>
        )}
      </div>
    </BusinessLayout>
  );
}
