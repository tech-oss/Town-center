import { useEffect, useState } from "react";
import { getBusinessReviews, addBusinessReview, updateBusinessReview, deleteReview } from "../../../api/admin";
import { formatUK } from "../../../lib/ukDate";
import UKDateInput from "../../components/UKDateInput";
import { Field, Inp, TextArea, EditorSection, Locked, NAVY, MUTED, BORDER, BLUE, CARD, INPUT } from "./shared";

// Reviews on a business's page — the same list the business manages on its
// own Reviews tab (business portal → My Listing → Reviews). Each review saves
// on its own, so this sits outside the content form and its Save button.
// Admin's additions and edits are live at once; the business's own still
// go through Review Moderation.

// Only the 6 most recent live reviews show on the public page
// (MAX_PUBLIC_REVIEWS in src/api/liveBusinesses.js).
const MAX_LIVE_REVIEWS = 6;

const STATUS = {
  "Pending Approval": { label: "Awaiting approval", bg: "rgba(217,119,6,0.14)", fg: "#92400E" },
  Visible: { label: "Live", bg: "rgba(22,163,74,0.14)", fg: "#15803D" },
  VisibleQueued: { label: "Approved — not shown yet", bg: "rgba(37,99,235,0.1)", fg: "#1D4ED8" },
  Rejected: { label: "Not approved", bg: "rgba(185,28,28,0.1)", fg: "#991B1B" },
  Hidden: { label: "Hidden by admin", bg: "rgba(107,114,128,0.13)", fg: "#374151" },
};

function Stars({ rating }) {
  return (
    <span className="text-sm tracking-tight" style={{ color: "#D97706" }} aria-label={`${rating} out of 5`}>
      {"★".repeat(rating)}<span style={{ color: "#E5E7EB" }}>{"★".repeat(Math.max(0, 5 - rating))}</span>
    </span>
  );
}

function isWebUrl(value) {
  try {
    const u = new URL(String(value ?? "").trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function ReviewForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? { reviewer: "", rating: 5, date: today(), text: "", verificationLink: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.reviewer.trim() || !form.text.trim()) { setError("Add the reviewer's name and what they said."); return; }
    if (!isWebUrl(form.verificationLink)) { setError("Add a verification link starting https:// (e.g. the Google or Trustpilot review)."); return; }
    setSaving(true);
    setError("");
    try {
      await onSave(form);
    } catch (e) {
      setError(e?.message ?? "Could not save the review.");
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: "rgba(37,99,235,0.05)", border: "1.5px solid rgba(37,99,235,0.2)" }}>
      <p className="text-sm font-bold" style={{ color: NAVY }}>{initial ? "Edit Review" : "Add Review"}</p>
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Reviewer Name"><Inp value={form.reviewer} onChange={(e) => set("reviewer", e.target.value)} placeholder="e.g. Hannah B." /></Field>
        <Field label="Rating">
          <select value={form.rating} onChange={(e) => set("rating", Number(e.target.value))}
            className="rounded-xl px-3 py-2.5 text-sm outline-none w-full" style={{ ...INPUT, backgroundColor: "#fff" }}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n === 1 ? "" : "s"}</option>)}
          </select>
        </Field>
        <Field label="Date"><UKDateInput value={form.date ?? ""} onChange={(e) => set("date", e.target.value)} /></Field>
      </div>
      <Field label="Review Text"><TextArea rows={3} value={form.text} onChange={(e) => set("text", e.target.value)} placeholder="What did the customer say?" /></Field>
      <Field label="Verification Link" required hint="A link proving the review is genuine, e.g. the Google or Trustpilot review">
        <Inp value={form.verificationLink ?? ""} onChange={(e) => set("verificationLink", e.target.value)} placeholder="https://…" />
      </Field>
      {error && <p className="text-xs font-semibold" style={{ color: "#991B1B" }}>{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={saving}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: BLUE }}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onCancel} disabled={saving}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ color: MUTED, border: `1.5px solid ${BORDER}` }}>Cancel</button>
      </div>
    </div>
  );
}

