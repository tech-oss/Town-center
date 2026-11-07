import { useEffect, useState } from "react";
import useBusinessAuth, { logout, refresh } from "../hooks/useBusinessAuth";
import AgreementChecklist from "../components/AgreementChecklist";
import PrivacyPolicyBox from "../components/PrivacyPolicyBox";
import { allAgreed, getMyOutstandingDocuments, recordMyAgreements } from "../api/agreements";

const FOREST = "#1E293B", SAGE = "#2563EB", MUTED = "#64748B";
const CARD = { backgroundColor: "#fff", border: "1px solid rgba(16,24,40,0.08)", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };

// A Content Manager's first sign-in: they read and accept every current legal
// document for themselves (the same documents an owner accepts at sign-up,
// managed by admin in Legal Documents), and read the Privacy Policy. This used
// to show a fixed placeholder paragraph instead, and the real documents were
// only ever asked of the business, which the owner had already accepted.
export default function AcceptTermsPage() {
  const { user, acceptOwnTerms } = useBusinessAuth();
  const [documents, setDocuments] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [agreements, setAgreements] = useState({ opened: {}, accepted: {} });
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    getMyOutstandingDocuments(user.id)
      .then((docs) => { if (alive) setDocuments(docs); })
      .catch(() => { if (alive) setLoadError(true); });
    return () => { alive = false; };
  }, [user?.id]);

  // Nothing published to accept: the Privacy Policy is all there is.
  const noDocuments = documents !== null && documents.length === 0;
  const ready = agreePrivacy && (noDocuments || allAgreed(documents, agreements.accepted));

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    if (noDocuments) {
      const res = await acceptOwnTerms();
      setSubmitting(false);
      if (!res.ok) setError(res.error);
      return;
    }
    const res = await recordMyAgreements(user.id, user.email, agreements.accepted);
    if (!res.ok) {
      setSubmitting(false);
      setError(/current one/i.test(res.error ?? "")
        ? "One of these documents has just been updated. Please refresh the page to see the latest version."
        : "Your agreement couldn't be saved. Please try again.");
      return;
    }
    if (res.remaining > 0) {
      // A document was added or updated while this page was open.
      setSubmitting(false);
      setDocuments(await getMyOutstandingDocuments(user.id).catch(() => []));
      setAgreements({ opened: {}, accepted: {} });
      setError("A document was just updated. Please review it and accept again.");
      return;
    }
    await refresh();
    setSubmitting(false);
  }

  return (
    <div className="business-root min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#F5F7FB" }}>
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center gap-2 mb-6 text-center">
          <img src="/logo-mark.svg" alt="Maidenhead" style={{ width: 48, height: 48, objectFit: "contain" }} />
          <h1 className="text-xl font-bold" style={{ color: FOREST }}>One last thing{user?.firstName ? `, ${user.firstName}` : ""}</h1>
          <p className="text-sm max-w-lg" style={{ color: MUTED }}>
            Before you can use {user?.businessName ?? "the"} dashboard as a Content Manager, please read and accept our policies.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 flex flex-col gap-5" style={CARD}>
          {loadError ? (
            <p className="text-sm" style={{ color: "#B91C1C" }}>The documents couldn't be loaded. Please refresh the page and try again.</p>
          ) : !noDocuments && (
            <AgreementChecklist documents={documents} value={agreements} onChange={setAgreements}
              intro={documents?.length > 1 ? "View each document, then tick to confirm you agree." : "View the document, then tick to confirm you agree."} />
          )}

          <PrivacyPolicyBox />
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="mt-0.5 w-4 h-4" />
            <span className="text-sm" style={{ color: FOREST }}>I have read the Privacy Policy and consent to my details being used as it describes.</span>
          </label>
          <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Your acceptance of each document is logged with a timestamp and stored in your account for your records.</p>

          {error && <p className="text-xs font-medium" style={{ color: "#DC2626" }}>{error}</p>}

          <button onClick={handleSubmit} disabled={!ready || submitting || loadError}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>
            {submitting ? "Saving…" : "Agree and Continue"}
          </button>
          <button type="button" onClick={() => logout()} className="text-xs self-center" style={{ color: MUTED }}>Log out</button>
        </div>
      </div>
    </div>
  );
}
