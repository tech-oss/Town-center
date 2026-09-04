import { useState } from "react";
import { Stars, Field, Inp, TextArea, Select, ConfirmModal, MUTED, BORDER, FOREST, SAGE } from "./FormKit";

// ─── Rating breakdown bar chart ────────────────────────────────────────────────
function RatingBreakdown({ reviews }) {
  const total = reviews.length || 1;
  const counts = [5, 4, 3, 2, 1].map((star) => reviews.filter((r) => r.rating === star).length);
  return (
    <div className="flex flex-col gap-1.5">
      {[5, 4, 3, 2, 1].map((star, i) => (
        <div key={star} className="flex items-center gap-2 text-xs">
          <span className="w-8 shrink-0" style={{ color: MUTED }}>{star}★</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#EEF2F1" }}>
            <div className="h-full rounded-full" style={{ width: `${(counts[i] / total) * 100}%`, backgroundColor: "#D97706" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReviewsSummary({ reviews }) {
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col sm:flex-row gap-6 items-start sm:items-center"
      style={{ border: "1px solid rgba(16,24,40,0.08)", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" }}>
      <div className="text-center shrink-0">
        <p className="text-3xl font-bold" style={{ color: FOREST }}>{avg}</p>
        <Stars rating={Math.round(reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0)} size={16} />
        <p className="text-xs mt-1" style={{ color: MUTED }}>{reviews.length} review{reviews.length === 1 ? "" : "s"}</p>
      </div>
      <div className="flex-1 w-full">
        <RatingBreakdown reviews={reviews} />
      </div>
    </div>
  );
}

const EMPTY_REVIEW = { reviewer: "", rating: 5, date: new Date().toISOString().slice(0, 10), text: "", verificationLink: "" };

// A valid web URL — requires an http(s) scheme so a plain word or
// malformed text can't be saved as a "verification link".
function isValidWebUrl(value) {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// ─── Add / Edit review form ─────────────────────────────────────────────────────
function ReviewForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? { ...EMPTY_REVIEW });
  const [linkTouched, setLinkTouched] = useState(false);
  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  const linkValid = isValidWebUrl(form.verificationLink || "");
  const linkError = linkTouched && !linkValid
    ? (form.verificationLink.trim() ? "Enter a valid web URL (e.g. https://…)" : "Verification link is required")
    : "";
  const canSave = form.reviewer.trim() && form.text.trim() && linkValid;

  function handleSave() {
    setLinkTouched(true);
    if (canSave) onSave(form);
  }

  return (
    <div className="rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: "rgba(37,99,235,0.05)", border: "1.5px solid rgba(37,99,235,0.2)" }}>
      <p className="text-sm font-bold" style={{ color: FOREST }}>{initial ? "Edit Review" : "Add Review"}</p>
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Reviewer Name"><Inp value={form.reviewer} onChange={(e) => set("reviewer", e.target.value)} placeholder="e.g. Hannah B." /></Field>
        <Field label="Rating">
          <Select value={form.rating} onChange={(e) => set("rating", Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n === 1 ? "" : "s"}</option>)}
          </Select>
        </Field>
        <Field label="Date"><Inp type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /></Field>
      </div>
      <Field label="Review Text"><TextArea rows={3} value={form.text} onChange={(e) => set("text", e.target.value)} placeholder="What did the customer say?" /></Field>
      <Field label="Verification Link" required hint="A link proving this review is genuine (e.g. Google/Trustpilot review URL)">
        <Inp
          value={form.verificationLink}
          onChange={(e) => set("verificationLink", e.target.value)}
          onBlur={() => setLinkTouched(true)}
          placeholder="https://…"
          style={linkError ? { borderColor: "#DC2626" } : undefined}
        />
        {linkError && <span className="text-[10px]" style={{ color: "#DC2626" }}>{linkError}</span>}
      </Field>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={!form.reviewer.trim() || !form.text.trim()}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40" style={{ backgroundColor: SAGE }}>Save</button>
        <button onClick={onCancel} className="px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>Cancel</button>
      </div>
    </div>
  );
}

export default function ReviewsList({ reviews, onAdd, onUpdate, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const canManage = !!onAdd;

  return (
    <div className="flex flex-col gap-3">
      {canManage && !adding && (
        <button onClick={() => setAdding(true)}
          className="self-start px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ backgroundColor: "rgba(37,99,235,0.1)", color: "#2563EB", border: "1.5px solid rgba(37,99,235,0.3)" }}>
          + Add Review
        </button>
      )}
      {adding && (
        <ReviewForm onCancel={() => setAdding(false)} onSave={(form) => { onAdd(form); setAdding(false); }} />
      )}

      {deletingId && (
        <ConfirmModal title="Delete this review?" body="This review will be permanently removed." confirmLabel="Delete"
          onConfirm={() => { onDelete(deletingId); setDeletingId(null); }} onCancel={() => setDeletingId(null)} />
      )}

      {reviews.length === 0 && !adding && <p className="text-sm" style={{ color: MUTED }}>No reviews yet.</p>}

      {reviews.map((r) => (
        editingId === r.id ? (
          <ReviewForm key={r.id} initial={r} onCancel={() => setEditingId(null)}
            onSave={(form) => { onUpdate(r.id, form); setEditingId(null); }} />
        ) : (
        <div key={r.id} className="bg-white rounded-2xl p-4 flex flex-col gap-2" style={{ border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: FOREST }}>{r.reviewer}</span>
              <Stars rating={r.rating} />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: "#9CA3AF" }}>{r.date}</span>
              {canManage && (
                <>
                  <button onClick={() => setEditingId(r.id)} className="text-xs font-semibold" style={{ color: "#2563EB" }}>Edit</button>
                  <button onClick={() => setDeletingId(r.id)} className="text-xs font-semibold" style={{ color: "#991B1B" }}>Delete</button>
                </>
              )}
            </div>
          </div>
          <p className="text-sm" style={{ color: FOREST }}>{r.text}</p>

          {r.verificationLink && (
            <a href={r.verificationLink} target="_blank" rel="noreferrer"
              className="self-start text-xs font-semibold mt-1 transition-opacity hover:opacity-70" style={{ color: "#2563EB" }}>
              Verification Link ↗
            </a>
          )}
        </div>
        )
      ))}
    </div>
  );
}
