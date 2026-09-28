import { useState } from "react";
import useBusinessAuth from "../hooks/useBusinessAuth";
import { Field, Inp } from "../components/FormKit";

const FOREST = "#1E293B", SAGE = "#2563EB", MUTED = "#64748B";
const CARD = { backgroundColor: "#fff", border: "1px solid rgba(16,24,40,0.08)", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };

// The first thing an invited Content Manager sees after clicking the link in
// their invite email — they have an account (invite-content-manager created
// it) but no password, since inviteUserByEmail never asks for one. Next stop
// after this is accept-terms; BusinessApp's route guard sends them there on
// its own once this is done.
export default function SetPasswordPage() {
  const { user, setOwnPassword } = useBusinessAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isValid = password.length >= 8 && password === confirm;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isValid) { setError("Passwords must match and be at least 8 characters."); return; }
    setSubmitting(true);
    const res = await setOwnPassword(password);
    setSubmitting(false);
    if (!res.ok) setError(res.error);
  }

  return (
    <div className="business-root min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#F5F7FB" }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-2 mb-6">
          <img src="/logo-mark.svg" alt="Maidenhead" style={{ width: 48, height: 48, objectFit: "contain" }} />
          <h1 className="text-xl font-bold" style={{ color: FOREST }}>Welcome{user?.firstName ? `, ${user.firstName}` : ""}</h1>
          <p className="text-sm text-center" style={{ color: MUTED }}>
            {user?.businessName ? `${user.businessName} added you as a Content Manager. ` : ""}
            Set a password to finish setting up your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={CARD}>
          <Field label="Password" required><Inp type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          <Field label="Confirm Password" required>
            <Inp type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            {confirm && confirm !== password && (
              <span className="text-[10px]" style={{ color: "#DC2626" }}>Passwords do not match.</span>
            )}
          </Field>

          {error && <p className="text-xs font-medium" style={{ color: "#DC2626" }}>{error}</p>}

          <button type="submit" disabled={!isValid || submitting}
            className="mt-1 px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>
            {submitting ? "Saving…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
