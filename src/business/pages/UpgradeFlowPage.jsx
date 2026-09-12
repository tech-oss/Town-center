import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import { FOREST, SAGE, MUTED, BORDER, CARD } from "../components/FormKit";
import { PLANS, isPremium } from "../../Data/plans";
import { startPremiumCheckout, openBillingPortal, waitForPremium } from "../api/stripeBilling";

const STEPS = ["Choose Plan", "Terms", "Payment", "Success"];

const PLAN_ICONS = { free: "✈️", premium: "👑" };

function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-2 mb-8 max-w-2xl">
      {STEPS.map((s, i) => {
        const n = i + 1;
        return (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={n <= step ? { backgroundColor: SAGE, color: "#fff" } : { backgroundColor: "rgba(16,24,40,0.08)", color: MUTED }}>
                {n < step ? "✓" : n}
              </div>
              <span className="text-[10px] font-semibold text-center" style={{ color: n <= step ? FOREST : MUTED }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className="h-px flex-1 -mt-5" style={{ backgroundColor: n < step ? SAGE : BORDER }} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Screen 1 — Choose Upgrade Plan ────────────────────────────────────────────
function PlanCard({ plan, isCurrent, onChoose }) {
  const popular = plan.key === "premium";
  return (
    <div className="relative rounded-2xl p-6 flex flex-col gap-4 bg-white"
      style={popular ? { border: `2px solid ${SAGE}`, boxShadow: "0 8px 24px -8px rgba(37,99,235,0.3)" } : CARD}>
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full text-white whitespace-nowrap"
          style={{ backgroundColor: SAGE }}>
          Most Popular
        </span>
      )}
      <div className="text-3xl">{PLAN_ICONS[plan.key]}</div>
      <div>
        <p className="text-lg font-bold" style={{ color: FOREST }}>{plan.name}</p>
        <p className="text-xs mt-0.5" style={{ color: MUTED }}>{plan.tagline}</p>
      </div>
      <p className="text-2xl font-bold" style={{ color: FOREST }}>
        £{plan.price}<span className="text-sm font-medium" style={{ color: MUTED }}>/month</span>
      </p>
      <ul className="flex flex-col gap-2 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="text-sm flex items-start gap-2" style={{ color: FOREST }}>
            <span style={{ color: SAGE }}>✓</span> {f}
          </li>
        ))}
      </ul>
      <button disabled={isCurrent} onClick={() => onChoose(plan)}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={isCurrent ? { backgroundColor: "rgba(16,24,40,0.08)", color: MUTED } : { backgroundColor: SAGE, color: "#fff" }}>
        {isCurrent ? "Current Plan" : `Choose ${plan.name}`}
      </button>
    </div>
  );
}

function ScreenChoosePlan({ user, onChoose }) {
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: FOREST }}>Subscribe to Premium</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>Unlock your full business profile and stand out in Maidenhead.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-5 pt-2 max-w-3xl">
        {PLANS.map((p) => (
          <PlanCard key={p.key} plan={p} isCurrent={p.key === (isPremium(user.plan) ? "premium" : "free")} onChoose={onChoose} />
        ))}
      </div>
      <p className="text-xs text-center" style={{ color: "#9CA3AF" }}>All plans are billed monthly. You can cancel anytime.</p>
    </div>
  );
}

// ─── Screen 2 — Terms & Conditions ─────────────────────────────────────────────
const TERMS_SECTIONS = [
  { title: "1. Introduction", body: "These Terms & Conditions govern your subscription to a paid business listing tier on Business Town ('the Platform'). By proceeding with an upgrade, you agree to the terms set out below in addition to the general Business Town Terms of Use." },
  { title: "2. Subscriptions", body: "Paid plans are billed on a recurring monthly basis from the date of purchase and will automatically renew each month unless cancelled. You may cancel your subscription at any time from your Billing page; cancellation takes effect at the end of the current billing period, and no partial refunds are issued for the remainder of a billing cycle already paid for." },
  { title: "3. Listings", body: "Upgrading your plan unlocks additional listing features (such as extra photos, featured placement and analytics) as described on the plan selection screen. Business Town reserves the right to review, edit or reject listing content that does not comply with our content standards, regardless of subscription tier." },
  { title: "4. Payment Terms", body: "Payments are processed securely by our third-party payment provider. You authorise Business Town to charge your chosen payment method for the selected plan's monthly fee until your subscription is cancelled. Failed payments may result in a temporary downgrade of your listing until payment is resolved." },
  { title: "5. Termination", body: "Business Town may suspend or terminate a subscription for breach of these terms, non-payment, or misuse of the Platform. You may terminate your own subscription at any time via Account Settings. Upon termination, your listing will revert to the Free tier at the end of the current billing period." },
];

