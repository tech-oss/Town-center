import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import { coppaMockUser } from "../../Data/businessPortalMock";
import { Field, Inp } from "../components/FormKit";

const FOREST = "var(--forest)", SAGE = "var(--sage)", MUTED = "#64748B";
const CARD = { backgroundColor: "#fff", border: "1px solid rgba(28,46,56,0.08)", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useBusinessAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    // Mock login — any input succeeds.
    login(coppaMockUser);
    navigate("/business/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#F4F8F7" }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-2 mb-6">
          <img src="/logo-mark.svg" alt="Maidenhead" style={{ width: 48, height: 48, objectFit: "contain" }} />
          <h1 className="text-xl font-bold" style={{ color: FOREST }}>Business Login</h1>
          <p className="text-sm text-center" style={{ color: MUTED }}>Manage your business page on Maidenhead Town Centre.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={CARD}>
          <Field label="Email"><Inp type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.co.uk" /></Field>
          <Field label="Password"><Inp type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></Field>

          <div className="flex justify-end -mt-1">
            <a href="#" onClick={(e) => e.preventDefault()} className="text-xs font-semibold" style={{ color: "#0F766E" }}>Forgot password?</a>
          </div>

          <button type="submit" className="mt-1 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>
            Log In
          </button>

          <p className="text-xs text-center" style={{ color: MUTED }}>
            Don't have an account? <Link to="/business/signup" className="font-semibold" style={{ color: "#0F766E" }}>Register your business</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
