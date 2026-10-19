import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getLegalDocuments, createLegalDocument, addLegalDocumentVersion, setCurrentLegalVersion,
  getVersionAcceptance, formatEffective, formatAcceptedAt,
} from "../../api/admin/legalDocuments";
import UKDateInput from "../components/UKDateInput";
import { BLUE, BORDER, CARD, FIELD_STYLE, MUTED, NAVY } from "../theme";

// Admin → Legal Documents. The documents a business accepts at signup and
// again whenever a new version is published (Business Terms & Conditions,
// Business Data Responsibility Agreement, Cancellation & Refund Policy, and
// any added here later). Every version is kept: uploading a PDF adds a
// version, it never replaces one. Making a version current asks every
// business that hasn't accepted it to do so before using its dashboard.

const BTN = "px-3.5 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-85 disabled:opacity-40";
const outline = { border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" };
const primary = { backgroundColor: BLUE, color: "#fff" };

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg"
      style={{ backgroundColor: toast.error ? "#991B1B" : "#15803D", color: "#fff" }}>
      {toast.error ? "✕" : "✓"} {toast.msg}
    </div>
  );
}

function Label({ children, hint }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold" style={{ color: MUTED }}>{children}</span>
      {hint && <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{hint}</span>}
    </span>
  );
}

