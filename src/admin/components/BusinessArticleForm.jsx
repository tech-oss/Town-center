import { useState } from "react";
import { saveBusinessArticle } from "../../api/admin";
import { uploadImage } from "../../lib/uploadImage";
import FocalPointPicker from "./FocalPointPicker";
import { BLUE, BORDER, CARD, MUTED, NAVY } from "../theme";

// Editing a news post or offer that a business wrote.
//
// Admin could approve, reject, hide and delete these but never change a word,
// so a post that was nearly right had to be rejected and sent back rather
// than simply fixed. This is the same handful of fields the business fills in
// on its own dashboard — title, News or Offer, the dates it runs, a picture
// and the text.
//
// What admin cannot change here is whose post it is or what state it is in:
// the business stays the author, and moving a post between Live, Hidden and
// Rejected is what the moderation buttons are for.

const INPUT = { border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" };

function Field({ label, hint, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold" style={{ color: MUTED }}>{label}</span>
      {children}
      {hint && <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{hint}</span>}
    </label>
  );
}

export default function BusinessArticleForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    id: initial.id,
    title: initial.title ?? "",
    type: initial.type || "News",
    startDate: initial.startDate ?? "",
    endDate: initial.endDate ?? "",
    heroImage: initial.heroImage ?? "",
    body: initial.body ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.title.trim()) return setError("The post needs a title.");
    setSaving(true);
    setError("");
    try {
      const saved = await saveBusinessArticle(form);
      onSave(saved);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-5" style={CARD}>
      <div className="pb-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <p className="text-sm font-bold" style={{ color: NAVY }}>Edit post</p>
        <p className="text-xs mt-1" style={{ color: MUTED }}>
          Written by {initial.businessName}. Your changes go straight to their listing — the post keeps its
          current status, and stays theirs.
        </p>
      </div>

      <Field label="Title *">
        <input className="rounded-xl px-3 py-2.5 text-sm outline-none" style={INPUT}
          value={form.title} onChange={(e) => set("title", e.target.value)} />
      </Field>

      <Field label="Kind">
        <select className="rounded-xl px-3 py-2.5 text-sm outline-none" style={INPUT}
          value={form.type} onChange={(e) => set("type", e.target.value)}>
          <option>News</option>
          <option>Offer</option>
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Runs from" hint="Optional — shown on the card">
          <input type="date" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={INPUT}
            value={form.startDate ?? ""} onChange={(e) => set("startDate", e.target.value)} />
        </Field>
        <Field label="Runs until">
          <input type="date" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={INPUT}
            value={form.endDate ?? ""} onChange={(e) => set("endDate", e.target.value)} />
        </Field>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold" style={{ color: MUTED }}>Picture</span>
        <div className="flex items-center gap-4 flex-wrap">
          {form.heroImage
            ? <img src={form.heroImage} alt="" className="w-32 h-20 rounded-xl object-cover" style={{ border: `1.5px solid ${BORDER}` }} />
            : <div className="w-32 h-20 rounded-xl flex items-center justify-center text-[10px] text-center px-2"
                style={{ border: `1.5px dashed ${BORDER}`, color: "#9CA3AF" }}>No picture</div>}
          <label className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
            style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: "1.5px solid rgba(37,99,235,0.25)" }}>
            {busy ? "Uploading…" : form.heroImage ? "Replace" : "Upload"}
            <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBusy(true);
              uploadImage(file, "articles")
                .then((url) => set("heroImage", url))
                .catch((err) => setError(err.message))
                .finally(() => setBusy(false));
            }} />
          </label>
          {form.heroImage && (
            <button onClick={() => set("heroImage", "")} className="text-xs font-semibold" style={{ color: "#991B1B" }}>
              Remove
            </button>
          )}
        </div>
        <FocalPointPicker value={form.heroImage} onChange={(v) => set("heroImage", v)} />
      </div>

      <Field label="The post">
        <textarea rows={10} className="rounded-xl px-3 py-2.5 text-sm outline-none resize-y" style={INPUT}
          value={form.body} onChange={(e) => set("body", e.target.value)} />
      </Field>

      {error && (
        <p className="text-sm rounded-xl px-4 py-3" style={{ backgroundColor: "rgba(220,38,38,0.07)", color: "#991B1B" }}>
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
        <button onClick={handleSave} disabled={saving || !form.title.trim()}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: BLUE }}>
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button onClick={onCancel}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold"
          style={{ border: `1.5px solid ${BORDER}`, color: NAVY }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
