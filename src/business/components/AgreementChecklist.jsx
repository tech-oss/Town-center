import { useState } from "react";
import PdfViewerModal from "./PdfViewerModal";
import { formatAcceptedAt, formatEffective } from "../api/agreements";

const FOREST = "#1E293B", SAGE = "#2563EB", MUTED = "#64748B", BORDER = "rgba(16,24,40,0.1)";

// The legal documents a business must accept — each in its current version
// (api/agreements.js, managed by admin). "View" opens the PDF in a popup to
// read or print; its tick box unlocks once it has been viewed, and ticking it
// records the moment.
//
//   documents: from useLegalDocuments() (null while loading)
//   value:     { opened: { [versionId]: true }, accepted: { [versionId]: ISO time } }
//   onChange(updater) — called with a function of the previous value, so
//   quick clicks in a row never undo each other.
//   updated:   wording for an existing business accepting new versions.
export default function AgreementChecklist({ documents, value, onChange, updated = false, intro }) {
  const [viewing, setViewing] = useState(null);
  const opened = value?.opened ?? {};
  const accepted = value?.accepted ?? {};

  if (documents === null) return <p className="text-sm" style={{ color: MUTED }}>Loading the documents…</p>;
  if (!documents.length) {
    return <p className="text-sm" style={{ color: "#B91C1C" }}>The documents couldn't be loaded. Please refresh the page and try again.</p>;
  }

  function view(doc) {
    onChange((prev) => ({ ...prev, opened: { ...(prev?.opened ?? {}), [doc.versionId]: true } }));
    setViewing({ ...doc, effectiveDate: formatEffective(doc.effectiveDate) });
  }
  function toggle(id, on) {
    const at = new Date().toISOString();
    onChange((prev) => {
      const next = { ...(prev?.accepted ?? {}) };
      if (on) next[id] = at; else delete next[id];
      return { ...prev, accepted: next };
    });
  }

  const done = documents.filter((d) => accepted[d.versionId]).length;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: MUTED }}>
        {intro ?? `Please view and read each document, then tick to agree to it. ${documents.length === 1 ? "It is" : `All ${documents.length} are`} required to continue.`}
      </p>
      {documents.map((d) => {
        const isOpened = !!opened[d.versionId];
        const at = accepted[d.versionId];
        return (
          <div key={d.versionId} className="rounded-xl p-4 flex flex-col gap-3"
            style={{ border: `1.5px solid ${at ? "rgba(22,163,74,0.35)" : BORDER}`, backgroundColor: at ? "rgba(22,163,74,0.05)" : "#fff" }}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: FOREST }}>{d.name}</p>
                <p className="text-[11px]" style={{ color: MUTED }}>
                  Version {d.version}{d.effectiveDate ? ` · Effective ${formatEffective(d.effectiveDate)}` : ""}
                  {d.previousVersion ? ` · You previously agreed to version ${d.previousVersion}` : ""}
                </p>
              </div>
              <button type="button" onClick={() => view(d)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ backgroundColor: "rgba(37,99,235,0.08)", color: SAGE, border: "1.5px solid rgba(37,99,235,0.25)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></svg>
                {isOpened ? "View again" : "View"}
              </button>
            </div>
            <label className={`flex items-start gap-3 ${isOpened ? "cursor-pointer" : "cursor-not-allowed"}`}>
              <input type="checkbox" checked={!!at} disabled={!isOpened} onChange={(e) => toggle(d.versionId, e.target.checked)} className="mt-0.5 w-4 h-4" />
              <span className="text-sm" style={{ color: isOpened ? FOREST : "#9CA3AF" }}>
                I have read and agree to the {updated ? "updated " : ""}{d.name}.
                {!isOpened && <span className="block text-[11px] mt-0.5">View the document first to agree.</span>}
                {at && <span className="block text-[11px] mt-0.5 font-semibold" style={{ color: "#15803D" }}>✓ Agreed {formatAcceptedAt(at)}</span>}
              </span>
            </label>
          </div>
        );
      })}
      <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
        {done} of {documents.length} agreed. Each agreement is recorded with the document version and the date and time, and kept in your account under Subscriptions &amp; Accepted Terms.
      </p>
      <PdfViewerModal doc={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
