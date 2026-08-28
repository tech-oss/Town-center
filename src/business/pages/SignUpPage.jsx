import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerBusinessAccount, SECTIONS, STAY_TYPES } from "../../api/business/auth";
import { Field, Inp, BLUE, NAVY, MUTED, BORDER, CARD } from "../components/FormKit";

export default function SignUpPage({ onAuth }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ businessName: "", email: "", password: "", section: "", subType: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.businessName.trim() || !form.email.trim() || !form.password || !form.section) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    const res = await registerBusinessAccount(form);
    setSubmitting(false);
    if (!res.ok) { setError(res.error); return; }
    onAuth(res.account);
    navigate("/business/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#F5F7FB", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-2 mb-6">
          <img src="/logo-mark.svg" alt="Maidenhead" style={{ width: 48, height: 48, objectFit: "contain" }} />
          <h1 className="text-xl font-bold" style={{ color: NAVY }}>Register Your Business</h1>
          <p className="text-sm text-center" style={{ color: MUTED }}>List your business on Maidenhead Town Centre and manage your own page.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={CARD}>
          <Field label="Business Name" required>
            <Inp value={form.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="e.g. The Velvet Lounge" />
          </Field>
          <Field label="Email" required>
            <Inp type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@business.co.uk" />
          </Field>
          <Field label="Password" required hint="At least 6 characters">
            <Inp type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" />
          </Field>
          <Field label="Business Category" required>
            <select value={form.section} onChange={(e) => set("section", e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm outline-none" style={{ border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" }}>
              <option value="">Select a category…</option>
              {SECTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>

          {form.section === "live-stay" && (
            <Field label="Listing Type" required>
              <select value={form.subType} onChange={(e) => set("subType", e.target.value)}
                className="rounded-xl px-3 py-2.5 text-sm outline-none" style={{ border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" }}>
                <option value="">Select a type…</option>
                {STAY_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          )}

          {error && <p className="text-xs font-medium" style={{ color: "#DC2626" }}>{error}</p>}

          <button type="submit" disabled={submitting}
            className="mt-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: BLUE }}>
            {submitting ? "Creating account…" : "Create Business Account"}
          </button>

          <p className="text-xs text-center" style={{ color: MUTED }}>
            Already registered? <Link to="/business/login" className="font-semibold" style={{ color: BLUE }}>Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
