import { useState } from "react";
import { SAGE, MUTED, BORDER } from "./FormKit";
import { PREMIUM_PLAN, BILLING_OPTIONS, VISIBILITY_FEATURES, formatPrice } from "../../Data/plans";
import { startPremiumCheckout } from "../api/stripeBilling";

// The Visibility Plan's sales sections, shared by the subscription page
// (UpgradeFlowPage) and Subscriptions & Billing, so both say the same thing and
// both send the business straight to Stripe Checkout.

export const INK = "#0F172A";

export const PAGE_TYPE_CSS = `
  .visibility-plan-page h1 { font-weight: 800 !important; letter-spacing: -0.025em; }
  .visibility-plan-page h2 { font-weight: 700 !important; }
  .visibility-plan-page .vp-plan-title { font-weight: 800 !important; }
  .visibility-plan-page .vp-price { font-weight: 800 !important; }
  .visibility-plan-page .vp-strong { font-weight: 700 !important; }
`;
export const TINT = "#EFF4FF";
export const RING = "rgba(37,99,235,0.18)";

const TERMS = [
  { title: "Subscriptions", body: "The Visibility Plan is billed monthly or annually from the date you subscribe and renews automatically until cancelled. Cancel any time from Subscriptions & Billing; cancellation takes effect at the end of the period you've paid for, and no partial refunds are given for the remainder of that period." },
  { title: "Your listing", body: "Subscribing unlocks the features described on this page. We may review, edit or remove listing content that doesn't meet our content standards, whatever plan you're on." },
  { title: "Payments", body: "Payments are processed securely by Stripe. You authorise us to charge your chosen payment method for the plan you select until you cancel. If a payment fails, your listing may return to the Free plan until it's resolved." },
  { title: "Ending your plan", body: "We may suspend or end a subscription for breach of these terms or non-payment. When a subscription ends, your listing returns to the Free plan and your paid-only content is hidden, not deleted." },
];

// ─── Icons — simple 24px line icons, drawn in the brand blue ─────────────────
const PATHS = {
  logo: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></>,
  photos: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-6 6-2-2-5 5" /></>,
  hours: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  headline: <><path d="M5 5h14M12 5v14M9 19h6" /></>,
  description: <><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
  social: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.5M8.2 13.2l7.6 4.5" /></>,
  website: <><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1.2 1.2" /><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1.2-1.2" /></>,
  booking: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h2M14 14h2M8 17h2" /></>,
  articles: <><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5M9 12h2M9 16h6" /></>,
  analytics: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  eye: <><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></>,
  people: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0" /><circle cx="17.5" cy="8.5" r="2.5" /><path d="M16 14.5a5 5 0 016 5.5" /></>,
  bars: <><path d="M6 20v-6M12 20V9M18 20V4" /><path d="M4 20h16" /></>,
  heart: <path d="M20.8 5.6a5 5 0 00-7.1 0L12 7.3l-1.7-1.7a5 5 0 00-7.1 7.1L12 21.5l8.8-8.8a5 5 0 000-7.1z" />,
  trend: <><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></>,
  check: <path d="M20 6L9 17l-5-5" />,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></>,
  reviews: <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z" />,
  moreArticles: <><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5M9 12h6M9 16h6" /><circle cx="18.5" cy="18.5" r="3.2" /><path d="M18.5 17.3v3.4M16.8 19h3.4" /></>,
  events: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /><circle cx="9.5" cy="15" r="1.2" /><circle cx="14.5" cy="15" r="1.2" /></>,
  push: <><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" /></>,
  spotlight: <><path d="M3 11l14-7v16L3 13z" /><path d="M7 13v4a2 2 0 002 2h1" /><path d="M17 8a3 3 0 010 6" /></>,
};

export function Icon({ name, size = 22, color = SAGE, stroke = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

export function IconBubble({ name }) {
  return (
    <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: TINT }}>
      <Icon name={name} size={20} />
    </span>
  );
}

// ─── Billing option (radio card) ────────────────────────────────────────────
export function BillingOption({ option, selected, onSelect }) {
  const isYear = option.key === "year";
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(option.key)}
      className="relative flex items-center gap-3.5 rounded-2xl px-4 sm:px-5 py-4 text-left transition-all focus:outline-none focus-visible:ring-4"
      style={{
        border: selected ? `2px solid ${SAGE}` : `1.5px solid ${BORDER}`,
        backgroundColor: selected ? "#F6F9FF" : "#fff",
        boxShadow: selected ? `0 0 0 4px ${RING}` : "none",
      }}
    >
      <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
        style={{ border: `2px solid ${selected ? SAGE : "#CBD5E1"}` }}>
        {selected && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SAGE }} />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-baseline gap-1 flex-wrap">
          <span className="vp-price text-2xl tracking-tight" style={{ color: INK }}>{formatPrice(option.price)}</span>
          <span className="text-sm font-medium" style={{ color: MUTED }}>{option.label}</span>
        </span>
        <span className="block text-sm mt-0.5" style={{ color: selected ? SAGE : MUTED, fontWeight: selected ? 600 : 400 }}>
          Just {option.perDay} a day
        </span>
      </span>
      {isYear && option.saving > 0 && (
        <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: "#DBEAFE", color: "#1D4ED8" }}>
          Save £{option.saving}
        </span>
      )}
    </button>
  );
}

