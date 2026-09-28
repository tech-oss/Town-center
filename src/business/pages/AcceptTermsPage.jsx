import { useState } from "react";
import useBusinessAuth from "../hooks/useBusinessAuth";
import { TERMS_TEXT } from "../../Data/businessPortalMock";

const FOREST = "#1E293B", SAGE = "#2563EB", MUTED = "#64748B", BORDER = "rgba(16,24,40,0.1)";
const CARD = { backgroundColor: "#fff", border: "1px solid rgba(16,24,40,0.08)", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };

// A Content Manager's own reading and acceptance of the Terms of Use and
// Privacy Policy — separate from the business's own terms, which whoever set
// up the plan already accepted. Reached whether they were invited (right
// after SetPasswordPage) or joined by requesting to and were approved by the
// owner — either way, nobody has asked them personally until now.
export default function AcceptTermsPage() {
  const { user, acceptOwnTerms } = useBusinessAuth();
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    const res = await acceptOwnTerms();
    setSubmitting(false);
    if (!res.ok) setError(res.error);
  }

  return (
    <div className="business-root min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#F5F7FB" }}>
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center gap-2 mb-6">
          <img src="/logo-mark.svg" alt="Maidenhead" style={{ width: 48, height: 48, objectFit: "contain" }} />
          <h1 className="text-xl font-bold" style={{ color: FOREST }}>One last thing{user?.firstName ? `, ${user.firstName}` : ""}</h1>
          <p className="text-sm text-center" style={{ color: MUTED }}>
            Before you can use {user?.businessName ?? "the"} dashboard as a Content Manager, please read and accept these.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={CARD}>
          <div className="rounded-xl p-4 max-h-64 overflow-y-auto text-xs leading-relaxed whitespace-pre-line" style={{ border: `1.5px solid ${BORDER}`, color: MUTED, backgroundColor: "#f8fafc" }}>
            {TERMS_TEXT}
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 w-4 h-4" />
            <span className="text-sm" style={{ color: FOREST }}>I have read and agree to the Terms of Use.</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="mt-0.5 w-4 h-4" />
            <span className="text-sm" style={{ color: FOREST }}>I consent to my details being used as described in the Privacy Policy.</span>
          </label>
          <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Your acceptance of these terms is logged with a timestamp and stored in your account for your records.</p>

          {error && <p className="text-xs font-medium" style={{ color: "#DC2626" }}>{error}</p>}

          <button onClick={handleSubmit} disabled={!agreeTerms || !agreePrivacy || submitting}
            className="mt-1 px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>
            {submitting ? "Saving…" : "Agree and Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
