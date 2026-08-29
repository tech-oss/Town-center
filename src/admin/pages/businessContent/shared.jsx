import { useState, useEffect } from "react";

// ─── Theme — matches the rest of the admin panel ──────────────────────────────
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

export function EditorSection({ title, hint, children }) {
  return (
    <div>
      <p className="text-sm font-bold mb-1 pb-2" style={{ color: NAVY, borderBottom: `1px solid ${BORDER}` }}>{title}</p>
      {hint && <p className="text-[11px] mb-4" style={{ color: "#9CA3AF" }}>{hint}</p>}
      <div className={hint ? "mt-4" : "mt-4"}>{children}</div>
    </div>
  );
}

export function StatusPill({ status }) {
  const map = {
    Published: { bg: "rgba(16,163,74,0.1)", fg: "#15803D" },
    Draft:     { bg: "rgba(245,158,11,0.12)", fg: "#B45309" },
    Hidden:    { bg: "rgba(100,116,139,0.12)", fg: "#475569" },
  };
  const c = map[status] || map.Draft;
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: c.bg, color: c.fg }}>
      {status}
    </span>
  );
}

export function StatusDot({ status }) {
  const color = status === "Published" ? "#15803D" : status === "Hidden" ? "#94A3B8" : "#B45309";
  return <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} title={status} />;
}

export function SectionBadge({ section, label }) {
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
      style={{ backgroundColor: "rgba(37,99,235,0.1)", color: BLUE }}>
      {label}
    </span>
  );
}

// ─── Save button + toast ──────────────────────────────────────────────────────
export function useToast() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2600);
    return () => clearTimeout(t);
  }, [msg]);
  return [msg, setMsg];
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2 animate-[fadeIn_0.2s_ease]"
      style={{ backgroundColor: "#15803D", boxShadow: "0 8px 24px -6px rgba(0,0,0,0.35)" }}>
      <span>✓</span> {message}
    </div>
  );
}

export function SaveBar({ onSave, saving }) {
  return (
    <div className="flex gap-3 pt-4 mt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
      <button onClick={onSave} disabled={saving}
        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
        style={{ backgroundColor: BLUE }}>
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}

// ─── Single hero / logo image upload with replace + drag-drop ────────────────
// TODO: wire to Supabase storage bucket on backend integration
export function SingleImageUpload({ src, onChange, label, round = false, aspect = "aspect-video" }) {
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files) {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  }

  return (
    <div>
      {label && <p className="text-xs font-semibold mb-2" style={{ color: MUTED }}>{label}</p>}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={`relative overflow-hidden ${round ? "w-24 h-24 rounded-full" : `w-full max-w-md ${aspect} rounded-2xl`}`}
        style={{ border: dragOver ? `2px dashed ${BLUE}` : `1.5px solid ${BORDER}`, backgroundColor: "#f8fafc" }}
      >
        {src ? (
          <img src={src} alt={label || "preview"} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <span className="text-2xl" style={{ color: "#9CA3AF" }}>+</span>
            <span className="text-[10px]" style={{ color: "#9CA3AF" }}>Drop image or click Replace</span>
          </div>
        )}
      </div>
      <label className="inline-block mt-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
        style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: `1.5px solid rgba(37,99,235,0.25)` }}>
        {src ? "Replace Image" : "Upload Image"}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </label>
    </div>
  );
}

// ─── 6-slot gallery grid (3×2) ────────────────────────────────────────────────
// TODO: wire to Supabase storage bucket on backend integration
export function GalleryGrid({ images, onChange, max = 6, label }) {
  const slots = Array.from({ length: max }, (_, i) => images[i] ?? null);

  function handleFile(i, files) {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const next = [...images];
      next[i] = ev.target.result;
      onChange(next.filter(Boolean));
    };
    reader.readAsDataURL(file);
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
                <span className="text-xl" style={{ color: "#9CA3AF" }}>+</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(i, e.target.files)} />
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Opening hours (7-row) editor ─────────────────────────────────────────────
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

// ─── Latitude / Longitude fields + static OpenStreetMap preview ──────────────
export function LocationFields({ lat, lng, onChange }) {
  const hasCoords = lat !== "" && lng !== "" && lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
  const mapSrc = hasCoords
    ? `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=15&size=420x180&markers=${lat},${lng},red-pushpin`
    : null;

  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4 mb-3">
        <Field label="Latitude">
          <Inp type="number" step="0.000001" value={lat ?? ""} onChange={(e) => onChange({ lat: e.target.value, lng })} placeholder="e.g. 51.5225" />
        </Field>
        <Field label="Longitude">
          <Inp type="number" step="0.000001" value={lng ?? ""} onChange={(e) => onChange({ lat, lng: e.target.value })} placeholder="e.g. -0.7234" />
        </Field>
      </div>
      <p className="text-[11px] mb-3" style={{ color: "#9CA3AF" }}>
        Enter the precise coordinates for this business. You can find these from Google Maps by right-clicking the location.
      </p>
      <div className="rounded-xl overflow-hidden max-w-md" style={{ border: `1.5px solid ${BORDER}`, backgroundColor: "#f8fafc", minHeight: 120 }}>
        {mapSrc ? (
          <img src={mapSrc} alt="Map preview" className="w-full h-auto block" />
        ) : (
          <div className="h-[120px] flex items-center justify-center text-xs" style={{ color: "#9CA3AF" }}>
            Enter coordinates to preview the map pin
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Repeatable text-list editor (services, why-choose-us, areas, features) ──
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
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
              className="text-[10px] leading-none disabled:opacity-20" style={{ color: MUTED }}>▲</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1}
              className="text-[10px] leading-none disabled:opacity-20" style={{ color: MUTED }}>▼</button>
          </div>
          <input value={it} onChange={(e) => set(i, e.target.value)} placeholder={placeholder}
            className="flex-1 rounded-lg px-3 py-2 text-xs outline-none" style={INPUT} />
          <button onClick={() => remove(i)} className="text-xs font-bold shrink-0 w-6 h-6 rounded-lg" style={{ color: "#DC2626" }}>✕</button>
        </div>
      ))}
      <button onClick={add} type="button" className="self-start text-xs font-semibold mt-1 transition-opacity hover:opacity-70" style={{ color: BLUE }}>+ Add</button>
    </div>
  );
}

// ─── Stat tile editor (4 value/label pairs) ───────────────────────────────────
export function StatTilesEditor({ stats, onChange }) {
  function set(i, key, v) { onChange(stats.map((s, idx) => (idx === i ? { ...s, [key]: v } : s))); }
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {stats.map((s, i) => (
        <div key={i} className="rounded-xl p-3 flex gap-2" style={{ border: `1.5px solid ${BORDER}`, backgroundColor: "#f8fafc" }}>
          <input value={s.value} onChange={(e) => set(i, "value", e.target.value)} placeholder="e.g. 10+"
            className="w-20 rounded-lg px-2 py-2 text-xs outline-none text-center font-bold" style={INPUT} />
          <input value={s.label} onChange={(e) => set(i, "label", e.target.value)} placeholder="e.g. Years in Business"
            className="flex-1 rounded-lg px-2 py-2 text-xs outline-none" style={INPUT} />
        </div>
      ))}
    </div>
  );
}
