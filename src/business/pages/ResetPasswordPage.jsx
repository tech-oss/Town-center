import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { Field, Inp } from "../components/FormKit";

const FOREST = "#1E293B", SAGE = "#2563EB", MUTED = "#64748B";
const CARD = { backgroundColor: "#fff", border: "1px solid rgba(16,24,40,0.08)", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };

// Where the reset link lands — from "Forgot password?", or the invitation
// admin emails when it registers a login ("Choose my password"). The link
// signs the person in for this one purpose; they choose a password, every
// session is signed out (so an old one can't linger), and they log in fresh.
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  // An expired or used link comes back with the reason in the address.
  const [linkError] = useState(() => {
    const p = new URLSearchParams(window.location.hash.slice(1) || window.location.search.slice(1));
    return p.get("error_description") || (p.get("error") ? "This link has expired or has already been used." : "");
  });
  const [ready, setReady] = useState(false);
  // getSession waits for the link's sign-in to finish, so no session after it
  // means the link didn't sign anyone in.
  const [checked, setChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (data.session) setReady(true);
      setChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (alive && session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) setReady(true);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Use at least 8 characters."); return; }
    if (password !== confirm) { setError("The passwords don't match."); return; }
    setSubmitting(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setSubmitting(false); setError(err.message); return; }
    // An invited login had no password until now (business_users.password_set_at).
    await supabase.rpc("mark_own_password_set").then(() => {}, () => {});
    await supabase.auth.signOut();
    navigate("/business/login", { replace: true, state: { notice: "Your password has been changed. Log in with your new password." } });
  }

  const invalid = linkError || (!ready && !submitting);

  return (
    <div className="business-root min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#F5F7FB" }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-2 mb-6">
          <img src="/logo-mark.svg" alt="Maidenhead" style={{ width: 48, height: 48, objectFit: "contain" }} />
          <h1 className="text-xl font-bold" style={{ color: FOREST }}>Choose a new password</h1>
        </div>

        <div className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={CARD}>
          {invalid ? (
            <>
              <p className="text-sm" style={{ color: FOREST }}>
                {linkError || (checked ? "This link isn't valid any more. Ask for a new one below." : "Checking your link…")}
              </p>
              {(linkError || checked) && (
                <Link to="/business/forgot-password" className="text-sm font-semibold" style={{ color: SAGE }}>Send me a new link</Link>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="New password"><Inp type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoFocus /></Field>
              <Field label="Confirm new password"><Inp type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
              {error && <p className="text-xs font-medium" style={{ color: "#DC2626" }}>{error}</p>}
              <button type="submit" disabled={submitting} className="px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: SAGE }}>
                {submitting ? "Saving…" : "Save new password"}
              </button>
            </form>
          )}
          <Link to="/business/login" className="text-xs font-semibold text-center" style={{ color: MUTED }}>Back to log in</Link>
        </div>
      </div>
    </div>
  );
}
