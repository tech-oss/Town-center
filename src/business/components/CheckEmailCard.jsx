import { useState } from "react";
import { Link } from "react-router-dom";
import { resendConfirmation } from "../api/pendingSignup";

const FOREST = "#1E293B", SAGE = "#2563EB", MUTED = "#64748B";
const CARD = { backgroundColor: "#fff", border: "1px solid rgba(16,24,40,0.08)", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };

// After signing up: the confirmation email is on its way (pendingSignup.js).
// `next` says what happens once the address is confirmed.
export default function CheckEmailCard({ email, next }) {
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  async function resend() {
    setState("sending");
    const res = await resendConfirmation(email);
    if (res.ok) setState("sent");
    else { setError(res.error); setState("error"); }
  }

  return (
    <div className="business-root min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#F5F7FB" }}>
      <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center flex flex-col items-center gap-4" style={CARD}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: "rgba(37,99,235,0.16)", color: "#2563EB" }}>✉</div>
        <h1 className="text-xl font-bold" style={{ color: FOREST }}>Check your email</h1>
        <p className="text-sm" style={{ color: MUTED }}>
          We've sent a link to <strong style={{ color: FOREST }}>{email}</strong>. Click it to confirm your email address.
        </p>
        <p className="text-sm" style={{ color: MUTED }}>{next}</p>
        <p className="text-xs" style={{ color: MUTED }}>
          Nothing there after a few minutes? Check your spam folder, or{" "}
          {state === "sent" ? (
            <span style={{ color: "#15803D", fontWeight: 600 }}>we've sent it again.</span>
          ) : (
            <button type="button" onClick={resend} disabled={state === "sending"} className="font-semibold disabled:opacity-60" style={{ color: SAGE }}>
              {state === "sending" ? "sending…" : "send it again"}
            </button>
          )}
        </p>
        {state === "error" && <p className="text-xs font-medium" style={{ color: "#DC2626" }}>{error}</p>}
        <Link to="/business/login" className="mt-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>
          Go to Login
        </Link>
      </div>
    </div>
  );
}
