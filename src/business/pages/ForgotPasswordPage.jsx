import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { Field, Inp } from "../components/FormKit";

const FOREST = "#1E293B", SAGE = "#2563EB", MUTED = "#64748B";
const CARD = { backgroundColor: "#fff", border: "1px solid rgba(16,24,40,0.08)", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };

// "Forgot password?" from the login page. Supabase emails a one-time link
// (sent through Resend, set as Supabase's SMTP server) that opens
// ResetPasswordPage. The answer is the same whether or not the address has an
// account, so this can't be used to find out who's registered.
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Please enter your email address."); return; }
    setSubmitting(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/business/reset-password`,
    });
    setSubmitting(false);
    // Too many requests is worth saying; anything else reads the same as success.
    if (err && /rate|too many|seconds/i.test(err.message)) { setError("Please wait a minute before asking for another link."); return; }
    setSent(true);
  }

  return (
    <div className="business-root min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#F5F7FB" }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-2 mb-6">
          <img src="/logo-mark.svg" alt="Maidenhead" style={{ width: 48, height: 48, objectFit: "contain" }} />
          <h1 className="text-xl font-bold" style={{ color: FOREST }}>Reset your password</h1>
          <p className="text-sm text-center" style={{ color: MUTED }}>
            Enter the email you sign in with and we'll send you a link to choose a new password.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={CARD}>
          {sent ? (
            <>
              <p className="text-sm" style={{ color: FOREST }}>
                If there's an account for <strong>{email.trim()}</strong>, a link to reset the password is on its way.
                It works once and expires after an hour.
              </p>
              <p className="text-xs" style={{ color: MUTED }}>Nothing arrived after a few minutes? Check your spam folder, or try again.</p>
              <button type="button" onClick={() => setSent(false)} className="text-xs font-semibold self-start" style={{ color: SAGE }}>Send another link</button>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="Email"><Inp type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.co.uk" autoFocus /></Field>
              {error && <p className="text-xs font-medium" style={{ color: "#DC2626" }}>{error}</p>}
              <button type="submit" disabled={submitting} className="px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: SAGE }}>
                {submitting ? "Sending…" : "Email me a reset link"}
              </button>
            </form>
          )}
          <Link to="/business/login" className="text-xs font-semibold text-center" style={{ color: MUTED }}>Back to log in</Link>
        </div>
      </div>
    </div>
  );
}