// Upload a PDF as a new version of a document.
function NewVersionForm({ doc, onDone, onCancel, notify }) {
  const [version, setVersion] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [file, setFile] = useState(null);
  const [makeCurrent, setMakeCurrent] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const taken = doc.versions.some((v) => v.version.trim().toLowerCase() === version.trim().toLowerCase());

  async function save() {
    setError("");
    if (taken) { setError(`Version ${version.trim()} already exists — use a new version number.`); return; }
    if (makeCurrent && !confirm(`Make version ${version.trim()} the current ${doc.name}?\n\nEvery business that hasn't accepted it will be asked to before it can use its dashboard.`)) return;
    setSaving(true);
    try {
      await addLegalDocumentVersion({ documentKey: doc.key, version, effectiveDate, file, makeCurrent });
      notify(`${doc.name} version ${version.trim()} added${makeCurrent ? " and made current" : ""}.`);
      onDone();
    } catch (e) {
      setError(e.message ?? "Could not upload the version.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl p-4 flex flex-col gap-4" style={{ backgroundColor: "#f8fafc", border: `1.5px solid ${BORDER}` }}>
      <p className="text-sm font-bold" style={{ color: NAVY }}>New version of {doc.name}</p>
      <div className="grid sm:grid-cols-3 gap-4">
        <label className="flex flex-col gap-1.5">
          <Label hint={doc.current ? `Current: ${doc.current.version}` : "e.g. 1.0"}>Version number</Label>
          <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.1" maxLength={20}
            className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} />
        </label>
        <label className="flex flex-col gap-1.5">
          <Label hint="The date it takes effect">Effective date</Label>
          <UKDateInput value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <Label hint="PDF, up to 20 MB">Document (PDF)</Label>
          <input type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-xs file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold"
            style={{ color: NAVY }} />
        </label>
      </div>
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" checked={makeCurrent} onChange={(e) => setMakeCurrent(e.target.checked)} className="mt-0.5 w-4 h-4" />
        <span className="text-sm" style={{ color: NAVY }}>
          Make this the current version
          <span className="block text-[11px]" style={{ color: MUTED }}>
            New businesses accept it at signup, and every existing business is asked to accept it before using its dashboard.
            Leave unticked to upload it now and make it current later.
          </span>
        </span>
      </label>
      {error && <p className="text-xs font-medium" style={{ color: "#DC2626" }}>{error}</p>}
      <div className="flex gap-2">
        <button type="button" className={BTN} style={primary} disabled={saving || !version.trim() || !effectiveDate || !file} onClick={save}>
          {saving ? "Uploading…" : "Upload version"}
        </button>
        <button type="button" className={BTN} style={outline} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// Which businesses have accepted a version, and which are still to.
function AcceptanceReport({ version }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    let alive = true;
    getVersionAcceptance(version.id).then((r) => { if (alive) setRows(r); }).catch(() => { if (alive) setRows([]); });
    return () => { alive = false; };
  }, [version.id]);
  if (rows === null) return <p className="text-xs" style={{ color: MUTED }}>Loading…</p>;
  const pending = rows.filter((r) => !r.acceptedAt);
  const accepted = rows.filter((r) => r.acceptedAt);
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="rounded-xl p-4" style={{ border: `1.5px solid ${BORDER}` }}>
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#15803D" }}>Accepted · {accepted.length}</p>
        {accepted.length === 0 && <p className="text-xs" style={{ color: MUTED }}>No business has accepted this version yet.</p>}
        <div className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
          {accepted.map((r) => (
            <div key={r.businessId} className="py-2">
              <p className="text-sm font-semibold" style={{ color: NAVY }}>{r.businessName}</p>
              <p className="text-[11px]" style={{ color: MUTED }}>{formatAcceptedAt(r.acceptedAt)}{r.acceptedBy ? ` · ${r.acceptedBy}` : ""}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl p-4" style={{ border: "1.5px solid rgba(217,119,6,0.35)", backgroundColor: "rgba(217,119,6,0.04)" }}>
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#B45309" }}>Updated Terms Require Acceptance · {pending.length}</p>
        {pending.length === 0 && <p className="text-xs" style={{ color: MUTED }}>Every business has accepted it.</p>}
        <div className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
          {pending.map((r) => (
            <div key={r.businessId} className="py-2">
              <p className="text-sm font-semibold" style={{ color: NAVY }}>{r.businessName}</p>
              <p className="text-[11px]" style={{ color: MUTED }}>
                {r.previousVersion ? `Accepted version ${r.previousVersion}` : "Has not accepted any version"}{r.ownerEmail ? ` · ${r.ownerEmail}` : ""}
              </p>
            </div>
          ))}
        </div>
        <p className="text-[10px] mt-2" style={{ color: "#9CA3AF" }}>They are asked to accept it the next time they open their dashboard.</p>
      </div>
    </div>
  );
}

function DocumentCard({ doc, reload, notify }) {
  const [adding, setAdding] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [busy, setBusy] = useState(null);
  const older = doc.versions.filter((v) => !v.isCurrent);

  async function makeCurrent(v) {
    if (!confirm(`Make version ${v.version} the current ${doc.name}?\n\nEvery business that hasn't accepted version ${v.version} will be asked to before it can use its dashboard.`)) return;
    setBusy(v.id);
    try {
      await setCurrentLegalVersion(v.id);
      notify(`Version ${v.version} is now the current ${doc.name}.`);
      reload();
    } catch (e) {
      notify(e.message ?? "Could not change the current version.", true);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={CARD}>
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold" style={{ color: NAVY }}>{doc.name}</h2>
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={doc.requiresAcceptance ? { backgroundColor: "rgba(37,99,235,0.1)", color: BLUE } : { backgroundColor: "rgba(100,116,139,0.12)", color: MUTED }}>
              {doc.requiresAcceptance ? "Must be accepted" : "For information"}
            </span>
          </div>
          {doc.current ? (
            <p className="text-sm mt-1" style={{ color: NAVY }}>
              <strong>Current: Version {doc.current.version}</strong>
              <span style={{ color: MUTED }}> · Effective {formatEffective(doc.current.effectiveDate)} · Accepted by {doc.current.acceptances} business{doc.current.acceptances === 1 ? "" : "es"}</span>
            </p>
          ) : (
            <p className="text-sm mt-1 font-semibold" style={{ color: "#B45309" }}>No current version — upload one so businesses can accept it.</p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {doc.current && <a href={doc.current.fileUrl} target="_blank" rel="noopener noreferrer" data-skip-external-confirm className={BTN} style={outline}>View PDF</a>}
          {doc.current && doc.requiresAcceptance && (
            <button type="button" className={BTN} style={outline} onClick={() => setShowReport((s) => !s)}>
              {showReport ? "Hide acceptances" : "Who has accepted"}
            </button>
          )}
          <button type="button" className={BTN} style={primary} onClick={() => setAdding(true)} disabled={adding}>Upload new version</button>
        </div>
      </div>

      {adding && <NewVersionForm doc={doc} notify={notify} onCancel={() => setAdding(false)} onDone={() => { setAdding(false); reload(); }} />}
      {showReport && doc.current && <AcceptanceReport version={doc.current} />}

      {older.length > 0 && (
        <div>
          <button type="button" onClick={() => setShowHistory((s) => !s)} className="text-xs font-semibold" style={{ color: BLUE }}>
            {showHistory ? "Hide" : "View"} previous versions ({older.length})
          </button>
          {showHistory && (
            <table className="w-full text-sm mt-2">
              <thead>
                <tr style={{ backgroundColor: "rgba(16,24,40,0.04)" }}>
                  {["Version", "Effective", "Uploaded", "Accepted by", ""].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {older.map((v) => (
                  <tr key={v.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: NAVY }}>{v.version}</td>
                    <td className="px-3 py-2.5" style={{ color: NAVY }}>{formatEffective(v.effectiveDate)}</td>
                    <td className="px-3 py-2.5" style={{ color: MUTED }}>{formatAcceptedAt(v.createdAt)}</td>
                    <td className="px-3 py-2.5" style={{ color: MUTED }}>{v.acceptances} business{v.acceptances === 1 ? "" : "es"}</td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <a href={v.fileUrl} target="_blank" rel="noopener noreferrer" data-skip-external-confirm className="text-xs font-semibold mr-4" style={{ color: BLUE }}>View PDF</a>
                      <button type="button" disabled={busy === v.id} onClick={() => makeCurrent(v)} className="text-xs font-semibold" style={{ color: NAVY }}>
                        {busy === v.id ? "Saving…" : "Make current"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function NewDocumentForm({ onDone, onCancel, notify }) {
  const [name, setName] = useState("");
  const [requiresAcceptance, setRequiresAcceptance] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    setError("");
    setSaving(true);
    try {
      await createLegalDocument({ name, requiresAcceptance });
      notify(`${name.trim()} added — upload its first version below.`);
      onDone();
    } catch (e) {
      setError(e.message ?? "Could not add the document.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={CARD}>
      <p className="text-sm font-bold" style={{ color: NAVY }}>Add a legal document</p>
      <label className="flex flex-col gap-1.5 max-w-md">
        <Label>Document name</Label>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="e.g. Advertising Standards Policy"
          className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} />
      </label>
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" checked={requiresAcceptance} onChange={(e) => setRequiresAcceptance(e.target.checked)} className="mt-0.5 w-4 h-4" />
        <span className="text-sm" style={{ color: NAVY }}>
          Businesses must accept it
          <span className="block text-[11px]" style={{ color: MUTED }}>At signup, and before using their dashboard once a version is current.</span>
        </span>
      </label>
      {error && <p className="text-xs font-medium" style={{ color: "#DC2626" }}>{error}</p>}
      <div className="flex gap-2">
        <button type="button" className={BTN} style={primary} disabled={saving || !name.trim()} onClick={save}>{saving ? "Adding…" : "Add document"}</button>
        <button type="button" className={BTN} style={outline} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default function LegalDocumentsPage() {
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    getLegalDocuments()
      .then((d) => { if (alive) { setDocs(d); setError(""); } })
      .catch((e) => { if (alive) setError(e.message ?? "Could not load the documents."); });
    return () => { alive = false; };
  }, [version]);

  const reload = () => setVersion((v) => v + 1);
  function notify(msg, isError = false) {
    setToast({ msg, error: isError });
    setTimeout(() => setToast(null), 4500);
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <Toast toast={toast} />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Legal Documents</h1>
          <p className="text-sm mt-1 max-w-2xl" style={{ color: MUTED }}>
            The documents businesses accept when they sign up. Upload a new PDF as a new version — earlier versions and who
            accepted them are always kept. When a new version is made current, existing businesses must accept it before
            they can use their dashboard.
          </p>
        </div>
        <button type="button" className={BTN} style={primary} onClick={() => setAdding(true)} disabled={adding}>+ Add a document</button>
      </div>

      {adding && <NewDocumentForm notify={notify} onCancel={() => setAdding(false)} onDone={() => { setAdding(false); reload(); }} />}

      {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}
      {!docs && !error && <p className="text-sm" style={{ color: MUTED }}>Loading…</p>}
      {docs?.map((d) => <DocumentCard key={d.key} doc={d} reload={reload} notify={notify} />)}

      <div className="rounded-2xl p-5 text-sm" style={{ border: `1.5px dashed ${BORDER}`, color: MUTED }}>
        <strong style={{ color: NAVY }}>Privacy Policy</strong> — shown at signup for reading, with nothing to tick. It is the same text as the
        website's Privacy Policy page; edit it in{" "}
        <Link to="/admin/site-content" className="font-semibold" style={{ color: BLUE }}>Site Content → Privacy Policy</Link>.
      </div>
    </div>
  );
}
