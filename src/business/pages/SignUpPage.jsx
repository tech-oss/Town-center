import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BUSINESS_TYPES, SUBSCRIPTION_PLANS, HOTEL_SITE_TIERS, ACCOMMODATION_TIERS, TERMS_TEXT,
  FREELANCER_KINDS, HOTEL_KINDS, CUISINE_TYPES, VENUE_TYPES, SHOP_CATEGORIES,
} from "../../Data/businessPortalMock";
import { Field, Inp, Select, TextArea } from "../components/FormKit";
import { registerBusiness } from "../api/businessRegistration";

const FOREST = "var(--forest)", SAGE = "var(--sage)", LEAF = "var(--leaf)";
const MUTED = "#64748B", BORDER = "rgba(28,46,56,0.14)";
const CARD = { backgroundColor: "#fff", border: "1px solid rgba(28,46,56,0.08)", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };

const STEPS = ["Your Details", "Business Details", "Plan", "Terms"];

const EMPTY = {
  firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "",
  businessName: "", businessType: "", website: "", businessEmail: "", businessPhone: "", businessAddress: "",
  freelancerKind: "",   // Tradesperson | Professional | Freelancer — for businessType "freelancer"
  hotelKind: "hotel",   // "hotel" | "accommodation" — sub-choice for businessType "hotel"
  cuisineTypes: [],     // multi-select, for businessType "eat-drink"
  venueTypes: [],       // multi-select, for businessType "eat-drink"
  shopCategories: [],   // multi-select, for businessType "shop"
  siteTierKey: "1",
  planKey: "standard",
  agreeTerms: false, agreePrivacy: false,
};

function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2 flex-1">
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={i <= step ? { backgroundColor: SAGE, color: "#fff" } : { backgroundColor: "rgba(28,46,56,0.08)", color: MUTED }}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className="text-[10px] font-semibold text-center" style={{ color: i <= step ? FOREST : MUTED }}>{s}</span>
          </div>
          {i < STEPS.length - 1 && <div className="h-px flex-1 -mt-5" style={{ backgroundColor: i < step ? SAGE : BORDER }} />}
        </div>
      ))}
    </div>
  );
}

function PricingCard({ label, price, selected, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="text-left rounded-xl p-4 flex flex-col gap-1 transition-all"
      style={selected ? { border: `2px solid ${SAGE}`, backgroundColor: "rgba(82,199,182,0.06)" } : { border: `1.5px solid ${BORDER}`, backgroundColor: "#fff" }}>
      <span className="text-sm font-bold" style={{ color: FOREST }}>{label}</span>
      <span className="text-xs" style={{ color: MUTED }}>{price != null ? `£${price}/mo` : "Contact us for pricing"}</span>
    </button>
  );
}

// ─── Single-select "pick one" radio cards ─────────────────────────────────────
function RadioGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label key={o.value} className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all"
          style={value === o.value ? { border: `1.5px solid ${SAGE}`, backgroundColor: "rgba(82,199,182,0.08)" } : { border: `1.5px solid ${BORDER}`, backgroundColor: "#fff" }}>
          <input type="radio" checked={value === o.value} onChange={() => onChange(o.value)} className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold" style={{ color: FOREST }}>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

