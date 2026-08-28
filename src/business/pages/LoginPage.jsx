import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginBusinessAccount } from "../../api/business/auth";
import { Field, Inp, BLUE, NAVY, MUTED, CARD } from "../components/FormKit";

export default function LoginPage({ onAuth }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await loginBusinessAccount({ email, password });
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
          <h1 className="text-xl font-bold" style={{ color: NAVY }}>Business Login</h1>
          <p className="text-sm text-center" style={{ color: MUTED }}>Manage your business page on Maidenhead Town Centre.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={CARD}>
          <Field label="Email" required>
            <Inp type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.co.uk" />
          </Field>
          <Field label="Password" required>
            <Inp type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </Field>

          {error && <p className="text-xs font-medium" style={{ color: "#DC2626" }}>{error}</p>}

          <button type="submit" disabled={submitting}
            className="mt-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: BLUE }}>
            {submitting ? "Logging in…" : "Log In"}
          </button>

          <p className="text-xs text-center" style={{ color: MUTED }}>
            Don't have an account? <Link to="/business/signup" className="font-semibold" style={{ color: BLUE }}>Register your business</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