// ─── Terms dialog ───────────────────────────────────────────────────────────
export function TermsDialog({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(15,23,42,0.55)" }} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="terms-title"
        className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 id="terms-title" className="text-lg" style={{ color: INK, fontWeight: 700 }}>Visibility Plan terms</h2>
          <button onClick={onClose} aria-label="Close" className="text-xl leading-none opacity-50 hover:opacity-90" style={{ color: INK }}>✕</button>
        </div>
        <div className="flex flex-col gap-4">
          {TERMS.map((t) => (
            <div key={t.title}>
              <p className="text-sm font-bold" style={{ color: INK }}>{t.title}</p>
              <p className="text-sm leading-relaxed mt-1" style={{ color: MUTED }}>{t.body}</p>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-6 w-full py-3 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: SAGE }}>Close</button>
      </div>
    </div>
  );
}

// ─── Checkout state shared by every upgrade button on a page ────────────────
export function useVisibilityCheckout(businessId) {
  const [billing, setBilling] = useState("year");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [showTerms, setShowTerms] = useState(false);

  async function upgrade() {
    setStarting(true);
    setError("");
    try {
      await startPremiumCheckout(businessId, billing);
      // The browser is leaving for Stripe.
    } catch (e) {
      setError(e.message);
      setStarting(false);
    }
  }

  return { billing, setBilling, starting, error, showTerms, setShowTerms, upgrade };
}

export function CtaButton({ checkout, className = "", full = false }) {
  return (
    <button
      type="button"
      onClick={checkout.upgrade}
      disabled={checkout.starting}
      className={`${full ? "w-full" : ""} px-7 py-3.5 rounded-xl text-base font-semibold text-white transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-60 focus:outline-none focus-visible:ring-4 ${className}`}
      style={{ backgroundColor: SAGE, boxShadow: "0 10px 24px -10px rgba(37,99,235,0.6)" }}
    >
      {checkout.starting ? "Opening secure checkout…" : "Upgrade to Visibility Plan"}
    </button>
  );
}

// Yearly / monthly radio cards. Every copy on a page shares one selection.
export function BillingChoice({ checkout, className = "" }) {
  return (
    <div role="radiogroup" aria-label="Billing" className={`grid sm:grid-cols-2 gap-3 sm:gap-4 ${className}`}>
      <BillingOption option={BILLING_OPTIONS.year} selected={checkout.billing === "year"} onSelect={checkout.setBilling} />
      <BillingOption option={BILLING_OPTIONS.month} selected={checkout.billing === "month"} onSelect={checkout.setBilling} />
    </div>
  );
}

function CheckoutSmallPrint({ checkout }) {
  const chosen = BILLING_OPTIONS[checkout.billing];
  return (
    <>
      {checkout.error && (
        <p role="alert" className="mt-3 text-sm px-4 py-2.5 rounded-xl" style={{ backgroundColor: "#FEF2F2", color: "#991B1B" }}>{checkout.error}</p>
      )}
      <p className="text-center text-sm mt-3" style={{ color: MUTED }}>
        Choose monthly or annual billing. No long-term contract. Cancel anytime.
      </p>
      <p className="text-center text-xs mt-1.5 flex items-center justify-center gap-1.5 flex-wrap" style={{ color: "#94A3B8" }}>
        <Icon name="lock" size={13} color="#94A3B8" />
        Secure payment by Stripe · {formatPrice(chosen.price)}{chosen.label} · By upgrading you agree to the{" "}
        <button type="button" onClick={() => checkout.setShowTerms(true)} className="underline font-semibold" style={{ color: MUTED }}>plan terms</button>
      </p>
    </>
  );
}

// ─── The plan card: name, billing choice, upgrade button ────────────────────
export function VisibilityPlanCard({ checkout }) {
  return (
    <section aria-labelledby="plan-title" className="relative rounded-3xl p-5 sm:p-8 bg-white"
      style={{ border: `1px solid ${BORDER}`, boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 20px 50px -30px rgba(37,99,235,0.35)" }}>
      <span className="absolute -top-3.5 left-5 sm:left-8 text-[11px] font-bold uppercase tracking-[0.08em] px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: SAGE }}>
        Recommended
      </span>

      <div className="flex items-start justify-between gap-6 flex-wrap mt-2">
        <div className="max-w-md">
          <h2 id="plan-title" className="vp-plan-title text-2xl sm:text-3xl tracking-tight" style={{ color: INK, fontWeight: 800 }}>{PREMIUM_PLAN.name}</h2>
          <p className="text-base mt-1.5" style={{ color: MUTED }}>{PREMIUM_PLAN.tagline}</p>
        </div>
        <p className="hidden md:block text-[22px] leading-tight -rotate-3 mt-1 pr-2"
          style={{ color: SAGE, fontFamily: '"Caveat", "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive' }}>
          A small investment<br />for a bigger local impact ↙
        </p>
      </div>

      <BillingChoice checkout={checkout} className="mt-6" />

      <div className="mt-5">
        <CtaButton checkout={checkout} full />
      </div>

      <CheckoutSmallPrint checkout={checkout} />
    </section>
  );
}

// ─── What's included ─────────────────────────────────────────────────────────
export function VisibilityFeatures({ included = false }) {
  return (
    <section aria-labelledby="features-title" className="rounded-3xl p-5 sm:p-8 bg-white" style={{ border: `1px solid ${BORDER}` }}>
      <h2 id="features-title" className="text-xl sm:text-2xl" style={{ color: INK, fontWeight: 700 }}>
        What you'll get with the Visibility Plan
      </h2>
      <div className="grid md:grid-cols-2 mt-6">
        {(() => {
          // Split evenly rather than a fixed 5/5, so the two columns stay
          // balanced as features are added or removed.
          const half = Math.ceil(VISIBILITY_FEATURES.length / 2);
          return [VISIBILITY_FEATURES.slice(0, half), VISIBILITY_FEATURES.slice(half)];
        })().map((column, ci) => (
          <ul key={ci} className={ci === 0 ? "md:pr-10 md:border-r" : "md:pl-10"} style={{ borderColor: BORDER }}>
            {column.map((f) => (
              <li key={f.title} className="flex items-start gap-4 py-3">
                <IconBubble name={f.icon} />
                <div className="min-w-0 pt-0.5">
                  <p className="vp-strong text-[15px]" style={{ color: INK }}>{f.title}</p>
                  <p className="text-sm mt-0.5 leading-snug" style={{ color: MUTED }}>{f.detail}</p>
                </div>
                {included && <span className="ml-auto pt-1"><Icon name="check" size={18} color="#16A34A" stroke={2.4} /></span>}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}

// ─── Why upgrade ─────────────────────────────────────────────────────────────
export function WhyUpgrade() {
  return (
    <section aria-labelledby="why-title">
      <h2 id="why-title" className="text-xl sm:text-2xl mb-5" style={{ color: INK, fontWeight: 700 }}>Why upgrade?</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x" style={{ borderColor: BORDER }}>
        {[
          { icon: "eye", title: "Be more visible", body: "Give customers more information and more reasons to choose you." },
          { icon: "people", title: "Showcase your business", body: "Use photos, offers and articles to tell your story." },
          { icon: "bars", title: "Turn visitors into customers", body: "Connect directly to your website, social media and booking system." },
          { icon: "heart", title: "See what's working", body: "Use analytics to understand how people are engaging with your profile." },
        ].map((w, i) => (
          <div key={w.title} className={`flex flex-col gap-2 ${i > 0 ? "lg:pl-6" : ""} ${i < 3 ? "lg:pr-6" : ""}`} style={{ borderColor: BORDER }}>
            <Icon name={w.icon} size={32} stroke={1.6} />
            <p className="vp-strong text-[15px] mt-1" style={{ color: INK }}>{w.title}</p>
            <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{w.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Closing band: a last upgrade button, with the billing choice under it ───
export function ClosingBand({ checkout }) {
  return (
    <section className="rounded-3xl px-5 sm:px-8 py-6 flex flex-col gap-5" style={{ backgroundColor: TINT, border: `1px solid ${RING}` }}>
      <div className="flex items-center gap-5 flex-wrap">
        <Icon name="trend" size={34} stroke={2} />
        <div className="flex-1 min-w-[220px]">
          <p className="vp-strong text-lg" style={{ color: INK }}>A small investment in your local visibility</p>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>
            Upgrade to the Visibility Plan today — from {BILLING_OPTIONS.year.perDay} a day — and take your business profile to the next level.
          </p>
        </div>
        <CtaButton checkout={checkout} className="w-full sm:w-auto" />
      </div>
      <BillingChoice checkout={checkout} />
      <CheckoutSmallPrint checkout={checkout} />
    </section>
  );
}
