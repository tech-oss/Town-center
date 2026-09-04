import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import { Field, Inp, Select, FOREST, SAGE, MUTED, BORDER, CARD } from "../components/FormKit";
import { UPGRADE_PLANS } from "../../Data/businessPortalMock";
import { updateSubscription, addPayment } from "../api/businessSubscription";

const STEPS = ["Choose Plan", "Terms", "Payment", "Success"];

const PLAN_ICONS = {
  "paper-plane": "✈️",
  star: "⭐",
  crown: "👑",
};

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
  return (
    <div className="relative rounded-2xl p-6 flex flex-col gap-4 bg-white"
      style={plan.popular ? { border: `2px solid ${SAGE}`, boxShadow: "0 8px 24px -8px rgba(37,99,235,0.3)" } : CARD}>
      {plan.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full text-white whitespace-nowrap"
          style={{ backgroundColor: SAGE }}>
          Most Popular
        </span>
      )}
      <div className="text-3xl">{PLAN_ICONS[plan.icon]}</div>
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
        <h1 className="text-2xl font-bold" style={{ color: FOREST }}>Upgrade Your Business Listing</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>Unlock more visibility and grow your business in Maidenhead.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-5 pt-2">
        {UPGRADE_PLANS.map((p) => (
          <PlanCard key={p.key} plan={p} isCurrent={p.key === user.upgradePlanKey} onChoose={onChoose} />
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
function ScreenPayment({ plan, user, onBack, onPay, paying }) {
  const [email, setEmail] = useState(user.email);
  const [cardName, setCardName] = useState(`${user.firstName} ${user.lastName}`);

  return (
    <div className="max-w-4xl bg-white rounded-2xl overflow-hidden grid sm:grid-cols-2" style={CARD}>
      {/* Left — order summary */}
      <div className="p-8 flex flex-col gap-6" style={{ backgroundColor: "#F5F7FB" }}>
        <button onClick={onBack} className="text-xl w-fit transition-opacity hover:opacity-70" style={{ color: FOREST }}>‹</button>
        <div className="flex items-center gap-2">
          <img src="/logo-mark.svg" alt="" style={{ width: 28, height: 28 }} />
          <span className="text-sm font-bold" style={{ color: FOREST }}>Business Town</span>
        </div>
        <div>
          <p className="text-sm" style={{ color: MUTED }}>Subscribe to {plan.name}</p>
          <p className="text-4xl font-bold mt-1" style={{ color: FOREST }}>£{plan.price.toFixed(2)}</p>
          <p className="text-xs" style={{ color: MUTED }}>per month</p>
        </div>
        <div className="flex flex-col gap-2 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="flex justify-between text-sm"><span style={{ color: FOREST }}>{plan.name} plan</span><span style={{ color: FOREST }}>£{plan.price.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm pt-2 mt-2" style={{ borderTop: `1px solid ${BORDER}`, color: MUTED }}><span>Subtotal</span><span>£{plan.price.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm font-bold pt-2" style={{ color: FOREST }}><span>Total due today</span><span>£{plan.price.toFixed(2)}</span></div>
        </div>
        <div className="mt-auto pt-6 text-[11px]" style={{ color: "#9CA3AF" }}>
          <p className="font-semibold">Powered by <span style={{ color: FOREST }}>stripe</span></p>
          <p className="mt-1"><span className="underline cursor-pointer">Terms</span> · <span className="underline cursor-pointer">Privacy</span></p>
        </div>
      </div>

      {/* Right — payment form */}
      {/* TODO: replace with real Stripe Elements on backend integration */}
      <div className="p-8 flex flex-col gap-4">
        <p className="text-base font-bold" style={{ color: FOREST }}>Pay with card</p>

        <Field label="Email"><Inp type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>

        <Field label="Card Information">
          <div className="rounded-xl overflow-hidden" style={{ border: `1.5px solid ${BORDER}` }}>
            <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <input placeholder="1234 1234 1234 1234" className="flex-1 text-sm outline-none" style={{ color: FOREST }} />
              <span className="text-xs shrink-0 flex gap-1" style={{ color: MUTED }}>💳 Visa · MC · Amex</span>
            </div>
            <div className="flex">
              <input placeholder="MM / YY" className="flex-1 px-3 py-2.5 text-sm outline-none" style={{ color: FOREST, borderRight: `1px solid ${BORDER}` }} />
              <input placeholder="CVC" className="flex-1 px-3 py-2.5 text-sm outline-none" style={{ color: FOREST }} />
            </div>
          </div>
        </Field>

        <Field label="Cardholder Name"><Inp value={cardName} onChange={(e) => setCardName(e.target.value)} /></Field>

        <Field label="Country or Region">
          <Select defaultValue="GB">
            <option value="GB">United Kingdom</option>
            <option value="IE">Ireland</option>
            <option value="US">United States</option>
          </Select>
        </Field>

        <button onClick={onPay} disabled={paying}
          className="mt-2 px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
          style={{ backgroundColor: SAGE }}>
          {paying ? "Processing…" : `Pay £${plan.price.toFixed(2)}`}
        </button>

        <p className="text-[11px] mt-1" style={{ color: "#9CA3AF" }}>
          By confirming your payment, you allow {user.businessName} to charge your card for this payment and future recurring payments in accordance with their terms.
        </p>
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

function ScreenSuccess({ plan }) {
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
          <div className="flex justify-between"><span style={{ color: MUTED }}>Next billing date</span><span style={{ color: FOREST }}>{nextBillingDate()}</span></div>
          <div className="flex justify-between"><span style={{ color: MUTED }}>Payment method</span><span style={{ color: FOREST }}>Visa •••• 4242</span></div>
        </div>
      </div>

      {/* TODO: trigger Supabase subscription record creation and Resend confirmation email */}

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
export default function UpgradeFlowPage() {
  const { user, switchUser } = useBusinessAuth();
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [paying, setPaying] = useState(false);

  function handleChoosePlan(p) {
    setPlan(p);
    setStep(2);
  }
  function handlePay() {
    setPaying(true);
    setTimeout(async () => {
      await updateSubscription(user.id, { upgrade_plan_key: plan.key, plan_status: "Active", cancelled: false });
      await addPayment(user.id, { description: `${plan.name} listing upgrade — monthly`, amount: `£${plan.price.toFixed(2)}` });
      switchUser({ ...user, upgradePlanKey: plan.key, planStatus: "Active", cancelled: false });
      setPaying(false);
      setStep(4);
    }, 1200);
  }

  return (
    <BusinessLayout>
      <StepIndicator step={step} />
      {step === 1 && <ScreenChoosePlan user={user} onChoose={handleChoosePlan} />}
      {step === 2 && plan && (
        <ScreenTerms plan={plan} agreed={agreed} setAgreed={setAgreed}
          onBack={() => setStep(1)} onContinue={() => setStep(3)} />
      )}
      {step === 3 && plan && (
        <ScreenPayment plan={plan} user={user} paying={paying} onBack={() => setStep(2)} onPay={handlePay} />
      )}
      {step === 4 && plan && <ScreenSuccess plan={plan} />}
    </BusinessLayout>
  );
}
