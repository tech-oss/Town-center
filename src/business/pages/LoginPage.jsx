import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import { Field, Inp } from "../components/FormKit";

const FOREST = "#1E293B", SAGE = "#2563EB", MUTED = "#64748B", BORDER = "rgba(16,24,40,0.1)";
const CARD = { backgroundColor: "#fff", border: "1px solid rgba(16,24,40,0.08)", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useBusinessAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { ok, error: err } = await login(email, password);
    setSubmitting(false);
    if (!ok) { setError(err); return; }
    navigate("/business/dashboard");
  }

  return (
    <div className="business-root min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#F5F7FB" }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-2 mb-6">
          <img src="/logo-mark.svg" alt="Maidenhead" style={{ width: 48, height: 48, objectFit: "contain" }} />
          <h1 className="text-xl font-bold" style={{ color: FOREST }}>Business Login</h1>
          <p className="text-sm text-center" style={{ color: MUTED }}>Manage your business page on Maidenhead Town Centre.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={CARD}>
          <Field label="Email"><Inp type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.co.uk" /></Field>
          <Field label="Password"><Inp type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></Field>

          {error && <p className="text-xs font-medium" style={{ color: "#DC2626" }}>{error}</p>}

          <div className="flex justify-end -mt-1">
            <a href="#" onClick={(e) => e.preventDefault()} className="text-xs font-semibold" style={{ color: "#2563EB" }}>Forgot password?</a>
          </div>

          <button type="submit" disabled={submitting} className="mt-1 px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>
            {submitting ? "Logging in…" : "Log In"}
          </button>

          <div className="flex flex-col gap-2 pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
            <p className="text-xs text-center" style={{ color: MUTED }}>Don't have an account?</p>
            <div className="flex gap-2">
              <Link to="/business/signup" className="flex-1 text-center px-3 py-2.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: "#2563EB", border: "1.5px solid rgba(37,99,235,0.3)" }}>
                Register a Business
              </Link>
              <Link to="/business/register-user" className="flex-1 text-center px-3 py-2.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80" style={{ color: FOREST, border: `1.5px solid ${BORDER}` }}>
                Register a User
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