export default function ReviewsEditor({ businessId, hint }) {
  const [reviews, setReviews] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState("");

  // Each business gets a fresh editor (keyed by its id), so there's no
  // earlier list to clear here.
  useEffect(() => {
    let cancelled = false;
    getBusinessReviews(businessId)
      .then((list) => { if (!cancelled) setReviews(list); })
      .catch((e) => { if (!cancelled) setLoadError(e?.message ?? "Could not load the reviews."); });
    return () => { cancelled = true; };
  }, [businessId]);

  const byDate = (list) => [...list].sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")));

  async function add(form) {
    const created = await addBusinessReview(businessId, form);
    setReviews((list) => byDate([created, ...(list ?? [])]));
    setAdding(false);
  }

  async function update(id, form) {
    const saved = await updateBusinessReview(id, form);
    setReviews((list) => byDate((list ?? []).map((r) => (r.id === id ? saved : r))));
    setEditingId(null);
  }

  async function remove(id) {
    setActionError("");
    try {
      await deleteReview(id);
      setReviews((list) => (list ?? []).filter((r) => r.id !== id));
    } catch (e) {
      setActionError(e?.message ?? "Could not delete the review.");
    }
    setDeletingId(null);
  }

  const list = reviews ?? [];
  const onSite = new Set(list.filter((r) => r.status === "Visible").slice(0, MAX_LIVE_REVIEWS).map((r) => r.id));

  return (
    <div className="bg-white rounded-2xl p-6" style={CARD}>
      <EditorSection title="Reviews" hint={hint ?? "Reviews on the business's page. Each one saves on its own and goes live straight away; only the 6 most recent live reviews show at once."}>
        <Locked field="reviews">
          <div className="flex flex-col gap-3">
            {loadError && <p className="text-xs font-semibold" style={{ color: "#991B1B" }}>{loadError}</p>}
            {actionError && <p className="text-xs font-semibold" style={{ color: "#991B1B" }}>{actionError}</p>}
            {!adding && reviews && (
              <button type="button" onClick={() => { setAdding(true); setEditingId(null); }}
                className="self-start px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ backgroundColor: "rgba(37,99,235,0.1)", color: BLUE, border: "1.5px solid rgba(37,99,235,0.3)" }}>
                + Add Review
              </button>
            )}
            {adding && <ReviewForm onSave={add} onCancel={() => setAdding(false)} />}
            {!reviews && !loadError && <p className="text-sm" style={{ color: MUTED }}>Loading reviews…</p>}
            {reviews && list.length === 0 && !adding && <p className="text-sm" style={{ color: MUTED }}>No reviews yet.</p>}

            {list.map((r) => {
              if (editingId === r.id) {
                return <ReviewForm key={r.id} initial={r} onSave={(form) => update(r.id, form)} onCancel={() => setEditingId(null)} />;
              }
              const statusKey = r.status === "Visible" && !onSite.has(r.id) ? "VisibleQueued" : r.status;
              const s = STATUS[statusKey] ?? STATUS["Pending Approval"];
              return (
                <div key={r.id} className="rounded-2xl p-4 flex flex-col gap-2" style={{ border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: NAVY }}>{r.reviewer}</span>
                      <Stars rating={r.rating ?? 0} />
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.fg }}>{s.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: "#9CA3AF" }}>{formatUK(r.date)}</span>
                      {deletingId === r.id ? (
                        <>
                          <span className="text-xs" style={{ color: MUTED }}>Delete for good?</span>
                          <button type="button" onClick={() => remove(r.id)} className="text-xs font-semibold" style={{ color: "#991B1B" }}>Yes, delete</button>
                          <button type="button" onClick={() => setDeletingId(null)} className="text-xs font-semibold" style={{ color: MUTED }}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => { setEditingId(r.id); setAdding(false); }} className="text-xs font-semibold" style={{ color: BLUE }}>Edit</button>
                          <button type="button" onClick={() => setDeletingId(r.id)} className="text-xs font-semibold" style={{ color: "#991B1B" }}>Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-sm" style={{ color: NAVY }}>{r.text}</p>
                  {r.status === "Pending Approval" && (
                    <p className="text-xs" style={{ color: MUTED }}>Added by the business — approve it in Review Moderation.</p>
                  )}
                  {r.verificationLink && (
                    <a href={r.verificationLink} target="_blank" rel="noreferrer" className="self-start text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: BLUE }}>
                      Verification Link ↗
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </Locked>
      </EditorSection>
    </div>
  );
}
