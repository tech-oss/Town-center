import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

async function uploadToStorage(file, pathPrefix) {
  const path = `${pathPrefix}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("business-media").upload(path, file);
  if (error) throw error;
  return supabase.storage.from("business-media").getPublicUrl(path).data.publicUrl;
}

// ─── Theme — mirrors the public site's teal/navy design tokens ───────────────
export const FOREST = "var(--forest)"; // #1C2E38 dark navy — headings, body text
export const LEAF    = "var(--leaf)";   // #2FA4A4 mid teal — secondary accents
export const SAGE     = "var(--sage)";   // #52C7B6 primary teal — CTAs
export const MUTED    = "#64748B";
export const BORDER   = "rgba(28,46,56,0.14)";
export const CARD     = { backgroundColor: "#fff", border: "1px solid rgba(28,46,56,0.08)", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };
export const INPUT     = { border: `1.5px solid ${BORDER}`, color: FOREST, backgroundColor: "#fff" };

export function Field({ label, required, span2, children, hint }) {
  return (
    <label className={`flex flex-col gap-1.5${span2 ? " sm:col-span-2" : ""}`}>
      <span className="text-xs font-semibold" style={{ color: MUTED }}>
        {label}{required && <span style={{ color: "#DC2626" }}> *</span>}
      </span>
      {children}
      {hint && <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{hint}</span>}
    </label>
  );
}

export function Inp(props) {
  return <input className="rounded-xl px-3 py-2.5 text-sm outline-none" style={INPUT} {...props} />;
}
export function TextArea({ rows = 4, ...props }) {
  return <textarea rows={rows} className="rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={INPUT} {...props} />;
}
export function Select({ children, ...props }) {
  return <select className="rounded-xl px-3 py-2.5 text-sm outline-none" style={INPUT} {...props}>{children}</select>;
}

export function Toggle({ checked, onChange, label, sublabel }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer w-fit">
      <div onClick={() => onChange(!checked)}
        className="w-10 h-5 rounded-full transition-colors flex items-center px-0.5 mt-0.5 shrink-0"
        style={{ backgroundColor: checked ? SAGE : "#D1D5DB" }}>
        <div className="w-4 h-4 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }} />
      </div>
      {label && (
        <div>
          <span className="text-sm font-medium block" style={{ color: FOREST }}>{label}</span>
          {sublabel && <span className="text-xs block mt-0.5" style={{ color: MUTED }}>{sublabel}</span>}
        </div>
      )}
    </label>
  );
}

export function EditorSection({ title, hint, children, action }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1 pb-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <p className="text-sm font-bold" style={{ color: FOREST }}>{title}</p>
        {action}
      </div>
      {hint && <p className="text-[11px] mt-2" style={{ color: "#9CA3AF" }}>{hint}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

// ─── Approval status badge (per My Listing tab) ───────────────────────────────
export function ApprovalBadge({ status, rejectionReason }) {
  const map = {
    "Up to Date":       { bg: "rgba(82,199,182,0.16)", fg: "#0F766E" },
    "Pending Approval": { bg: "rgba(232,163,61,0.16)", fg: "#92400E" },
    "Changes Rejected": { bg: "rgba(220,38,38,0.1)",   fg: "#991B1B" },
  };
  const c = map[status] ?? map["Up to Date"];
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ backgroundColor: c.bg, color: c.fg }}
      title={status === "Changes Rejected" ? rejectionReason ?? "Contact support for details." : undefined}>
      {status}
    </span>
  );
}

// ─── Toast ──────────────────────────────────────────────────────────────────
export function useToast() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3200);
    return () => clearTimeout(t);
  }, [msg]);
  return [msg, setMsg];
}
export function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
      style={{ backgroundColor: FOREST, boxShadow: "0 8px 24px -6px rgba(0,0,0,0.35)" }}>
      <span>✓</span> {message}
    </div>
  );
}

export function SaveBar({ onSave, saving, status, rejectionReason }) {
  return (
    <div className="flex items-center gap-3 pt-4 mt-2 flex-wrap" style={{ borderTop: `1px solid ${BORDER}` }}>
      <button onClick={onSave} disabled={saving}
        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
        style={{ backgroundColor: SAGE }}>
        {saving ? "Submitting…" : "Save Changes"}
      </button>
      {status && <ApprovalBadge status={status} rejectionReason={rejectionReason} />}
    </div>
  );
}

// ─── Image upload (hero/logo, single) ─────────────────────────────────────────
export function SingleImageUpload({ src, onChange, label, round = false, aspect = "aspect-video", pathPrefix }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  async function handleFiles(files) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToStorage(file, pathPrefix ?? "misc");
      onChange(url);
    } finally {
      setUploading(false);
    }
  }
  return (
    <div>
      {label && <p className="text-xs font-semibold mb-2" style={{ color: MUTED }}>{label}</p>}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={`relative overflow-hidden ${round ? "w-24 h-24 rounded-full" : `w-full max-w-md ${aspect} rounded-2xl`}`}
        style={{ border: dragOver ? `2px dashed ${SAGE}` : `1.5px solid ${BORDER}`, backgroundColor: "#f8fafc" }}>
        {src ? (
          <img src={src} alt={label || "preview"} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <span className="text-2xl" style={{ color: "#9CA3AF" }}>+</span>
            <span className="text-[10px] text-center px-2" style={{ color: "#9CA3AF" }}>Drop image or click Replace</span>
          </div>
        )}
      </div>
      <label className="inline-block mt-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
        style={{ backgroundColor: "rgba(82,199,182,0.12)", color: "#0F766E", border: `1.5px solid rgba(82,199,182,0.35)` }}>
        {uploading ? "Uploading…" : src ? "Replace Image" : "Upload Image"}
        <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => handleFiles(e.target.files)} />
      </label>
    </div>
  );
}

// ─── Gallery grid (up to N slots) ─────────────────────────────────────────────
export function GalleryGrid({ images, onChange, max = 6, label, pathPrefix }) {
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const slots = Array.from({ length: max }, (_, i) => images[i] ?? null);
  async function handleFile(i, files) {
    const file = files?.[0];
    if (!file) return;
    setUploadingIndex(i);
    try {
      const url = await uploadToStorage(file, pathPrefix ?? "misc");
      const next = [...images];
      next[i] = url;
      onChange(next.filter(Boolean));
    } finally {
      setUploadingIndex(null);
    }
  }
  function remove(i) {
    const next = [...images];
    next.splice(i, 1);
    onChange(next);
  }
  return (
    <div>
      {label && <p className="text-xs mb-3" style={{ color: MUTED }}>{label}</p>}
      <div className="grid grid-cols-3 gap-3 max-w-lg">
        {slots.map((src, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden group"
            style={{ border: `1.5px ${src ? "solid" : "dashed"} ${BORDER}`, backgroundColor: "#f8fafc" }}>
            {src ? (
              <>
                <img src={src} alt={`gallery ${i + 1}`} className="w-full h-full object-cover" />
                <button onClick={() => remove(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: "#DC2626" }}>✕</button>
              </>
            ) : (
              <label className="w-full h-full flex items-center justify-center cursor-pointer">
                <span className="text-xl" style={{ color: "#9CA3AF" }}>{uploadingIndex === i ? "…" : "+"}</span>
                <input type="file" accept="image/*" className="hidden" disabled={uploadingIndex === i} onChange={(e) => handleFile(i, e.target.files)} />
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Opening hours 7-row editor ────────────────────────────────────────────────
export function HoursEditor({ hours, onChange }) {
  function setDay(i, key, val) { onChange(hours.map((h, idx) => (idx === i ? { ...h, [key]: val } : h))); }
  return (
    <div className="flex flex-col gap-2">
      {hours.map((h, i) => (
        <div key={h.day} className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-medium w-24 shrink-0" style={{ color: FOREST }}>{h.day}</span>
          <Toggle checked={h.open} onChange={(v) => setDay(i, "open", v)} />
          {h.open ? (
            <>
              <input type="time" value={h.from} onChange={(e) => setDay(i, "from", e.target.value)}
                className="rounded-lg px-2 py-1.5 text-xs outline-none" style={{ border: `1.5px solid ${BORDER}`, color: FOREST, backgroundColor: "#fff" }} />
              <span className="text-xs" style={{ color: MUTED }}>to</span>
              <input type="time" value={h.to} onChange={(e) => setDay(i, "to", e.target.value)}
                className="rounded-lg px-2 py-1.5 text-xs outline-none" style={{ border: `1.5px solid ${BORDER}`, color: FOREST, backgroundColor: "#fff" }} />
            </>
          ) : (
            <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Closed</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Social links ──────────────────────────────────────────────────────────────
export function SocialFields({ links, onChange }) {
  function set(k, v) { onChange({ ...links, [k]: v }); }
  const fields = [
    { key: "instagram", label: "Instagram URL" },
    { key: "facebook",  label: "Facebook URL" },
    { key: "twitter",   label: "Twitter / X URL" },
  ];
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {fields.map(({ key, label }) => (
        <Field key={key} label={label}>
          <Inp value={links?.[key] ?? ""} onChange={(e) => set(key, e.target.value)} placeholder="https://…" />
        </Field>
      ))}
    </div>
  );
}

// ─── Lat/Lng + static OpenStreetMap preview ───────────────────────────────────
// TODO: Supabase storage for coordinates
export function LocationFields({ lat, lng, onChange }) {
  const hasCoords = lat !== "" && lng !== "" && lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
  const mapSrc = hasCoords
    ? `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=15&size=420x180&markers=${lat},${lng},red-pushpin`
    : null;
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4 mb-3">
        <Field label="Latitude"><Inp type="number" step="0.000001" value={lat ?? ""} onChange={(e) => onChange({ lat: e.target.value, lng })} placeholder="e.g. 51.5225" /></Field>
        <Field label="Longitude"><Inp type="number" step="0.000001" value={lng ?? ""} onChange={(e) => onChange({ lat, lng: e.target.value })} placeholder="e.g. -0.7234" /></Field>
      </div>
      <p className="text-[11px] mb-3" style={{ color: "#9CA3AF" }}>Right-click your location in Google Maps to copy coordinates.</p>
      <div className="rounded-xl overflow-hidden max-w-md" style={{ border: `1.5px solid ${BORDER}`, backgroundColor: "#f8fafc", minHeight: 120 }}>
        {mapSrc ? <img src={mapSrc} alt="Map preview" className="w-full h-auto block" /> : (
          <div className="h-[120px] flex items-center justify-center text-xs" style={{ color: "#9CA3AF" }}>Enter coordinates to preview the map pin</div>
        )}
      </div>
    </div>
  );
}

// ─── Repeatable list (FAQs handled separately; this is for plain text lists) ──
export function RepeatableList({ items, onChange, placeholder = "" }) {
  function set(i, v) { onChange(items.map((it, idx) => (idx === i ? v : it))); }
  function add() { onChange([...items, ""]); }
  function remove(i) { onChange(items.filter((_, idx) => idx !== i)); }
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  return (
    <div className="flex flex-col gap-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5 shrink-0">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-[10px] leading-none disabled:opacity-20" style={{ color: MUTED }}>▲</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="text-[10px] leading-none disabled:opacity-20" style={{ color: MUTED }}>▼</button>
          </div>
          <input value={it} onChange={(e) => set(i, e.target.value)} placeholder={placeholder}
            className="flex-1 rounded-lg px-3 py-2 text-xs outline-none" style={INPUT} />
          <button onClick={() => remove(i)} className="text-xs font-bold shrink-0 w-6 h-6 rounded-lg" style={{ color: "#DC2626" }}>✕</button>
        </div>
      ))}
      <button onClick={add} type="button" className="self-start text-xs font-semibold mt-1 transition-opacity hover:opacity-70" style={{ color: "#0F766E" }}>+ Add</button>
    </div>
  );
}

// ─── FAQ repeatable list (question/answer pairs) ──────────────────────────────
export function FaqListEditor({ items, onChange }) {
  function set(i, k, v) { onChange(items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it))); }
  function add() { onChange([...items, { id: `faq${Date.now()}`, question: "", answer: "" }]); }
  function remove(i) { onChange(items.filter((_, idx) => idx !== i)); }
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  return (
    <div className="flex flex-col gap-3">
      {items.map((it, i) => (
        <div key={it.id ?? i} className="rounded-xl p-4 flex flex-col gap-2" style={{ border: `1.5px solid ${BORDER}`, backgroundColor: "#f8fafc" }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>FAQ {i + 1}</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-xs disabled:opacity-20" style={{ color: MUTED }}>▲</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="text-xs disabled:opacity-20" style={{ color: MUTED }}>▼</button>
              <button onClick={() => remove(i)} className="text-xs font-bold" style={{ color: "#DC2626" }}>Remove</button>
            </div>
          </div>
          <Inp value={it.question} onChange={(e) => set(i, "question", e.target.value)} placeholder="Question" />
          <TextArea rows={2} value={it.answer} onChange={(e) => set(i, "answer", e.target.value)} placeholder="Answer" />
        </div>
      ))}
      <button onClick={add} type="button" className="self-start text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: "#0F766E" }}>+ Add FAQ</button>
    </div>
  );
}

// ─── Confirmation modal ────────────────────────────────────────────────────────
export function ConfirmModal({ title, body, confirmLabel = "Confirm", danger = true, onConfirm, onCancel, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(16,24,40,0.5)" }}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <p className="text-base font-bold" style={{ color: FOREST }}>{title}</p>
        {body && <p className="text-sm" style={{ color: MUTED }}>{body}</p>}
        {children}
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: danger ? "#DC2626" : SAGE }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Star rating (display only) ────────────────────────────────────────────────
export function Stars({ rating, size = 14 }) {
  return (
    <span style={{ fontSize: size, color: "#E8A33D", letterSpacing: 1 }}>
      {"★".repeat(rating)}<span style={{ color: "#E5E7EB" }}>{"★".repeat(5 - rating)}</span>
    </span>
  );
}
