import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { submitUserRegistration, listBusinesses } from "../hooks/useUserRegistry";
import { Field, Inp } from "../components/FormKit";

const FOREST = "#1E293B", SAGE = "#2563EB", MUTED = "#64748B", BORDER = "rgba(16,24,40,0.1)";
const CARD = { backgroundColor: "#fff", border: "1px solid rgba(16,24,40,0.08)", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };

// Searchable "which business are you joining" picker.
function BusinessPicker({ value, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const rootRef = useRef(null);

  useEffect(() => {
    listBusinesses().then(setBusinesses).catch(() => setBusinesses([]));
  }, []);

  const selected = businesses.find((b) => b.id === value) ?? null;
  const matches = query.trim()
    ? businesses.filter((b) => b.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    function onClick(e) { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (selected) {
    return (
      <div className="flex items-center gap-2 w-fit px-3 py-2 rounded-xl" style={{ backgroundColor: "rgba(37,99,235,0.07)", border: "1.5px solid rgba(37,99,235,0.3)" }}>
        <span className="text-sm font-semibold" style={{ color: FOREST }}>{selected.name}</span>
        <button type="button" onClick={() => onChange("")} className="text-xs font-bold" style={{ color: "#2563EB" }}>✕</button>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <Inp value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} onFocus={() => query && setOpen(true)}
        placeholder="Search for a business..." />
      {open && query.trim() && (
        <div className="absolute z-20 mt-1 w-full rounded-xl overflow-hidden bg-white max-h-56 overflow-y-auto"
          style={{ border: `1.5px solid ${BORDER}`, boxShadow: "0 8px 24px rgba(16,24,40,0.12)" }}>
          {matches.length === 0 ? (
            <p className="px-3 py-2.5 text-xs" style={{ color: MUTED }}>No businesses found.</p>
          ) : matches.map((b) => (
            <button key={b.id} type="button" onClick={() => { onChange(b.id); setQuery(""); setOpen(false); }}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors" style={{ color: FOREST, borderBottom: `1px solid ${BORDER}` }}>
              {b.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const EMPTY = { businessId: "", firstName: "", lastName: "", email: "", password: "", confirmPassword: "" };

export default function RegisterUserPage() {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  const isValid = form.businessId && form.firstName.trim() && form.lastName.trim() && form.email.trim()
    && form.password && form.password === form.confirmPassword;

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isValid) { setError("Please fill in all fields — passwords must match."); return; }
    setSubmitting(true);
    const res = await submitUserRegistration(form);
    setSubmitting(false);
    if (!res.ok) { setError(res.error); return; }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="business-root min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#F5F7FB" }}>
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center flex flex-col items-center gap-4" style={CARD}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: "rgba(37,99,235,0.16)", color: "#2563EB" }}>✓</div>
          <h1 className="text-xl font-bold" style={{ color: FOREST }}>Request sent</h1>
          <p className="text-sm" style={{ color: MUTED }}>Your registration request is sent to the business, you will be notified when you'll be approved.</p>
          <Link to="/business/login" className="mt-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="business-root min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#F5F7FB" }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-2 mb-6">
          <img src="/logo-mark.svg" alt="Maidenhead" style={{ width: 48, height: 48, objectFit: "contain" }} />
          <h1 className="text-xl font-bold" style={{ color: FOREST }}>Register as a User</h1>
          <p className="text-sm text-center" style={{ color: MUTED }}>Join an existing business as a content manager — the business owner must approve your request.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={CARD}>
          <Field label="Business" required>
            <BusinessPicker value={form.businessId} onChange={(v) => set("businessId", v)} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="First Name" required><Inp value={form.firstName} onChange={(e) => set("firstName", e.target.value)} /></Field>
            <Field label="Last Name" required><Inp value={form.lastName} onChange={(e) => set("lastName", e.target.value)} /></Field>
          </div>
          <Field label="Email" required><Inp type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Password" required><Inp type="password" value={form.password} onChange={(e) => set("password", e.target.value)} /></Field>
            <Field label="Confirm Password" required>
              <Inp type="password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <span className="text-[10px]" style={{ color: "#DC2626" }}>Passwords do not match.</span>
              )}
            </Field>
          </div>

          {error && <p className="text-xs font-medium" style={{ color: "#DC2626" }}>{error}</p>}

          <button type="submit" disabled={!isValid || submitting} className="mt-1 px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>
            {submitting ? "Sending…" : "Send Registration Request"}
          </button>

          <p className="text-xs text-center" style={{ color: MUTED }}>
            Registering a new business instead? <Link to="/business/signup" className="font-semibold" style={{ color: "#2563EB" }}>Register a Business</Link>
          </p>
          <p className="text-xs text-center" style={{ color: MUTED }}>
            Already registered? <Link to="/business/login" className="font-semibold" style={{ color: "#2563EB" }}>Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