function ScreenTerms({ plan, agreed, setAgreed, onBack, onContinue }) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: FOREST }}>Terms & Conditions</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>Please review and agree to continue.</p>
      </div>

      <div className="bg-white rounded-2xl p-5" style={CARD}>
        <div className="overflow-y-auto pr-2" style={{ height: 250, border: `1.5px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
          <div className="flex flex-col gap-4">
            {TERMS_SECTIONS.map((s) => (
              <div key={s.title}>
                <p className="text-sm font-bold mb-1" style={{ color: FOREST }}>{s.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: MUTED }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer mt-5">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4" />
          <span className="text-sm" style={{ color: FOREST }}>I have read and agree to the Business Town Terms &amp; Conditions and Subscription Terms.</span>
        </label>

        <div className="flex items-center gap-2 mt-4 text-xs" style={{ color: MUTED }}>
          <span>🔒</span> Your payment information is secure and encrypted.
        </div>

        <div className="flex items-center gap-4 pt-5 mt-5" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onBack} className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: FOREST }}>← Back</button>
          <button onClick={onContinue} disabled={!agreed}
            className="ml-auto px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
            style={{ backgroundColor: SAGE }}>
            Continue to Payment
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 3 — Secure Payment (mock Stripe checkout) ─────────────────────────
function ScreenPayment({ plan, user, onBack, onPay, paying, error }) {
  return (
    <div className="max-w-3xl bg-white rounded-2xl overflow-hidden grid sm:grid-cols-2" style={CARD}>
      {/* Left — order summary */}
      <div className="p-8 flex flex-col gap-6" style={{ backgroundColor: "#F5F7FB" }}>
        <button onClick={onBack} className="text-xl w-fit transition-opacity hover:opacity-70" style={{ color: FOREST }}>‹</button>
        <div>
          <p className="text-sm" style={{ color: MUTED }}>Subscribe to {plan.name}</p>
          <p className="text-4xl font-bold mt-1" style={{ color: FOREST }}>£{plan.price.toFixed(2)}</p>
          <p className="text-xs" style={{ color: MUTED }}>per month</p>
        </div>
        <div className="flex flex-col gap-2 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="flex justify-between text-sm"><span style={{ color: FOREST }}>{plan.name} plan · {user.businessName}</span><span style={{ color: FOREST }}>£{plan.price.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm font-bold pt-2 mt-2" style={{ borderTop: `1px solid ${BORDER}`, color: FOREST }}><span>Total due today</span><span>£{plan.price.toFixed(2)}</span></div>
        </div>
      </div>

      {/* Right — hand-off to Stripe */}
      <div className="p-8 flex flex-col gap-4 justify-center">
        <p className="text-base font-bold" style={{ color: FOREST }}>Secure payment with Stripe</p>
        <p className="text-sm" style={{ color: MUTED }}>
          You'll enter your card details on Stripe's secure checkout page. We never see or store your card number.
        </p>
        <ul className="flex flex-col gap-1.5 text-xs" style={{ color: MUTED }}>
          <li>✓ Billed monthly — cancel any time from Billing</li>
          <li>✓ Premium unlocks as soon as your payment is confirmed</li>
        </ul>

        {error && (
          <div className="px-3.5 py-2.5 rounded-xl text-xs font-medium" style={{ backgroundColor: "rgba(185,28,28,0.08)", color: "#991B1B" }}>{error}</div>
        )}

        <button onClick={onPay} disabled={paying}
          className="mt-2 px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
          style={{ backgroundColor: SAGE }}>
          {paying ? "Opening secure checkout…" : `Continue to payment — £${plan.price.toFixed(2)}/month`}
        </button>
        <p className="text-[11px] text-center" style={{ color: "#9CA3AF" }}>Payments processed by Stripe</p>
      </div>
    </div>
  );
}

// ─── Screen 4 — Payment Success ────────────────────────────────────────────────
function nextBillingDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function ScreenSuccess({ plan, renewalDate }) {
  const navigate = useNavigate();
  return (
    <div className="max-w-md mx-auto flex flex-col items-center text-center gap-5 py-10 relative overflow-hidden">
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-40px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(220px) rotate(360deg); opacity: 0; }
        }
      `}</style>
      {Array.from({ length: 14 }).map((_, i) => (
        <span key={i} aria-hidden="true" className="absolute top-0 rounded-sm"
          style={{
            left: `${(i * 7 + 3) % 100}%`,
            width: 6, height: 10,
            backgroundColor: [SAGE, "#D97706", FOREST, "#3B82F6"][i % 4],
            animation: `confetti-fall ${1.6 + (i % 5) * 0.3}s ease-in ${i * 0.08}s infinite`,
          }} />
      ))}

      <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl text-white relative z-10" style={{ backgroundColor: "#16A34A" }}>✓</div>
      <div className="relative z-10">
        <h1 className="text-xl font-bold" style={{ color: FOREST }}>Payment Successful!</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>Your {plan.name} Listing is now active.</p>
      </div>

      <div className="w-full bg-white rounded-2xl p-5 text-left relative z-10" style={CARD}>
        <p className="text-sm font-bold mb-3" style={{ color: FOREST }}>Subscription Details</p>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between"><span style={{ color: MUTED }}>Plan</span><span style={{ color: FOREST }}>{plan.name} Listing</span></div>
          <div className="flex justify-between"><span style={{ color: MUTED }}>Amount</span><span style={{ color: FOREST }}>£{plan.price.toFixed(2)} per month</span></div>
          <div className="flex justify-between"><span style={{ color: MUTED }}>Next billing date</span><span style={{ color: FOREST }}>{renewalDate ? new Date(renewalDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : nextBillingDate()}</span></div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 relative z-10">
        <button onClick={() => navigate("/business/dashboard")}
          className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>
          Go to Dashboard
        </button>
        <a href="/" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold" style={{ color: "#2563EB" }}>View Your Listing</a>
      </div>
    </div>
  );
}

