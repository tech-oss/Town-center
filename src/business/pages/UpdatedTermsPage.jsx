import { useState } from "react";
import useBusinessAuth, { logout } from "../hooks/useBusinessAuth";
import AgreementChecklist from "../components/AgreementChecklist";
import { allAgreed, recordAgreements } from "../api/agreements";
import { refreshOutstandingDocuments } from "../hooks/useOutstandingDocuments";

const FOREST = "#1E293B", SAGE = "#2563EB", MUTED = "#64748B";
const CARD = { backgroundColor: "#fff", border: "1px solid rgba(16,24,40,0.08)", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };

const listNames = (names) => (names.length <= 1 ? names[0] ?? "" : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`);

// Shown instead of the dashboard while the business has a current legal
// document it hasn't accepted — a new version admin published, or one it
// never accepted. Nothing else in the dashboard opens until every one is
// accepted. The owner accepts on the business's behalf; a Content Manager is
// told to ask them.
//   documents: from useOutstandingDocuments()
export default function UpdatedTermsPage({ documents }) {
  const { user } = useBusinessAuth();
  const [agreements, setAgreements] = useState({ opened: {}, accepted: {} });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isOwner = user?.role === "Owner";
  const anyUpdate = documents.some((d) => d.previousVersion);
  const names = documents.map((d) => d.name);

  async function handleContinue() {
    setError("");
    setSaving(true);
    const res = await recordAgreements(user.id, user.email, "update", agreements.accepted);
    if (!res.ok) {
      setSaving(false);
      setError(/current one/i.test(res.error ?? "")
        ? "One of these documents has just been updated again. Please refresh the page to see the latest version."
        : "Your agreement couldn't be saved. Please try again.");
      return;
    }
    refreshOutstandingDocuments();
  }

  return (
    <div className="business-root min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#F5F7FB" }}>
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center gap-2 mb-6 text-center">
          <img src="/logo-mark.svg" alt="Maidenhead" style={{ width: 48, height: 48, objectFit: "contain" }} />
          <h1 className="text-xl font-bold" style={{ color: FOREST }}>
            {anyUpdate ? "Our Terms Have Been Updated" : "Please Review Our Terms"}
          </h1>
          <p className="text-sm max-w-lg" style={{ color: MUTED }}>
            {anyUpdate
              ? `We have updated our ${listNames(names)}. Please review the new version${documents.length > 1 ? "s" : ""} and confirm that you agree before continuing.`
              : `Before you continue to the dashboard, please review the following terms that we have updated: ${listNames(names)}.`}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 flex flex-col gap-5" style={CARD}>
          {isOwner ? (
            <>
              <AgreementChecklist documents={documents} value={agreements} onChange={setAgreements} updated={anyUpdate}
                intro={documents.length > 1 ? "View each document, then tick to confirm you agree." : "View the document, then tick to confirm you agree."} />
              {error && <p className="text-xs font-medium" style={{ color: "#DC2626" }}>{error}</p>}
              <button type="button" onClick={handleContinue} disabled={!allAgreed(documents, agreements.accepted) || saving}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>
                {saving ? "Saving…" : "Continue to Dashboard"}
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm" style={{ color: FOREST }}>
                {user?.businessName ?? "Your business"}'s owner needs to review and agree to {documents.length > 1 ? "these documents" : "this document"} before the dashboard can be used:
              </p>
              <ul className="list-disc pl-5 text-sm" style={{ color: FOREST }}>
                {documents.map((d) => <li key={d.versionId}>{d.name} — Version {d.version}</li>)}
              </ul>
              <p className="text-sm" style={{ color: MUTED }}>Please ask them to sign in and accept. You can come back once they have.</p>
            </div>
          )}
          <button type="button" onClick={() => logout()} className="text-xs self-center" style={{ color: MUTED }}>Log out</button>
        </div>
      </div>
    </div>
  );
}
