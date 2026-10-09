import { AGREEMENTS, formatAcceptedAt } from "../../Data/agreements";

const FOREST = "#1E293B", SAGE = "#2563EB", MUTED = "#64748B", BORDER = "rgba(16,24,40,0.1)";

// The four agreements a business must read and accept before it gets an
// account (registration and claiming). Each opens as a PDF; its tick box
// unlocks once it has been opened, and ticking it records the moment.
//
//   value:  { opened: { [key]: true }, accepted: { [key]: ISO timestamp } }
//   onChange(updater) — called with a function of the previous value, so
//   quick clicks in a row never undo each other.
export default function AgreementChecklist({ value, onChange }) {
  const opened = value?.opened ?? {};
  const accepted = value?.accepted ?? {};

  function open(key) {
    onChange((prev) => ({ ...prev, opened: { ...(prev?.opened ?? {}), [key]: true } }));
  }
  function toggle(key, on) {
    const at = new Date().toISOString();
    onChange((prev) => {
      const next = { ...(prev?.accepted ?? {}) };
      if (on) next[key] = at; else delete next[key];
      return { ...prev, accepted: next };
    });
  }

  const done = AGREEMENTS.filter((a) => accepted[a.key]).length;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: MUTED }}>
        Please open and read each agreement, then tick to accept it. All four are needed before your account can be created.
      </p>
      {AGREEMENTS.map((a, i) => {
        const isOpened = !!opened[a.key];
        const at = accepted[a.key];
        return (
          <div key={a.key} className="rounded-xl p-4 flex flex-col gap-3"
            style={{ border: `1.5px solid ${at ? "rgba(22,163,74,0.35)" : BORDER}`, backgroundColor: at ? "rgba(22,163,74,0.05)" : "#fff" }}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Agreement {i + 1} of {AGREEMENTS.length}</p>
                <p className="text-sm font-semibold" style={{ color: FOREST }}>{a.title}</p>
                <p className="text-[11px]" style={{ color: MUTED }}>Version {a.version} · PDF</p>
              </div>
              <a href={a.file} target="_blank" rel="noopener noreferrer" onClick={() => open(a.key)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ backgroundColor: "rgba(37,99,235,0.08)", color: SAGE, border: "1.5px solid rgba(37,99,235,0.25)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></svg>
                {isOpened ? "Open again" : "Open PDF"}
              </a>
            </div>
            <label className={`flex items-start gap-3 ${isOpened ? "cursor-pointer" : "cursor-not-allowed"}`}>
              <input type="checkbox" checked={!!at} disabled={!isOpened} onChange={(e) => toggle(a.key, e.target.checked)} className="mt-0.5 w-4 h-4" />
              <span className="text-sm" style={{ color: isOpened ? FOREST : "#9CA3AF" }}>
                I have read and agree to the {a.title}.
                {!isOpened && <span className="block text-[11px] mt-0.5">Open the PDF first to accept.</span>}
                {at && <span className="block text-[11px] mt-0.5 font-semibold" style={{ color: "#15803D" }}>✓ Agreed {formatAcceptedAt(at)}</span>}
              </span>
            </label>
          </div>
        );
      })}
      <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
        {done} of {AGREEMENTS.length} accepted. Each acceptance is recorded with its date and time and kept in your account, under Subscriptions &amp; Accepted Terms.
      </p>
    </div>
  );
}