// ─── Multi-select checkbox chips, optionally grouped ──────────────────────────
function CheckGroup({ options, selected, onChange, grouped }) {
  function toggle(v) {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  }
  function Chip({ o }) {
    const checked = selected.includes(o.value);
    return (
      <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all"
        style={checked ? { border: `1.5px solid ${SAGE}`, backgroundColor: "rgba(82,199,182,0.08)" } : { border: `1.5px solid ${BORDER}`, backgroundColor: "#fff" }}>
        <input type="checkbox" checked={checked} onChange={() => toggle(o.value)} className="w-3.5 h-3.5" />
        <span className="text-xs font-medium" style={{ color: FOREST }}>{o.label}</span>
      </label>
    );
  }
  if (!grouped) {
    return <div className="flex flex-wrap gap-2">{options.map((o) => <Chip key={o.value} o={o} />)}</div>;
  }
  const groups = [...new Set(options.map((o) => o.group))];
  return (
    <div className="flex flex-col gap-3">
      {groups.map((g) => (
        <div key={g}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: MUTED }}>{g}</p>
          <div className="flex flex-wrap gap-2">
            {options.filter((o) => o.group === g).map((o) => <Chip key={o.value} o={o} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function PlanCard({ plan, selected, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="text-left rounded-2xl p-5 flex flex-col gap-3 transition-all"
      style={selected ? { border: `2px solid ${SAGE}`, backgroundColor: "rgba(82,199,182,0.06)" } : { border: `1.5px solid ${BORDER}`, backgroundColor: "#fff" }}>
      <div>
        <span className="text-base font-bold" style={{ color: FOREST }}>{plan.name}</span>
        <p className="text-xl font-bold mt-1" style={{ color: FOREST }}>{plan.price === 0 ? "Free" : `£${plan.price}/mo`}</p>
      </div>
      <ul className="flex flex-col gap-1.5">
        {plan.features.map((f) => (
          <li key={f} className="text-xs flex items-start gap-1.5" style={{ color: MUTED }}>
            <span style={{ color: SAGE }}>✓</span> {f}
          </li>
        ))}
      </ul>
    </button>
  );
}

export default function SignUpPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  const isHotel = form.businessType === "hotel";

  function validStep() {
    if (step === 0) return form.firstName.trim() && form.lastName.trim() && form.email.trim() && form.phone.trim() && form.password && form.password === form.confirmPassword;
    if (step === 1) {
      if (!(form.businessName.trim() && form.businessType && form.businessAddress.trim())) return false;
      if (form.businessType === "freelancer" && !form.freelancerKind) return false;
      if (form.businessType === "eat-drink" && !(form.cuisineTypes.length && form.venueTypes.length)) return false;
      if (form.businessType === "shop" && !form.shopCategories.length) return false;
      return true;
    }
    if (step === 2) return true;
    if (step === 3) return form.agreeTerms && form.agreePrivacy;
    return true;
  }

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    const res = await registerBusiness(form);
    setSubmitting(false);
    if (!res.ok) { setError(res.error); return; }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#F4F8F7" }}>
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center flex flex-col items-center gap-4" style={CARD}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: "rgba(82,199,182,0.16)", color: "#0F766E" }}>✓</div>
          <h1 className="text-xl font-bold" style={{ color: FOREST }}>Application submitted!</h1>
          <p className="text-sm" style={{ color: MUTED }}>We'll review your details and send you a confirmation email within 1-2 business days.</p>
          <Link to="/business/login" className="mt-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#F4F8F7" }}>
      <div className="max-w-2xl w-full">
        <div className="flex flex-col items-center gap-2 mb-6">
          <img src="/logo-mark.svg" alt="Maidenhead" style={{ width: 48, height: 48, objectFit: "contain" }} />
          <h1 className="text-xl font-bold" style={{ color: FOREST }}>Register Your Business</h1>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8" style={CARD}>
          <StepIndicator step={step} />

          {step === 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="First Name" required><Inp value={form.firstName} onChange={(e) => set("firstName", e.target.value)} /></Field>
              <Field label="Last Name" required><Inp value={form.lastName} onChange={(e) => set("lastName", e.target.value)} /></Field>
              <Field label="Email Address" required span2><Inp type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
              <Field label="Phone Number" required><Inp value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
              <Field label="Password" required><Inp type="password" value={form.password} onChange={(e) => set("password", e.target.value)} /></Field>
              <Field label="Confirm Password" required>
                <Inp type="password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} />
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <span className="text-[10px]" style={{ color: "#DC2626" }}>Passwords do not match.</span>
                )}
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Business Name" required span2><Inp value={form.businessName} onChange={(e) => set("businessName", e.target.value)} /></Field>
              <Field label="Business Type" required>
                <Select value={form.businessType} onChange={(e) => set("businessType", e.target.value)}>
                  <option value="">Select a type…</option>
                  {BUSINESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </Field>
              <Field label="Business Website URL"><Inp value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" /></Field>
              <Field label="Business Email" hint="Can be the same as your personal email"><Inp value={form.businessEmail} onChange={(e) => set("businessEmail", e.target.value)} /></Field>
              <Field label="Business Phone"><Inp value={form.businessPhone} onChange={(e) => set("businessPhone", e.target.value)} /></Field>
              <Field label="Business Address" required span2><TextArea rows={2} value={form.businessAddress} onChange={(e) => set("businessAddress", e.target.value)} /></Field>

              {form.businessType === "freelancer" && (
                <Field label="Which best describes you?" required span2>
                  <RadioGroup options={FREELANCER_KINDS} value={form.freelancerKind} onChange={(v) => set("freelancerKind", v)} />
                </Field>
              )}

              {form.businessType === "hotel" && (
                <Field label="Are you listing a hotel or an accommodation property?" required span2>
                  <RadioGroup options={HOTEL_KINDS} value={form.hotelKind} onChange={(v) => set("hotelKind", v)} />
                </Field>
              )}

              {form.businessType === "eat-drink" && (
                <>
                  <Field label="Cuisine Type" required span2 hint="Select all that apply">
                    <CheckGroup options={CUISINE_TYPES} selected={form.cuisineTypes} onChange={(v) => set("cuisineTypes", v)} />
                  </Field>
                  <Field label="Venue Type" required span2 hint="Select all that apply">
                    <CheckGroup options={VENUE_TYPES} selected={form.venueTypes} onChange={(v) => set("venueTypes", v)} />
                  </Field>
                </>
              )}

              {form.businessType === "shop" && (
                <Field label="Shop Category" required span2 hint="Select all that apply">
                  <CheckGroup options={SHOP_CATEGORIES} selected={form.shopCategories} onChange={(v) => set("shopCategories", v)} grouped />
                </Field>
              )}
            </div>
          )}

          {step === 2 && (isHotel ? (
            <div className="flex flex-col gap-5">
              <p className="text-base font-bold" style={{ color: FOREST }}>
                How many {form.hotelKind === "hotel" ? "sites" : "properties"} do you want to list?
              </p>
              <p className="text-xs -mt-3" style={{ color: MUTED }}>
                {form.hotelKind === "hotel" ? "Hotel sites" : "Accommodation properties"}
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {(form.hotelKind === "hotel" ? HOTEL_SITE_TIERS : ACCOMMODATION_TIERS).map((t) => (
                  <PricingCard key={t.key} label={t.label} price={t.price} selected={form.siteTierKey === t.key} onClick={() => set("siteTierKey", t.key)} />
                ))}
              </div>
              <p className="text-xs italic" style={{ color: MUTED }}>Note: Final pricing confirmed on account approval.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-base font-bold" style={{ color: FOREST }}>Choose a subscription plan</p>
              <div className="grid sm:grid-cols-3 gap-3">
                {SUBSCRIPTION_PLANS.map((p) => (
                  <PlanCard key={p.key} plan={p} selected={form.planKey === p.key} onClick={() => set("planKey", p.key)} />
                ))}
              </div>
            </div>
          ))}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl p-4 max-h-64 overflow-y-auto text-xs leading-relaxed whitespace-pre-line" style={{ border: `1.5px solid ${BORDER}`, color: MUTED, backgroundColor: "#f8fafc" }}>
                {TERMS_TEXT}
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.agreeTerms} onChange={(e) => set("agreeTerms", e.target.checked)} className="mt-0.5 w-4 h-4" />
                <span className="text-sm" style={{ color: FOREST }}>I have read and agree to the Terms of Use.</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.agreePrivacy} onChange={(e) => set("agreePrivacy", e.target.checked)} className="mt-0.5 w-4 h-4" />
                <span className="text-sm" style={{ color: FOREST }}>I consent to my details being used as described in the Privacy Policy.</span>
              </label>
              <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Your acceptance of these terms is logged with a timestamp and stored in your account for your records.</p>
            </div>
          )}

          {error && <p className="text-xs font-medium mt-4" style={{ color: "#DC2626" }}>{error}</p>}

          <div className="flex gap-3 pt-6 mt-6" style={{ borderTop: `1px solid ${BORDER}` }}>
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>
                Back
              </button>
            )}
            {step < 3 ? (
              <button onClick={() => setStep((s) => s + 1)} disabled={!validStep()}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>
                Continue
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={!validStep() || submitting}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>
                {submitting ? "Creating Account…" : "Create Account"}
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-center mt-4" style={{ color: MUTED }}>
          Already registered? <Link to="/business/login" className="font-semibold" style={{ color: "#0F766E" }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
