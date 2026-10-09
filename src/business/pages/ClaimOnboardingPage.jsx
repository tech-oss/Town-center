import AgreementChecklist from "../components/AgreementChecklist";
import { AGREEMENTS, allAgreed, formatAcceptedAt } from "../../Data/agreements";
import { recordAgreements, listAgreements } from "../api/agreements";
import { useEffect, useState } from "react";
import useBusinessAuth from "../hooks/useBusinessAuth";
import ProfileBenefits from "../components/ProfileBenefits";
import { completeClaimOnboarding } from "../api/claimOnboarding";

const FOREST = "#1E293B", SAGE = "#2563EB", MUTED = "#64748B", BORDER = "rgba(16,24,40,0.14)";
const CARD = { backgroundColor: "#fff", border: "1px solid rgba(16,24,40,0.08)", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };

// Registration's last three steps, and only those. Someone claiming a business
// already gave us their details when they submitted the claim, and the
// business details were entered by admin when the listing was created — so
// steps 1 and 2 have nothing left to ask. What a claim never collected is a
// terms acceptance, which is what's left here alongside the profile
// introduction. Subscribing happens later, from the dashboard.
const STEPS = ["Your Profile", "Agreements", "Review"];

function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2 flex-1">
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={i <= step ? { backgroundColor: SAGE, color: "#fff" } : { backgroundColor: "rgba(16,24,40,0.08)", color: MUTED }}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className="text-[10px] font-semibold text-center" style={{ color: i <= step ? FOREST : MUTED }}>{s}</span>
          </div>
          {i < STEPS.length - 1 && <div className="h-px flex-1 -mt-5" style={{ backgroundColor: i < step ? SAGE : BORDER }} />}
        </div>
      ))}
    </div>
  );
}

function SummaryRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span style={{ color: MUTED }}>{label}</span>
      <span className="text-right font-medium" style={{ color: FOREST }}>{value}</span>
    </div>
  );
}

function SummarySection({ title, onEdit, children }) {
  return (
    <div className="rounded-xl p-4" style={{ border: `1.5px solid ${BORDER}` }}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-bold" style={{ color: FOREST }}>{title}</p>
        {onEdit && <button type="button" onClick={onEdit} className="text-xs font-semibold" style={{ color: "#2563EB" }}>Edit</button>}
      </div>
      <div className="divide-y" style={{ borderColor: BORDER }}>{children}</div>
    </div>
  );
}

export default function ClaimOnboardingPage() {
  const { user, refresh } = useBusinessAuth();
  const [step, setStep] = useState(0);
  // Everyone starts on the free listing; plans are chosen from the dashboard.
  const FREE_PLAN = "free";
  // The four agreements. Someone who claimed since they were introduced
  // accepted them on the claim form; this shows those. Anyone who claimed
  // before accepts them here.
  const [agreements, setAgreements] = useState({ opened: {}, accepted: {} });
  const [recorded, setRecorded] = useState(null); // null = loading
  useEffect(() => {
    let alive = true;
    listAgreements(user.id).then((rows) => { if (alive) setRecorded(rows); });
    return () => { alive = false; };
  }, [user.id]);
  const alreadyAgreed = !!recorded && recorded.every((a) => a.acceptance);
  const [confirmFinal, setConfirmFinal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function validStep() {
    if (step === 0) return true;
    if (step === 1) return alreadyAgreed || allAgreed(agreements.accepted);
    return confirmFinal;
  }

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    if (!alreadyAgreed) await recordAgreements(user.id, user.email, "onboarding", agreements.accepted);
    const res = await completeClaimOnboarding(user.id, FREE_PLAN);
    if (!res.ok) {
      setSubmitting(false);
      setError(res.error);
      return;
    }
    // Re-reads the session so onboardingCompletedAt is set — that's what the
    // route guard checks, so this is what lets them through to the dashboard.
    await refresh();
  }

  return (
    <div className="business-root min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#F5F7FB" }}>
      <div className="max-w-2xl w-full">
        <div className="flex flex-col items-center gap-2 mb-6 text-center">
          <img src="/logo-mark.svg" alt="Maidenhead" style={{ width: 48, height: 48, objectFit: "contain" }} />
          <h1 className="text-xl font-bold" style={{ color: FOREST }}>Finish setting up {user.businessName}</h1>
          <p className="text-sm" style={{ color: MUTED }}>
            Your claim has been approved. Accept the terms to finish — this only happens once.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8" style={CARD}>
          <StepIndicator step={step} />

          {step === 0 && <ProfileBenefits />}

          {step === 1 && (
            recorded === null ? (
              <p className="text-sm" style={{ color: MUTED }}>Loading your agreements…</p>
            ) : alreadyAgreed ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm" style={{ color: MUTED }}>You accepted these when you claimed the business. You can read them again any time.</p>
                {recorded.map((a) => (
                  <div key={a.key} className="rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap" style={{ border: "1.5px solid rgba(22,163,74,0.35)", backgroundColor: "rgba(22,163,74,0.05)" }}>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: FOREST }}>{a.title}</p>
                      <p className="text-[11px] font-semibold" style={{ color: "#15803D" }}>✓ Agreed {formatAcceptedAt(a.acceptance.accepted_at)} · version {a.acceptance.version}</p>
                    </div>
                    <a href={a.file} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold" style={{ color: "#2563EB" }}>Open PDF</a>
                  </div>
                ))}
              </div>
            ) : (
              <AgreementChecklist value={agreements} onChange={setAgreements} />
            )
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <p className="text-base font-bold" style={{ color: FOREST }}>Review your details</p>

              <SummarySection title="Your Details">
                <SummaryRow label="Name" value={`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()} />
                <SummaryRow label="Email" value={user.email} />
                <SummaryRow label="Phone" value={user.phone} />
              </SummarySection>

              <SummarySection title="Business">
                <SummaryRow label="Business Name" value={user.businessName} />
              </SummarySection>

              <SummarySection title="Agreements" onEdit={() => setStep(1)}>
                {AGREEMENTS.map((a) => {
                  const at = alreadyAgreed ? recorded.find((r) => r.key === a.key)?.acceptance?.accepted_at : agreements.accepted[a.key];
                  return <SummaryRow key={a.key} label={a.title} value={at ? `Agreed ${formatAcceptedAt(at)}` : "Not agreed"} />;
                })}
              </SummarySection>

              <label className="flex items-start gap-3 cursor-pointer rounded-xl p-3 mt-2" style={{ border: "1.5px solid rgba(217,119,6,0.3)", backgroundColor: "rgba(217,119,6,0.08)" }}>
                <input type="checkbox" checked={confirmFinal} onChange={(e) => setConfirmFinal(e.target.checked)} className="mt-0.5 w-4 h-4" />
                <span className="text-sm" style={{ color: FOREST }}>I confirm the information above is accurate.</span>
              </label>
            </div>
          )}

          {error && <p className="text-xs font-medium mt-4" style={{ color: "#DC2626" }}>{error}</p>}

          <div className="flex gap-3 pt-6 mt-6" style={{ borderTop: `1px solid ${BORDER}` }}>
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>
                Back
              </button>
            )}
            {step < 2 ? (
              <button onClick={() => setStep((s) => s + 1)} disabled={!validStep()}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>
                Continue
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={!validStep() || submitting}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>
                {submitting ? "Finishing…" : "Finish & Go to Dashboard"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