// ─── Main flow ──────────────────────────────────────────────────────────────────
// Shown on return from Stripe Checkout while we wait for Stripe to confirm the
// payment to our webhook — the plan isn't Premium until that happens.
function ScreenConfirming({ timedOut, onRetry }) {
  return (
    <div className="max-w-md mx-auto flex flex-col items-center text-center gap-4 py-16">
      {timedOut ? (
        <>
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: "rgba(217,119,6,0.12)" }}>⏳</div>
          <h1 className="text-lg font-bold" style={{ color: FOREST }}>Your payment is still being confirmed</h1>
          <p className="text-sm" style={{ color: MUTED }}>Stripe hasn't confirmed it to us yet. This usually takes a few seconds — check again in a moment. You won't be charged twice.</p>
          <button onClick={onRetry} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: SAGE }}>Check again</button>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-full border-4 animate-spin" style={{ borderColor: "rgba(37,99,235,0.2)", borderTopColor: SAGE }} />
          <h1 className="text-lg font-bold" style={{ color: FOREST }}>Confirming your payment…</h1>
          <p className="text-sm" style={{ color: MUTED }}>Please keep this page open.</p>
        </>
      )}
    </div>
  );
}

export default function UpgradeFlowPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { user, switchUser } = useBusinessAuth();
  const checkout = params.get("checkout");
  const premiumPlan = PLANS.find((p) => p.key === "premium");

  const [step, setStep] = useState(checkout === "success" ? 4 : 1);
  const [plan, setPlan] = useState(checkout === "success" ? premiumPlan : null);
  const [agreed, setAgreed] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  const [notice, setNotice] = useState(checkout === "cancelled" ? "Checkout was cancelled — you haven't been charged." : "");

  async function confirmPayment() {
    setTimedOut(false);
    const sub = await waitForPremium(user.id);
    if (sub) {
      setConfirmed(sub);
      switchUser({ ...user, ...sub });
    } else {
      setTimedOut(true);
    }
  }

  // Back from Stripe: wait for the webhook to put the business on Premium.
  useEffect(() => {
    if (checkout === "success") confirmPayment();
    if (checkout) setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleChoosePlan(p) {
    setNotice("");
    if (p.key === "free") {
      // Leaving Premium means cancelling the Stripe subscription, which is
      // done in Stripe's portal — the plan follows via the webhook.
      try { await openBillingPortal(user.id); } catch (e) { setNotice(e.message); }
      return;
    }
    setPlan(p);
    setStep(2);
  }

  async function handlePay() {
    setPaying(true);
    setError("");
    try {
      await startPremiumCheckout(user.id);
      // The browser is leaving for Stripe; nothing further to do here.
    } catch (e) {
      setError(e.message);
      setPaying(false);
    }
  }

  return (
    <BusinessLayout>
      <StepIndicator step={step} />
      {notice && (
        <div className="max-w-3xl mb-4 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: "rgba(217,119,6,0.08)", border: "1.5px solid rgba(217,119,6,0.3)", color: "#92400E" }}>
          {notice}
        </div>
      )}
      {step === 1 && <ScreenChoosePlan user={user} onChoose={handleChoosePlan} />}
      {step === 2 && plan && (
        <ScreenTerms plan={plan} agreed={agreed} setAgreed={setAgreed}
          onBack={() => setStep(1)} onContinue={() => setStep(3)} />
      )}
      {step === 3 && plan && (
        <ScreenPayment plan={plan} user={user} paying={paying} error={error} onBack={() => setStep(2)} onPay={handlePay} />
      )}
      {step === 4 && !confirmed && <ScreenConfirming timedOut={timedOut} onRetry={confirmPayment} />}
      {step === 4 && confirmed && <ScreenSuccess plan={premiumPlan} renewalDate={confirmed.renewalDate} />}
    </BusinessLayout>
  );
}
