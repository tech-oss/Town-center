import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { completePendingSignup } from "../api/completeSignup";
import { resendConfirmation } from "../api/pendingSignup";
import { Field, Inp } from "../components/FormKit";

const FOREST = "#1E293B", SAGE = "#2563EB", MUTED = "#64748B";
const CARD = { backgroundColor: "#fff", border: "1px solid rgba(16,24,40,0.08)", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };

const NEXT = {
  business: (name) => `${name ? `${name} is` : "Your registration is"} now with the Maidenhead team for review. We'll email you as soon as it's approved, and then you can log in.`,
  claim: () => "Your claim is now with the Maidenhead team for review. We'll email you as soon as it's approved, and then you can log in.",
  content_manager: () => "Your request has gone to the business owner. You can log in once they've approved it.",
};

// Where the link in the "Confirm your email address" email lands. The link
// signs the new login in; what they signed up for is made now
// (completeSignup.js), then they're signed out again until it's approved,
// just as a log-in before approval is.
export default function ConfirmedPage() {
  // An expired or used link comes back with the reason in the address.
  const [linkError] = useState(() => {
    const p = new URLSearchParams(window.location.hash.slice(1) || window.location.search.slice(1));
    return p.get("error") ? (p.get("error_code") === "otp_expired" || !p.get("error_description")
      ? "This link has expired or has already been used."
      : p.get("error_description")) : "";
  });
  const [state, setState] = useState(linkError ? "invalid" : "checking"); // checking | done | failed | invalid
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (linkError) return undefined;
    let alive = true;
    // getSession waits for the link's sign-in to finish.
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) { if (alive) setState("invalid"); return; }
      const res = await completePendingSignup(user);
      await supabase.auth.signOut();
      if (!alive) return;
      setResult(res);
      setState(res.ok ? "done" : "failed");
    });
    return () => { alive = false; };
  }, [linkError]);

  return (
    <div className="business-root min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#F5F7FB" }}>
      <div className="max-w-md w-full bg-white rounded-2xl p-8 flex flex-col items-center gap-4 text-center" style={CARD}>
        <img src="/logo-mark.svg" alt="Maidenhead" style={{ width: 48, height: 48, objectFit: "contain" }} />
        {state === "checking" && <p className="text-sm" style={{ color: MUTED }}>Confirming your email…</p>}

        {state === "done" && (
          <>
            <h1 className="text-xl font-bold" style={{ color: FOREST }}>Email confirmed</h1>
            <p className="text-sm" style={{ color: MUTED }}>
              Thank you. {(NEXT[result?.kind] ?? (() => "You can log in now."))(result?.businessName)}
            </p>
            <Link to="/business/login" className="mt-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>
              Go to Login
            </Link>
          </>
        )}

        {state === "failed" && (
          <>
            <h1 className="text-xl font-bold" style={{ color: FOREST }}>Email confirmed</h1>
            <p className="text-sm" style={{ color: "#DC2626" }}>{result?.error}</p>
            <p className="text-sm" style={{ color: MUTED }}>
              Your email address is confirmed, but we couldn't finish your sign-up. Write to{" "}
              <a href="mailto:hello@maidenhead.com" className="font-semibold" style={{ color: SAGE }}>hello@maidenhead.com</a> and we'll sort it out.
            </p>
          </>
        )}

        {state === "invalid" && <ExpiredLink message={linkError} />}
      </div>
    </div>
  );
}

// Used or expired: if they confirmed already, logging in is all that's left;
// otherwise a new link can be sent.
function ExpiredLink({ message }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [error, setError] = useState("");

  async function send(e) {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Enter the email address you signed up with."); return; }
    setStatus("sending");
    const res = await resendConfirmation(email);
    if (!res.ok) { setError(res.error); setStatus("idle"); return; }
    setStatus("sent");
  }

  return (
    <>
      <h1 className="text-xl font-bold" style={{ color: FOREST }}>This link has expired</h1>
      <p className="text-sm" style={{ color: MUTED }}>
        {message || "This link isn't valid any more."} If you've already confirmed your email,{" "}
        <Link to="/business/login" className="font-semibold" style={{ color: SAGE }}>log in</Link>. Otherwise we can send a new link.
      </p>
      {status === "sent" ? (
        <p className="text-sm font-medium" style={{ color: "#15803D" }}>Sent. Check your inbox for the new link.</p>
      ) : (
        <form onSubmit={send} className="w-full flex flex-col gap-3 text-left">
          <Field label="Email address"><Inp type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.co.uk" /></Field>
          {error && <p className="text-xs font-medium" style={{ color: "#DC2626" }}>{error}</p>}
          <button type="submit" disabled={status === "sending"} className="px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: SAGE }}>
            {status === "sending" ? "Sending…" : "Send a new link"}
          </button>
        </form>
      )}
    </>
  );
}
