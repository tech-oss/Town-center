import { useState } from "react";
import useAdminAuth from "../hooks/useAdminAuth";
import { NAVY, BLUE, MUTED, CARD, FIELD_STYLE } from "../theme";

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await login(email, password);
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#f6f8fb" }}>
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl p-8 flex flex-col gap-5" style={CARD}>
        <div>
          <h1 className="text-xl font-bold" style={{ color: NAVY }}>Admin Sign In</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Maidenhead Town Centre control panel.</p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold" style={{ color: MUTED }}>Email</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm outline-none" style={FIELD_STYLE} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold" style={{ color: MUTED }}>Password</span>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm outline-none" style={FIELD_STYLE} />
        </label>

        {error && <p className="text-xs font-medium" style={{ color: "#991B1B" }}>{error}</p>}

        <button type="submit" disabled={busy}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: BLUE }}>
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
