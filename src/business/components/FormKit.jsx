import { useState } from "react";

// ─── Theme — mirrors the admin panel's "Modern Blue" design system ───────────
export const NAVY   = "#1E293B";
export const BLUE   = "#2563EB";
export const MUTED  = "#64748B";
export const BORDER = "rgba(16,24,40,0.12)";
export const CARD   = { backgroundColor: "#fff", border: "1px solid #eef1f6", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };
export const INPUT  = { border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" };

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

export function Inp({ ...props }) {
  return <input className="rounded-xl px-3 py-2.5 text-sm outline-none" style={INPUT} {...props} />;
}

export function TextArea({ rows = 3, ...props }) {
  return <textarea rows={rows} className="rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={INPUT} {...props} />;
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer w-fit">
      <div onClick={() => onChange(!checked)}
        className="w-10 h-5 rounded-full transition-colors flex items-center px-0.5"
        style={{ backgroundColor: checked ? BLUE : "#D1D5DB" }}>
        <div className="w-4 h-4 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }} />
      </div>
      {label && <span className="text-sm" style={{ color: NAVY }}>{label}</span>}
    </label>
  );
}

export function SectionTitle({ title, action }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-3">
      <h3 className="text-sm font-bold" style={{ color: NAVY }}>{title}</h3>
      {action}
    </div>
  );
}

export function EditorSection({ title, children }) {
  return (
    <div>
      <p className="text-sm font-bold mb-4 pb-2" style={{ color: NAVY, borderBottom: `1px solid ${BORDER}` }}>{title}</p>
      {children}
    </div>
  );
}

export function SaveBar({ onSave, saving, dirty, savedAt }) {
  return (
    <div className="flex items-center gap-3 pt-4 mt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
      <button onClick={onSave} disabled={saving || !dirty}
        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40 hover:opacity-90"
        style={{ backgroundColor: BLUE }}>
        {saving ? "Saving…" : "Save Changes"}
      </button>
      {!dirty && savedAt && (
        <span className="text-xs" style={{ color: "#15803D" }}>✓ Saved</span>
      )}
    </div>
  );
}

// ─── Opening hours editor ─────────────────────────────────────────────────────
export function HoursEditor({ hours, onChange }) {
  function setDay(i, key, val) {
    onChange(hours.map((h, idx) => (idx === i ? { ...h, [key]: val } : h)));
  }
  return (
    <div className="flex flex-col gap-2">
      {hours.map((h, i) => (
        <div key={h.day} className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-medium w-24 shrink-0" style={{ color: NAVY }}>{h.day}</span>
          <Toggle checked={h.open} onChange={(v) => setDay(i, "open", v)} />
          {h.open ? (
            <>
              <input type="time" value={h.from} onChange={(e) => setDay(i, "from", e.target.value)}
                className="rounded-lg px-2 py-1.5 text-xs outline-none" style={{ border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" }} />
              <span className="text-xs" style={{ color: MUTED }}>to</span>
              <input type="time" value={h.to} onChange={(e) => setDay(i, "to", e.target.value)}
                className="rounded-lg px-2 py-1.5 text-xs outline-none" style={{ border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" }} />
            </>
          ) : (
            <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Closed</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Social links editor ──────────────────────────────────────────────────────
export function SocialEditor({ links, onChange }) {
  function set(k, v) { onChange({ ...links, [k]: v }); }
  const fields = [
    { key: "instagram",  label: "Instagram",  prefix: "@" },
    { key: "facebook",   label: "Facebook",   prefix: "fb.com/" },
    { key: "twitter",    label: "X / Twitter",prefix: "@" },
    { key: "tripadvisor",label: "TripAdvisor",prefix: "tripadvisor.com/" },
  ];
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {fields.map(({ key, label, prefix }) => (
        <Field key={key} label={label}>
          <div className="flex items-center rounded-xl overflow-hidden" style={{ border: `1.5px solid ${BORDER}` }}>
            <span className="px-3 py-2.5 text-xs shrink-0" style={{ backgroundColor: "#f8fafc", color: MUTED, borderRight: `1px solid ${BORDER}` }}>{prefix}</span>
            <input value={links?.[key] ?? ""} onChange={(e) => set(key, e.target.value)}
              placeholder={`${label} handle`}
              className="flex-1 px-3 py-2.5 text-sm outline-none bg-white" style={{ color: NAVY }} />
          </div>
        </Field>
      ))}
    </div>
  );
}

// ─── Image upload strip ───────────────────────────────────────────────────────
export function ImageStrip({ images, onChange, label = "Images", max = 5 }) {
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange([...images, { src: ev.target.result, name: file.name }]);
    reader.readAsDataURL(file);
  }
  function remove(i) { onChange(images.filter((_, idx) => idx !== i)); }
  return (
    <div>
      <p className="text-xs font-semibold mb-2" style={{ color: MUTED }}>{label}</p>
      <div className="flex flex-wrap gap-3 items-start">
        {images.map((img, i) => (
          <div key={i} className="relative group">
            <img src={img.src} alt={img.name} className="w-24 h-16 rounded-xl object-cover" style={{ border: `1.5px solid ${BORDER}` }} />
            <button onClick={() => remove(i)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: "#DC2626" }}>✕</button>
          </div>
        ))}
        {images.length < max && (
          <label className="w-24 h-16 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors hover:bg-blue-50"
            style={{ border: `1.5px dashed ${BORDER}`, backgroundColor: "#f8fafc" }}>
            <span className="text-xl" style={{ color: MUTED }}>+</span>
            <span className="text-[10px]" style={{ color: MUTED }}>Add image</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
        )}
      </div>
      <p className="text-[10px] mt-1.5" style={{ color: "#9CA3AF" }}>PNG, JPG · max {max} images</p>
    </div>
  );
}

// ─── Simple text-chip list editor (amenities / facilities) ──────────────────
export function ChipListEditor({ items, onChange, placeholder = "Add item…" }) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft("");
  }
  function remove(i) { onChange(items.filter((_, idx) => idx !== i)); }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: `1.5px solid rgba(37,99,235,0.2)` }}>
            {it}
            <button onClick={() => remove(i)} className="font-bold" style={{ color: "#DC2626" }}>✕</button>
          </span>
        ))}
        {items.length === 0 && <span className="text-xs" style={{ color: "#9CA3AF" }}>None added yet</span>}
      </div>
      <div className="flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 rounded-xl px-3 py-2 text-sm outline-none" style={INPUT} />
        <button onClick={add} type="button" className="px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: `1.5px solid rgba(37,99,235,0.25)` }}>
          Add
        </button>
      </div>
    </div>
  );
}
